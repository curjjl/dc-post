<template>
  <a-layout class="workspace-layout">
    <!-- 顶部导航栏 -->
    <a-layout-header class="header">
      <div class="header-content">
        <h1 class="logo">API Tester</h1>
        <div class="header-actions">
          <a-button type="text" @click="showEnvManager = true">
            <template #icon><SettingOutlined /></template>
            环境变量
          </a-button>
          <a-button
            type="text"
            @click="showCodeGenerator = true"
            :disabled="!hasValidRequest"
          >
            <template #icon><CodeOutlined /></template>
            生成代码
          </a-button>
          <a-button type="text" @click="goToHistory">
            <template #icon><HistoryOutlined /></template>
            历史记录
          </a-button>
          <a-button type="text" @click="toggleTheme">
            <template #icon><BulbOutlined /></template>
            {{ isDarkMode ? "浅色主题" : "深色主题" }}
          </a-button>
        </div>
      </div>
    </a-layout-header>

    <a-layout>
      <!-- 左侧历史记录面板 -->
      <a-layout-sider
        v-model:collapsed="historyCollapsed"
        :width="historyPanelWidth"
        collapsible
        theme="light"
        class="history-sider"
      >
        <!-- 拖拽手柄 -->
        <div
          v-if="!historyCollapsed"
          class="resize-handle resize-handle--left"
          :class="{ resizing: isResizingHistory }"
          @mousedown="startHistoryResize"
          @touchstart="startHistoryResizeTouch"
        >
          <div class="resize-handle-line"></div>
        </div>

        <div class="sider-header">
          <h3 v-if="!historyCollapsed">请求历史</h3>
        </div>
        <HistoryPanel
          v-if="!historyCollapsed"
          @select-request="handleSelectRequest"
        />
      </a-layout-sider>

      <!-- 中部主工作区 -->
      <a-layout-content class="main-content">
        <div class="content-wrapper">
          <!-- 请求配置区 -->
          <RequestConfig
            ref="requestConfigRef"
            @send-request="handleSendRequest"
          />
        </div>
      </a-layout-content>

      <!-- 右侧响应展示面板 -->
      <a-layout-sider
        v-model:collapsed="responseCollapsed"
        :width="responsePanelWidth"
        collapsible
        theme="light"
        class="response-sider"
        :reverseArrow="true"
      >
        <!-- 拖拽手柄 -->
        <div
          v-if="!responseCollapsed"
          class="resize-handle resize-handle--right"
          :class="{ resizing: isResizingResponse }"
          @mousedown="startResponseResize"
          @touchstart="startResponseResizeTouch"
        >
          <div class="resize-handle-line"></div>
        </div>

        <div class="sider-header">
          <h3 v-if="!responseCollapsed">响应结果</h3>
        </div>
        <ResponsePanel
          v-if="!responseCollapsed"
          :response="currentResponse"
          :loading="requestLoading"
        />
      </a-layout-sider>
    </a-layout>

    <!-- 环境变量管理对话框 -->
    <EnvManager v-model:visible="showEnvManager" />

    <!-- 代码生成器对话框 -->
    <CodeGenerator
      v-model:visible="showCodeGenerator"
      :request-data="currentRequestData"
    />
  </a-layout>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import {
  HistoryOutlined,
  BulbOutlined,
  SettingOutlined,
  CodeOutlined,
} from "@ant-design/icons-vue";
import RequestConfig from "@/components/RequestConfig.vue";
import ResponsePanel from "@/components/ResponsePanel.vue";
import HistoryPanel from "@/components/HistoryPanel.vue";
import EnvManager from "@/components/EnvManager.vue";
import CodeGenerator from "@/components/CodeGenerator.vue";
import httpService from "@/services/httpService.js";
import {
  buildRouteObject,
  buildApiQueryParams,
  hasValidQueryParams,
} from "@/utils/routeParamsHelper.js";

