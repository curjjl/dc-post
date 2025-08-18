<template>
  <a-layout class="workspace-layout">
    <!-- 顶部导航栏 -->
    <a-layout-header class="header">
      <div class="header-content">
        <h1 class="logo">API 测试</h1>
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
          <a-button type="text" @click="showThemeSwitcher = true">
            <template #icon><BgColorsOutlined /></template>
            主题换肤
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
          :id="id"
          :name="name"
          :pid="pid"
          :dir="dir"
          :code="code"
          :refreshFlag="refreshFlag"
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
            @hand-save="handleOnSave"
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

    <!-- 主题切换器 -->
    <ThemeSwitcher
      v-model:visible="showThemeSwitcher"
    />
  </a-layout>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  HistoryOutlined,
  BgColorsOutlined,
  SettingOutlined,
  CodeOutlined,
} from "@ant-design/icons-vue";
import RequestConfig from "@/components/RequestConfig.vue";
import ResponsePanel from "@/components/ResponsePanel.vue";
import HistoryPanel from "@/components/HistoryPanel.vue";
import EnvManager from "@/components/EnvManager.vue";
import CodeGenerator from "@/components/CodeGenerator.vue";
import ThemeSwitcher from "@/components/ThemeSwitcher.vue";
import httpService from "@/services/httpService.js";
import {
  buildRouteObject,
  buildApiQueryParams,
  hasValidQueryParams,
} from "@/utils/routeParamsHelper.js";
import { clearEmptyProperties, getUserId, getTenantId } from "@/utils/tools.js";
import api from "@/api/index.js";
import { message } from "ant-design-vue";
import { nanoid } from "nanoid";
import dayjs from "dayjs";
import { useRouterParams } from "@/utils/routerUtils";
import ApiDataConverter from "@/utils/dataConversionTools.js";

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
  suffix: {
    type: String,
    default: null,
  },
});

const router = useRouter();
const route = useRoute();
const routerParams = useRouterParams();

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
const showThemeSwitcher = ref(false);
const refreshFlag = ref(0);


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

// 防抖计时器，避免频繁刷新
let refreshDebounceTimer = null;

// 清除API缓存
const clearApiCaches = () => {
  try {
    // 清除所有API服务的缓存
    if (api.clearCaches && typeof api.clearCaches === 'function') {
      api.clearCaches();
    }
    console.log('[Cache] 已清除API缓存');
  } catch (error) {
    console.warn('[Cache] 清除缓存失败:', error);
  }
};

// 刷新历史面板
const refreshHistoryPanel = () => {
  // 清除之前的防抖计时器
  if (refreshDebounceTimer) {
    clearTimeout(refreshDebounceTimer);
  }
  
  // 使用防抖机制，避免短时间内多次刷新
  refreshDebounceTimer = setTimeout(() => {
    // 使用 nextTick 确保在下个更新周期触发刷新，提供更好的性能
    nextTick(() => {
      try {
        refreshFlag.value += 1;
      } catch (error) {
        console.warn('刷新历史面板失败:', error);
      }
    });
  }, 100);
};


