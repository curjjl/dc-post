<template>
  <div class="response-panel">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <a-spin size="large">
        <template #indicator>
          <LoadingOutlined style="font-size: 24px" spin />
        </template>
      </a-spin>
      <p>请求发送中...</p>
    </div>

    <!-- 响应内容 -->
    <div v-else-if="response" class="response-content">
      <!-- 响应状态信息 -->
      <div class="response-status">
        <div class="status-line">
          <a-tag :color="getStatusColor(response.status)" class="status-tag">
            {{ response.status }} {{ response.statusText }}
          </a-tag>
          <span class="duration">{{ response.duration }}ms</span>
          <span class="size">{{ response.size }}</span>
        </div>
      </div>

      <!-- 响应内容标签页 -->
      <a-tabs v-model:activeKey="activeTab" class="response-tabs">
        <!-- 响应体 -->
        <a-tab-pane key="body" tab="Body">
          <div class="response-body">
            <div class="body-actions">
              <a-button-group size="small">
                <a-button
                  :type="bodyViewMode === 'formatted' ? 'primary' : 'default'"
                  @click="bodyViewMode = 'formatted'"
                >
                  格式化
                </a-button>
                <a-button
                  :type="bodyViewMode === 'raw' ? 'primary' : 'default'"
                  @click="bodyViewMode = 'raw'"
                >
                  原始
                </a-button>
              </a-button-group>

              <a-button size="small" @click="copyResponse">
                <template #icon><CopyOutlined /></template>
                复制
              </a-button>
            </div>

            <div ref="responseBodyContainer" class="response-body-content">
              <pre v-if="bodyViewMode === 'raw'" class="raw-content">{{
                responseBodyText
              }}</pre>
              <div
                v-else
                ref="bodyEditorContainer"
                class="body-editor-container"
              ></div>
            </div>
          </div>
        </a-tab-pane>

        <!-- 响应头 -->
        <a-tab-pane key="headers" tab="Headers">
          <div class="response-headers">
            <a-table
              :columns="headerColumns"
              :data-source="headerData"
              :pagination="false"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'key'">
                  <strong>{{ record.key }}</strong>
                </template>
                <template v-else-if="column.key === 'value'">
                  <code class="header-value">{{ record.value }}</code>
                </template>
              </template>
            </a-table>
          </div>
        </a-tab-pane>

        <!-- Cookies -->
        <a-tab-pane key="cookies" tab="Cookies">
          <div class="response-cookies">
            <a-empty v-if="!cookieData.length" description="无Cookie信息" />
            <a-list v-else :data-source="cookieData" size="small">
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-list-item-meta>
                    <template #title>
                      <strong>{{ item.name }}</strong>
                    </template>
                    <template #description>
                      <div class="cookie-details">
                        <span>值: {{ item.value }}</span>
                        <span v-if="item.domain">域: {{ item.domain }}</span>
                        <span v-if="item.path">路径: {{ item.path }}</span>
                        <span v-if="item.expires"
                          >过期: {{ item.expires }}</span
                        >
                      </div>
                    </template>
                  </a-list-item-meta>
                </a-list-item>
              </template>
            </a-list>
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>

    <!-- 无响应状态 -->
    <div v-else class="no-response">
      <a-empty description="暂无响应数据">
        <template #image>
          <ApiOutlined style="font-size: 48px; color: #d9d9d9" />
        </template>
      </a-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from "vue";
import {
  LoadingOutlined,
  CopyOutlined,
  ApiOutlined,
} from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import * as monaco from "monaco-editor";