// 定义查询参数 props
const props = defineProps({
  id: {
    type: String,
    default: null,
  },
  name: {
    type: String,
    default: null,
  },
  code: {
    type: String,
    default: null,
  },
  pid: {
    type: String,
    default: null,
  },
  dir: {
    type: String,
    default: null,
  },
});

const router = useRouter();

// 面板折叠状态
const historyCollapsed = ref(false);
const responseCollapsed = ref(false);

// 面板宽度状态
const historyPanelWidth = ref(300);
const responsePanelWidth = ref(400);

// 拖拽状态
const isResizingHistory = ref(false);
const isResizingResponse = ref(false);
const startX = ref(0);
const startWidth = ref(0);

// 请求状态
const requestLoading = ref(false);
const currentResponse = ref(null);
const requestConfigRef = ref(null);
const currentRequestData = ref({});

// 对话框状态
const showEnvManager = ref(false);
const showCodeGenerator = ref(false);

// 主题状态
const isDarkMode = ref(false);

// 初始化主题状态
const initTheme = () => {
  const savedTheme = localStorage.getItem("theme");
  isDarkMode.value = savedTheme === "dark";
};

// 初始化面板宽度
const initPanelWidths = () => {
  const savedHistoryWidth = localStorage.getItem("historyPanelWidth");
  const savedResponseWidth = localStorage.getItem("responsePanelWidth");

  if (savedHistoryWidth) {
    historyPanelWidth.value = parseInt(savedHistoryWidth, 10);
  }

  if (savedResponseWidth) {
    responsePanelWidth.value = parseInt(savedResponseWidth, 10);
  }
};

// 是否有有效的请求数据
const hasValidRequest = computed(() => {
  return currentRequestData.value.url && currentRequestData.value.method;
});

// 主题切换
const toggleTheme = () => {
  if (window.toggleTheme) {
    window.toggleTheme();
    // 更新本地状态
    isDarkMode.value = !isDarkMode.value;
  }
};

// 处理发送请求
const handleSendRequest = async (requestData) => {
  requestLoading.value = true;
  currentRequestData.value = requestData; // 保存当前请求数据

  try {
    console.log("发送请求:", requestData);

    // 使用HTTP服务发送请求
    const response = await httpService.sendRequest(requestData);
    currentResponse.value = response;

    // 更新历史记录中的响应信息
    updateHistoryWithResponse(requestData.id, response);
  } catch (error) {
    console.error("请求失败:", error);
    currentResponse.value = {
      status: 0,
      statusText: "Error",
      headers: {},
      data: { error: error.message },
      duration: 0,
      size: "0 B",
    };
  } finally {
    requestLoading.value = false;
  }
};

// 更新历史记录中的响应信息
const updateHistoryWithResponse = (requestId, response) => {
  const history = JSON.parse(
    localStorage.getItem("api_request_history") || "[]"
  );
  const index = history.findIndex((item) => item.id === requestId);

  if (index !== -1) {
    history[index] = {
      ...history[index],
      status: response.status,
      statusText: response.statusText,
      duration: response.duration,
      responseSize: response.size,
    };
    localStorage.setItem("api_request_history", JSON.stringify(history));
  }
};

// 处理选择历史请求
const handleSelectRequest = (requestData) => {
  if (requestConfigRef.value) {
    requestConfigRef.value.loadRequest(requestData);
  }
};

// 监听查询参数变化
watch(
  () => [props.id, props.name, props.code, props.pid, props.dir],
  (newParams) => {
    console.log("查询参数变化:", {
      id: newParams[0],
      name: newParams[1],
      code: newParams[2],
      pid: newParams[3],
      dir: newParams[4],
    });
    // 这里可以根据参数变化执行相应的逻辑
    handleQueryParamsChange();
  },
  { immediate: true }
);