// 处理发送请求
const handleSendRequest = async (requestData) => {
  requestLoading.value = true;
  currentRequestData.value = requestData; // 保存当前请求数据

  try {
    // 使用HTTP服务发送请求
    const response = await httpService.sendRequest(requestData);
    
    // 先设置响应数据，确保 UI 立即更新
    currentResponse.value = response;

    // 异步保存操作，不阻塞响应渲染
    const respContent = {
      ...requestData,
      status: response.status,
      statusText: response.statusText,
      duration: response.duration,
      responseSize: response.size,
    };

    // 在下一个微任务中执行保存操作，避免阻塞响应渲染
    nextTick(() => {
      saveRequestToServer(respContent);
    });

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

// 异步保存请求到服务器
const saveRequestToServer = async (respContent) => {
  try {
    // 保存请求数据到对象表
    const objId = nanoid();
    const objectParam = {
      id: objId,
      code: `${objId}_api`,
      name: `${
        respContent?.name || props.name || dayjs().format("YYYY-MM-DD HH:mm:ss")
      }`,
      type: "api",
      order: 0,
      readonly: null,
      project_id: props?.pid,
      project_name: props?.pname || null,
      directory_id: props?.dir || null,
      suffix: "api",
      editor_url:
        "/access-view/dc-post/workspace?id={{id}}&name={{name}}&pid={{project_id}}&type={{type}}&suffix={{suffix}}&dir={{directory_id}}",
      notes: null,
      creator: getUserId(),
      modifier: getUserId(),
      tenant_id: getTenantId(),
    };

    // 保存响应内容到对象内容表
    const contParam = {
      object_id: objId,
      content: JSON.stringify(respContent),
      content_type: "text/plain",
      tenant_id: getTenantId(),
    };

    const res = await saveObject(objectParam, contParam);
    if (res) {
      // 保存成功之后，更新路由信息并刷新历史面板
      // 使用 setTimeout 确保在响应渲染完成后再更新路由
      setTimeout(() => {
        routerParams.updateQuery(
          {
            id: objId,
            name: objectParam.name,
            pid: objectParam.project_id,
            suffix: objectParam.suffix,
            dir: objectParam.directory_id,
          },
          {
            replace: true,
            encode: false,
          }
        );
        
        // 清除相关缓存并触发历史面板刷新
        clearApiCaches();
        console.log('[Workspace] 请求保存成功，正在刷新历史面板...');
        refreshHistoryPanel();
      }, 100); // 延迟 100ms 确保响应面板已完成初始化渲染
    } else {
      message.error("保存失败");
    }
  } catch (error) {
    console.error("保存请求失败:", error);
    message.error("保存失败");
  }
};

// 保存对象和对象内容
const saveObject = async (objectParam, contParam) => {
  const objRes = await api.object.upsertObject(objectParam);
  const objContRes = await api.objectCont.upsertObjContent(contParam);
  return objRes?.data?.code === 200 && objContRes?.data?.code === 200;
};

// 处理选择历史请求
const handleSelectRequest = (requestData) => {
  console.log('[Workspace] 处理选择历史请求，ID:', requestData);
  
  if (requestConfigRef.value) {
    // 先加载请求数据到表单
    requestConfigRef.value.loadRequest(requestData);
    
    // 更新路由参数，确保清除apiText参数以避免优先级冲突
    const newQuery = {
      id: requestData.fid,
      name: requestData.name,
      pid: requestData.pid,
      suffix: requestData.suffix,
    };
    
    // 如果当前URL中存在apiText参数，需要明确移除它
    if (route.query.apiText) {
      console.log('[Workspace] 检测到apiText参数，选择历史记录时将清除该参数');
      // 使用router.replace来清除apiText参数
      router.replace({
        path: route.path,
        query: {
          ...newQuery,
          // 明确不包含apiText参数
        }
      });
    } else {
      // 如果没有apiText参数，使用原有的更新方式
      routerParams.updateQuery(newQuery, {
        replace: true,
        encode: false,
      });
    }
  }
};

// 保存连接器--suffix: "connector"
const handleSaveConnector = async (requestData) => {
  if (props.pid) {
    const _id = nanoid();
    // 更新对象
    const objectParam = {
      id: _id,
      code: "restClient",
      name: `${
        requestData?.name || props.name || dayjs().format("YYYY-MM-DD HH:mm:ss")
      }`,
      type: "ctr",
      order: 0,
      readonly: null,
      project_id: props?.pid,
      project_name: props?.pname || null,
      directory_id: props?.dir || null,
      suffix: "connector",
      editor_url:
        "/access-view/dc-post/workspace?id={{id}}&name={{name}}&pid={{project_id}}&type={{type}}&suffix={{suffix}}&dir={{directory_id}}",
      notes: "连接器",
      creator: getUserId(),
      modifier: getUserId(),
      tenant_id: getTenantId(),
    };
    // API转Connector
    const connectorData = ApiDataConverter.apiToConnector(requestData);
    console.log("connectorData====", connectorData);
    // 更新对象内容
    const contParam = {
      object_id: _id,
      content: JSON.stringify(connectorData),
      content_type: "text/plain",
      tenant_id: getTenantId(),
    };
    const objRes = await api.object.upsertObject(objectParam);
    const objContRes = await api.objectCont.upsertObjContent(contParam);
    if (objRes?.data?.code === 200 && objContRes?.data?.code === 200) {
      message.success("连接器保存成功，请刷新当前目录查看！");
      // 清除缓存并刷新历史面板
      clearApiCaches();
      refreshHistoryPanel();
    } else {
      message.error("保存失败");
    }
  }
};

// 保存更新API-suffix: "api"
const handleSaveApi = async (requestData) => {
  if (props.pid && props.id) {
    const _id = props.id;
    // 更新对象
    const objectParam = {
      id: _id,
      code: `${_id}_api`,
      name: `${
        requestData?.name || props.name || dayjs().format("YYYY-MM-DD HH:mm:ss")
      }`,
      type: "api",
      order: 0,
      readonly: null,
      project_id: props?.pid,
      project_name: props?.pname || null,
      directory_id: props?.dir || null,
      suffix: "api",
      editor_url:
        "/access-view/dc-post/workspace?id={{id}}&name={{name}}&pid={{project_id}}&type={{type}}&suffix={{suffix}}&dir={{directory_id}}",
      notes: "API",
      creator: getUserId(),
      modifier: getUserId(),
      tenant_id: getTenantId(),
    };

    // 更新对象内容
    const contParam = {
      object_id: _id,
      content: JSON.stringify(requestData),
      content_type: "text/plain",
      tenant_id: getTenantId(),
    };
    const objRes = await api.object.upsertObject(objectParam);
    const objContRes = await api.objectCont.upsertObjContent(contParam);
    if (objRes?.data?.code === 200 && objContRes?.data?.code === 200) {
      message.success("保存成功");
      // 清除缓存并刷新历史面板
      clearApiCaches();
      refreshHistoryPanel();
    } else {
      message.error("保存失败");
    }
  }
};

// 处理保存请求数据
const handleOnSave = (type) => {
  if (
    !currentRequestData.value ||
    Object.keys(currentRequestData.value).length === 0
  ) {
    return message.error("请先发送请求");
  }

  const respContent = {
    ...currentRequestData.value,
    status: currentResponse.value.status,
    statusText: currentResponse.value.statusText,
    duration: currentResponse.value.duration,
    responseSize: currentResponse.value.size,
  };

  if (type === "api") {
    handleSaveApi(respContent);
  } else if (type === "ctr") {
    handleSaveConnector(respContent);
  }
};

// 跳转到历史记录页面
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

// 监听查询参数变化
watch(
  () => [props.id, props.pid, props.dir, route.query.apiText],
  (newParams) => {
    const [id, pid, dir, apiText] = newParams;
    console.log("Workspace: 查询参数变化:", {
      id,
      pid,
      dir,
      hasApiText: !!apiText
    });
    // 传递id，但fetchHistoryDetail内部会优先检查apiText
    fetchHistoryDetail(id);
  },
  { immediate: true }
);

// 解析URL中的apiText参数（与RequestConfig.vue中的逻辑保持一致）
function parseApiTextFromRoute() {
  try {
    const apiTextParam = route.query.apiText;
    if (!apiTextParam) return null;

    // 直接解析JSON数据，Vue Router已经自动解码了URL参数
    let apiData;
    if (typeof apiTextParam === "string") {
      apiData = JSON.parse(apiTextParam);
    } else {
      apiData = apiTextParam;
    }
    
    // 简单的数据验证
    if (typeof apiData !== "object" || apiData === null) {
      console.warn("apiText参数格式不正确");
      return null;
    }
    
    console.log("Workspace: 成功解析apiText参数:", apiData);
    return apiData;
  } catch (error) {
    console.error("Workspace: 解析apiText参数失败:", error);
    return null;
  }
};

// 查询当前调试记录详情并回显
async function fetchHistoryDetail(id) {
  // 优先检查路由中的apiText参数
  const apiTextData = parseApiTextFromRoute();
  if (apiTextData) {
    console.log("Workspace: 使用apiText参数进行回填，跳过id查询");
    // 如果有apiText参数，让RequestConfig组件自己处理
    // 这里不需要手动loadRequest，因为RequestConfig已经处理了
    return;
  }
  
  // 如果没有apiText参数且有id，则查询服务器数据
  if (!id) {
    return;
  }
  
  console.log("Workspace: 使用id查询历史记录详情:", id);
  const res = await api.objectCont.getObjectInfo(id);
  if (res.status === 200 && res?.data?.data) {
    const cont = res?.data?.data?.content;
    if (cont) {
      const jsonCont =
        props.suffix === "api"
          ? JSON.parse(cont)
          : ApiDataConverter.connectorToApi(
              JSON.parse(cont),
              res?.data?.data?.create_date
            );
      const apiItem = {
        ...jsonCont,
        fid: props.id || res?.data?.data?.object_id,
        fname: props.name,
        pid: props.pid,
        suffix: props.suffix,
      };
      requestConfigRef.value?.loadRequest(apiItem);
    }
  }
}

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

  // 清理防抖计时器
  if (refreshDebounceTimer) {
    clearTimeout(refreshDebounceTimer);
    refreshDebounceTimer = null;
  }

  // 清理可能残留的全局样式
  document.body.style.userSelect = "";
  document.body.style.cursor = "";
  document.body.classList.remove("resizing-panel");
});

// 初始化
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