const props = defineProps({
  response: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const activeTab = ref("body");
const bodyViewMode = ref("formatted");
const responseBodyContainer = ref(null);
const bodyEditorContainer = ref(null);
let bodyEditor = null;

// 响应体文本
const responseBodyText = computed(() => {
  if (!props.response?.data) return "";

  if (typeof props.response.data === "string") {
    return props.response.data;
  }

  return JSON.stringify(props.response.data, null, 2);
});

// 获取状态码颜色
const getStatusColor = (status) => {
  if (status >= 200 && status < 300) return "success";
  if (status >= 300 && status < 400) return "warning";
  if (status >= 400 && status < 500) return "error";
  if (status >= 500) return "error";
  return "default";
};

// Headers表格列配置
const headerColumns = [
  {
    title: "名称",
    key: "key",
    width: "30%",
  },
  {
    title: "值",
    key: "value",
    width: "70%",
  },
];

// Headers数据
const headerData = computed(() => {
  if (!props.response?.headers) return [];

  return Object.entries(props.response.headers).map(([key, value]) => ({
    key,
    value,
  }));
});

// Cookie数据
const cookieData = computed(() => {
  // 这里可以解析Set-Cookie头部信息
  const setCookieHeader = props.response?.headers?.["set-cookie"];
  if (!setCookieHeader) return [];

  // 简单的Cookie解析示例
  const cookies = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : [setCookieHeader];
  return cookies.map((cookie, index) => {
    const parts = cookie.split(";");
    const [nameValue] = parts;
    const [name, value] = nameValue.split("=");

    return {
      name: name?.trim(),
      value: value?.trim(),
      domain: extractCookieAttribute(parts, "Domain"),
      path: extractCookieAttribute(parts, "Path"),
      expires: extractCookieAttribute(parts, "Expires"),
    };
  });
});

// 提取Cookie属性
const extractCookieAttribute = (parts, attribute) => {
  const part = parts.find((p) =>
    p.trim().toLowerCase().startsWith(attribute.toLowerCase())
  );
  return part ? part.split("=")[1]?.trim() : null;
};

// 初始化响应体编辑器
const initBodyEditor = () => {
  if (!bodyEditorContainer.value || bodyEditor) return;

  try {
    const language = detectLanguage(responseBodyText.value);

    bodyEditor = monaco.editor.create(bodyEditorContainer.value, {
      value: responseBodyText.value,
      language,
      theme: "vs",
      readOnly: true,
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 12,
      lineNumbers: "on",
      wordWrap: "on",
      // 禁用一些可能导致Worker问题的功能
      quickSuggestions: false,
      parameterHints: { enabled: false },
      suggestOnTriggerCharacters: false,
      acceptSuggestionOnEnter: "off",
      tabCompletion: "off",
      wordBasedSuggestions: false,
      // 禁用语法检查相关功能
      validate: false,
      lint: {
        enable: false,
      },
    });
  } catch (error) {
    console.error("Failed to create Monaco editor:", error);
    // 如果Monaco编辑器创建失败，回退到原始文本显示
    bodyViewMode.value = "raw";
  }
};

// 检测语言类型
const detectLanguage = (content) => {
  try {
    JSON.parse(content);
    return "json";
  } catch {
    if (content.includes("<?xml")) return "xml";
    if (content.includes("<html")) return "html";
    return "text";
  }
};

// 销毁编辑器
const destroyBodyEditor = () => {
  if (bodyEditor) {
    bodyEditor.dispose();
    bodyEditor = null;
  }
};

// 复制响应内容
const copyResponse = async () => {
  try {
    await navigator.clipboard.writeText(responseBodyText.value);
    message.success("响应内容已复制到剪贴板");
  } catch (error) {
    message.error("复制失败");
  }
};

// 监听视图模式变化
watch(bodyViewMode, (newMode) => {
  if (newMode === "formatted") {
    nextTick(() => {
      initBodyEditor();
    });
  } else {
    destroyBodyEditor();
  }
});

// 监听响应变化
watch(
  () => props.response,
  (newResponse) => {
    if (newResponse && bodyViewMode.value === "formatted") {
      destroyBodyEditor();
      nextTick(() => {
        initBodyEditor();
      });
    }
  },
  { deep: true }
);

onUnmounted(() => {
  destroyBodyEditor();
});
</script>

<style scoped>
.response-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 16px;
}

.response-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.response-status {
  margin-bottom: 16px;
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
}

.status-line {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-tag {
  font-weight: 500;
}

.duration,
.size {
  font-size: 12px;
  color: #666;
}

.response-tabs {
  flex: 1;
}

.response-tabs :deep(.ant-tabs-content-holder) {
  height: calc(100% - 46px);
}

.response-tabs :deep(.ant-tabs-tabpane) {
  height: 100%;
}

.response-tabs :deep(.ant-tabs-content) {
  height: 100%;
}

.response-body {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.body-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.response-body-content {
  flex: 1;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
}

.raw-content {
  margin: 0;
  padding: 12px;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  height: 100%;
  overflow: auto;
}

.body-editor-container {
  height: 100%;
}

.response-headers {
  height: 100%;
  overflow: auto;
}

.header-value {
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 12px;
  background: #f5f5f5;
  padding: 2px 4px;
  border-radius: 3px;
}

.response-cookies {
  height: 100%;
  overflow: auto;
}

.cookie-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.cookie-details span {
  color: #666;
}

.no-response {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
}

/* 深色主题样式 */
[data-theme="dark"] .response-status {
  background: #1f1f1f;
}

[data-theme="dark"] .duration,
[data-theme="dark"] .size {
  color: #8c8c8c;
}

[data-theme="dark"] .header-value {
  background: #262626;
  color: #fff;
}

[data-theme="dark"] .cookie-details span {
  color: #8c8c8c;
}

[data-theme="dark"] .loading-container {
  color: #fff;
}

[data-theme="dark"] .loading-container p {
  color: #8c8c8c;
}
</style>