// 处理查询参数变化
function handleQueryParamsChange() {
  // 可以在这里根据查询参数执行查询后台服务等操作
  const queryParams = {
    id: props.id,
    name: props.name,
    code: props.code,
    pid: props.pid,
    dir: props.dir,
  };

  if (hasValidQueryParams(queryParams)) {
    console.log("当前查询参数:", queryParams);

    // 构建API查询参数
    const apiParams = buildApiQueryParams(queryParams);
    console.log("API查询参数:", apiParams);

    // TODO: 根据参数查询后台服务
    // 例如：await fetchDataFromBackend(apiParams)
  }
}

// 跳转到历史记录页面（保持查询参数）
const goToHistory = () => {
  const queryParams = {
    id: props.id,
    name: props.name,
    code: props.code,
    pid: props.pid,
    dir: props.dir,
  };
  const routeObject = buildRouteObject("History", queryParams);
  router.push(routeObject);
};

// 节流函数
const throttle = (func, limit) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// 开始拖拽历史面板
const startHistoryResize = (e) => {
  e.preventDefault();
  startResize(e.clientX, "history");
};

const startHistoryResizeTouch = (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  startResize(touch.clientX, "history");
};

// 开始拖拽响应面板
const startResponseResize = (e) => {
  e.preventDefault();
  startResize(e.clientX, "response");
};

const startResponseResizeTouch = (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  startResize(touch.clientX, "response");
};

// 开始拖拽
const startResize = (clientX, type) => {
  if (type === "history") {
    isResizingHistory.value = true;
    startWidth.value = historyPanelWidth.value;
  } else {
    isResizingResponse.value = true;
    startWidth.value = responsePanelWidth.value;
  }

  startX.value = clientX;

  document.addEventListener("mousemove", handleMouseMove, { passive: false });
  document.addEventListener("mouseup", handleMouseUp, { passive: false });
  document.addEventListener("touchmove", handleTouchMove, { passive: false });
  document.addEventListener("touchend", handleTouchEnd, { passive: false });

  document.body.style.userSelect = "none";
  document.body.style.cursor = "col-resize";
  document.body.classList.add("resizing-panel");
};

// 鼠标移动处理（节流）
const handleMouseMove = throttle((e) => {
  if (!isResizingHistory.value && !isResizingResponse.value) return;
  updateWidth(e.clientX);
}, 16);

// 触摸移动处理（节流）
const handleTouchMove = throttle((e) => {
  if (!isResizingHistory.value && !isResizingResponse.value) return;
  const touch = e.touches[0];
  updateWidth(touch.clientX);
}, 16);

// 更新宽度
const updateWidth = (clientX) => {
  const deltaX = clientX - startX.value;
  let newWidth;

  if (isResizingHistory.value) {
    newWidth = startWidth.value + deltaX;
    newWidth = Math.max(250, Math.min(500, newWidth));
    historyPanelWidth.value = newWidth;
    localStorage.setItem("historyPanelWidth", newWidth.toString());
  } else if (isResizingResponse.value) {
    newWidth = startWidth.value - deltaX;
    newWidth = Math.max(300, Math.min(800, newWidth));
    responsePanelWidth.value = newWidth;
    localStorage.setItem("responsePanelWidth", newWidth.toString());
  }
};

// 结束拖拽
const endResize = () => {
  isResizingHistory.value = false;
  isResizingResponse.value = false;

  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
  document.removeEventListener("touchmove", handleTouchMove);
  document.removeEventListener("touchend", handleTouchEnd);

  document.body.style.userSelect = "";
  document.body.style.cursor = "";
  document.body.classList.remove("resizing-panel");
};

const handleMouseUp = endResize;
const handleTouchEnd = endResize;

// 键盘支持
const handleKeyDown = (e) => {
  if (!isResizingHistory.value && !isResizingResponse.value) return;

  if (e.key === "Escape") {
    // ESC键取消拖拽，恢复原始宽度
    if (isResizingHistory.value) {
      historyPanelWidth.value = startWidth.value;
    } else if (isResizingResponse.value) {
      responsePanelWidth.value = startWidth.value;
    }
    endResize();
  }
};

// 组件挂载时添加键盘监听
onMounted(() => {
  document.addEventListener("keydown", handleKeyDown);
});

// 组件卸载时清理
onUnmounted(() => {
  endResize();
  document.removeEventListener("keydown", handleKeyDown);

  // 清理可能残留的全局样式
  document.body.style.userSelect = "";
  document.body.style.cursor = "";
  document.body.classList.remove("resizing-panel");
});

// 初始化
initTheme();
initPanelWidths();
</script>

<style scoped>
.workspace-layout {
  height: 100vh;
}

.header {
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  padding: 0 24px;
  height: 64px;
  line-height: 64px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.logo {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1890ff;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.history-sider,
.response-sider {
  background: #fff !important;
  border-left: 1px solid #f0f0f0;
  border-right: 1px solid #f0f0f0;
  position: relative;
}

.sider-header {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.sider-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

/* 拖拽手柄样式 */
.resize-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: col-resize;
  background: transparent;
  z-index: 10;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.resize-handle:hover {
  background-color: rgba(24, 144, 255, 0.1);
}

.resize-handle:active,
.resize-handle.resizing {
  background-color: rgba(24, 144, 255, 0.2);
}

.resize-handle:hover .resize-handle-line,
.resize-handle.resizing .resize-handle-line {
  opacity: 1;
  background-color: #1890ff;
  transform: translate(-50%, -50%) scaleY(1.2);
}

.resize-handle--left {
  right: -3px;
}

.resize-handle--right {
  left: -3px;
}

.resize-handle-line {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 60px;
  background-color: #d9d9d9;
  opacity: 0;
  transition: all 0.2s ease;
  border-radius: 1px;
}

.main-content {
  background: #f5f5f5;
  padding: 16px;
  overflow: auto;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

/* 深色主题样式 */
[data-theme="dark"] .header {
  background: #141414;
  border-bottom: 1px solid #303030;
}

[data-theme="dark"] .logo {
  color: #177ddc;
}

/* 深色主题样式 */
[data-theme="dark"] .history-sider,
[data-theme="dark"] .response-sider {
  background: #141414 !important;
  border-left: 1px solid #303030;
  border-right: 1px solid #303030;
}

[data-theme="dark"] .sider-header {
  border-bottom: 1px solid #303030;
}

[data-theme="dark"] .sider-header h3 {
  color: #fff;
}

[data-theme="dark"] .resize-handle:hover {
  background-color: rgba(23, 125, 220, 0.1);
}

[data-theme="dark"] .resize-handle:active,
[data-theme="dark"] .resize-handle.resizing {
  background-color: rgba(23, 125, 220, 0.2);
}

[data-theme="dark"] .resize-handle:hover .resize-handle-line,
[data-theme="dark"] .resize-handle.resizing .resize-handle-line {
  background-color: #177ddc;
}

[data-theme="dark"] .resize-handle-line {
  background-color: #595959;
}

/* 全局拖拽样式 */
.resizing-panel {
  user-select: none !important;
  cursor: col-resize !important;
}

.resizing-panel * {
  pointer-events: none !important;
}

.resizing-panel .resize-handle {
  pointer-events: auto !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .resize-handle {
    width: 8px;
  }

  .resize-handle--left {
    right: -4px;
  }

  .resize-handle--right {
    left: -4px;
  }

  .resize-handle-line {
    width: 3px;
    height: 80px;
  }
}

/* 触摸设备优化 */
@media (pointer: coarse) {
  .resize-handle {
    width: 12px;
  }

  .resize-handle--left {
    right: -6px;
  }

  .resize-handle--right {
    left: -6px;
  }

  .resize-handle-line {
    width: 4px;
    height: 100px;
  }
}

[data-theme="dark"] .main-content {
  background: #000;
}
</style>
