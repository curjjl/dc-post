<template>
  <div class="history-panel">
    <!-- 搜索框 -->
    <div class="search-section">
      <a-input-search
        v-model:value="searchKeyword"
        placeholder="搜索历史记录..."
        @search="handleSearch"
      />
    </div>

    <!-- 历史记录列表 -->
    <div class="history-list" ref="historyListRef">
      <a-list
        :data-source="filteredHistory"
        size="small"
        :split="false"
        class="history-list-container"
        style="width: 100%"
      >
        <template #renderItem="{ item }">
          <a-list-item
            class="history-item"
            @click="selectRequest(item)"
            style="width: 100%"
          >
            <div class="item-content">
              <div class="item-header">
                <a-tag
                  :color="getMethodColor(item.method)"
                  size="small"
                  class="method-tag"
                >
                  {{ item.method }}
                </a-tag>
                <span class="timestamp">{{ formatTime(item.timestamp) }}</span>
              </div>

              <div class="item-url" :title="item.url">
                {{ truncateUrl(item.url) }}
              </div>

              <div v-if="item.status" class="item-status">
                <a-tag :color="getStatusColor(item.status)" size="small">
                  {{ item.status }}
                </a-tag>
                <span v-if="item.duration" class="duration"
                  >{{ item.duration }}ms</span
                >
              </div>
            </div>

            <div class="item-actions" @click.stop>
              <a-dropdown :trigger="['click']">
                <a-button type="text" size="small">
                  <template #icon><MoreOutlined /></template>
                </a-button>
                <template #overlay>
                  <a-menu>
                    <a-menu-item @click="selectRequest(item)">
                      <template #icon><PlayCircleOutlined /></template>
                      使用此请求
                    </a-menu-item>
                    <a-menu-item @click="duplicateRequest(item)">
                      <template #icon><CopyOutlined /></template>
                      复制请求
                    </a-menu-item>
                    <a-menu-divider />
                    <a-menu-item @click="deleteRequest(item)" danger>
                      <template #icon><DeleteOutlined /></template>
                      删除
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
          </a-list-item>
        </template>
      </a-list>

      <!-- 空状态 -->
      <a-empty
        v-if="!filteredHistory.length && !loading"
        :image="false"
        description="暂无历史记录"
        class="empty-state"
      >
        <template #image>
          <HistoryOutlined style="font-size: 48px; color: #d9d9d9" />
        </template>
      </a-empty>
      
      <!-- 加载更多指示器 -->
      <div v-if="loadingMore" class="loading-more">
        <a-spin size="small" />
        <span>加载中...</span>
      </div>
      
      <!-- 初始加载指示器 -->
      <div v-if="loading && isInitialLoad" class="initial-loading">
        <a-spin size="large" />
        <div>加载中...</div>
      </div>
      
      <!-- 滚动提示信息 -->
      <div v-if="showScrollHint" class="scroll-hint">
        <span>滚动加载更多数据</span>
      </div>
      
      <!-- 加载完成提示 -->
      <div v-if="showCompletionHint" class="completion-hint">
        <span>已全部加载</span>
      </div>
    </div>

    <!-- 底部操作 -->
    <div class="panel-footer">
      <a-button type="text" size="small" block @click="clearAllHistory" danger>
        <template #icon><DeleteOutlined /></template>
        清空历史
      </a-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import {
  MoreOutlined,
  PlayCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  HistoryOutlined,
} from "@ant-design/icons-vue";
import { message, Modal } from "ant-design-vue";
import {
  buildRouteObject,
  buildApiQueryParams,
  hasValidQueryParams,
} from "@/utils/routeParamsHelper.js";
import api from "../api/index.js"; // 导入API服务
import { clearEmptyProperties, getTenantId } from "@/utils/tools.js";
import ApiDataConverter from "@/utils/dataConversionTools.js";

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
  refreshFlag: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(["select-request"]);

// DOM引用
const historyListRef = ref(null);

// 数据状态
const totalCount = ref(0);
const historyList = ref([]);
const searchKeyword = ref("");
const loading = ref(false);
const loadingMore = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const hasMore = ref(true);
const isInitialLoad = ref(true);

// 过滤后的历史记录
const filteredHistory = computed(() => {
  if (!searchKeyword.value) {
    return historyList.value;
  }

  const keyword = searchKeyword.value.toLowerCase();
  return historyList.value.filter(
    (item) =>
      item.url.toLowerCase().includes(keyword) ||
      item.method.toLowerCase().includes(keyword)
  );
});

// 显示滚动提示
const showScrollHint = computed(() => {
  return (
    !searchKeyword.value.trim() && // 非搜索模式
    !loading.value && // 非初始加载
    !loadingMore.value && // 非加载更多
    filteredHistory.value.length > 0 && // 有数据
    hasMore.value && // 还有更多数据
    totalCount.value > pageSize.value // 总数量大于单页大小
  );
});

// 显示加载完成提示
const showCompletionHint = computed(() => {
  return (
    !searchKeyword.value.trim() && // 非搜索模式
    !loading.value && // 非初始加载
    !loadingMore.value && // 非加载更多
    filteredHistory.value.length > 0 && // 有数据
    !hasMore.value && // 没有更多数据
    totalCount.value > pageSize.value // 总数量大于单页大小（防止初始加载就显示完成）
  );
});

// 获取请求方法颜色
const getMethodColor = (method) => {
  const colors = {
    GET: "green",
    POST: "blue",
    PUT: "orange",
    DELETE: "red",
    PATCH: "purple",
    HEAD: "cyan",
    OPTIONS: "geekblue",
  };
  return colors[method] || "default";
};

// 获取状态码颜色
const getStatusColor = (status) => {
  if (status >= 200 && status < 300) return "success";
  if (status >= 300 && status < 400) return "warning";
  if (status >= 400 && status < 500) return "error";
  if (status >= 500) return "error";
  return "default";
};

// 格式化时间
const formatTime = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) return "刚刚";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;

  return new Date(timestamp).toLocaleDateString();
};

// 截断URL显示
const truncateUrl = (url) => {
  return url;
  // if (url.length <= 40) return url
  // return url.substring(0, 37) + '...'
};

// 加载历史记录
// const loadHistory = () => {
//   const saved = localStorage.getItem("api_request_history");
//   if (saved) {
//     historyList.value = JSON.parse(saved).reverse(); // 最新的在前面
//   }
// };

// 搜索处理
const handleSearch = () => {
  // 搜索逻辑已在computed中处理
  // 搜索时重置分页状态
  if (searchKeyword.value.trim()) {
    // 搜索模式下不支持分页加载，显示所有结果
    return;
  }
};

// 节流函数
function throttle(func, delay) {
  let timeoutId;
  let lastExecTime = 0;
  return function (...args) {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}

// 滚动事件处理
const handleScroll = throttle((event) => {
  if (!historyListRef.value || searchKeyword.value.trim()) return;
  
  const { scrollTop, scrollHeight, clientHeight } = event.target;
  const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
  
  // 当滚动到底部85%时加载更多
  if (scrollPercentage >= 0.85 && hasMore.value && !loadingMore.value && !loading.value) {
    loadMore();
  }
}, 200);

// 加载更多数据
const loadMore = async () => {
  if (!hasMore.value || loadingMore.value || loading.value) return;
  
  try {
    loadingMore.value = true;
    currentPage.value += 1;
    
    const queryParams = {
      id: props.id,
      name: props.name,
      code: props.code,
      pid: props.pid,
      dir: props.dir,
    };
    
    if (hasValidQueryParams(queryParams)) {
      const apiParams = buildApiQueryParams(queryParams);
      await fetchMoreHistory(apiParams, "api");
    }
  } catch (error) {
    console.error('加载更多数据失败:', error);
    currentPage.value -= 1; // 回滚页码
  } finally {
    loadingMore.value = false;
  }
};

// 选择请求
const selectRequest = (item) => {
  emit("select-request", item);
  message.success("已加载请求配置");
};

// 复制请求
const duplicateRequest = (item) => {
  const newItem = {
    ...item,
    id: Date.now().toString(),
    timestamp: Date.now(),
  };

  historyList.value.unshift(newItem);
  // saveHistory();
  message.success("请求已复制");
};

// 删除单个请求
const deleteRequest = (item) => {
  if (!item || !item.fid) {
    return message.error("请求数据异常");
  }
  Modal.confirm({
    title: "确认删除",
    content: "确定要删除这条历史记录吗？",
    okText: "确定",
    cancelText: "取消",
    onOk: async () => {
      try {
        const objectRes = await api.object.deleteObject(item.fid);
        const objContRes = await api.objectCont.deleteObjectCont(item.fid);
        if (objectRes.status === 200 && objContRes.status === 200) {
          message.success("删除成功");
          // 从本地列表中移除该项
          historyList.value = historyList.value.filter(
            (historyItem) => historyItem.fid !== item.fid
          );
          totalCount.value = Math.max(0, totalCount.value - 1);
          // 检查是否需要加载更多数据
          if (historyList.value.length < pageSize.value && hasMore.value) {
            loadMore();
          }
        } else {
          message.error("删除失败");
        }
      } catch (error) {
        console.error('删除请求失败:', error);
        message.error("删除失败");
      }
    },
  });
};

// 清空所有历史 -- 删除当前pid下的所有后缀为api的文件
const clearAllHistory = () => {
  Modal.confirm({
    title: "确认清空",
    content: "确定要清空所有历史记录吗？此操作不可恢复。",
    onOk() {
      try {
        historyList.value = [];
        totalCount.value = 0;
        currentPage.value = 1;
        hasMore.value = true;
        localStorage.removeItem("api_request_history");
        message.success("历史记录已清空");
      } catch (error) {
        console.error('清空历史记录失败:', error);
        message.error("清空失败");
      }
    },
  });
};

// 保存历史记录
// const saveHistory = () => {
//   localStorage.setItem(
//     "api_request_history",
//     JSON.stringify(historyList.value.reverse())
//   );
//   historyList.value.reverse(); // 恢复显示顺序
// };

// 监听搜索关键词变化
watch(
  () => searchKeyword.value,
  () => {
    // 搜索时重置滚动位置
    if (historyListRef.value) {
      historyListRef.value.scrollTop = 0;
    }
  }
);

// 监听查询参数变化
watch(
  () => [
    props.id,
    props.name,
    props.code,
    props.pid,
    props.dir,
    props.refreshFlag,
  ],
  (newParams) => {
    // console.log("查询参数变化:", {
    //   id: newParams[0],
    //   name: newParams[1],
    //   code: newParams[2],
    //   pid: newParams[3],
    //   dir: newParams[4],
    //   refreshFlag: newParams[5],
    // });
    handleQueryParamsChange();
  },
  { immediate: true }
);

// 处理查询参数变化
function handleQueryParamsChange(type = "api") {
  // 重置分页状态
  currentPage.value = 1;
  hasMore.value = true;
  isInitialLoad.value = true;
  
  const queryParams = {
    id: props.id,
    name: props.name,
    code: props.code,
    pid: props.pid,
    dir: props.dir,
  };

  if (hasValidQueryParams(queryParams)) {
    // 构建API查询参数
    const apiParams = buildApiQueryParams(queryParams);
    fetchHistory(apiParams, type);
  }
}

// 查询历史记录列表
async function fetchHistory(apiParams, type) {
  try {
    loading.value = true;
    historyList.value = [];
    
    const filterObj = {
      project_id: apiParams?.pid,
      directory_id: apiParams?.dir,
      "project_object.tenant_id": getTenantId(),
      suffix: type,
    };

    const joinObj = {
      leftJoin: {
        db: "code_bricks",
        table: "project_object_content",
        as: "t1",
        on: {
          "project_object.id": "t1.object_id",
        },
      },
    };

    const keyObj = {
      name: 1,
      id: 1,
      project_id: 1,
      suffix: 1,
      "t1.content": 1,
      "project_object.create_date": 1,
      "project_object.last_modified": 1,
    };

    const params = {
      page: currentPage.value,
      pagesize: pageSize.value,
      filter: JSON.stringify(clearEmptyProperties(filterObj)),
      join: JSON.stringify(joinObj),
      keys: JSON.stringify(keyObj),
      sort: JSON.stringify({ "project_object.create_date": -1 }),
    };

    // 获取总数
    const totalRes = await api.object.getListTotal(params);
    if (totalRes?.status === 200) {
      const _data = totalRes?.data?.data;
      totalCount.value = _data?._size || 0;
      // 检查是否还有更多数据
      hasMore.value = historyList.value.length + pageSize.value < totalCount.value;
    }

    const res = await api.object.getList(params);
    if (res.status === 200 && res?.data?.data) {
      const newItems = [];
      res?.data?.data?.forEach((item) => {
        if (item?.content) {
          try {
            const jsonCont = JSON.parse(item.content);
            const cont = type === "api"
              ? jsonCont
              : ApiDataConverter.connectorToApi(jsonCont, item?.create_date);
            const historyItem = {
              ...cont,
              fid: item.id,
              fname: item.name,
              pid: item.project_id,
              suffix: item.suffix,
            };
            newItems.push(historyItem);
          } catch (parseError) {
            console.warn('解析历史记录失败:', parseError);
          }
        }
      });
      historyList.value = newItems;
      
      // 更新hasMore状态
      hasMore.value = newItems.length === pageSize.value && historyList.value.length < totalCount.value;
    }
    
    isInitialLoad.value = false;
    loading.value = false;
  } catch (error) {
    loading.value = false;
    isInitialLoad.value = false;
    console.error("获取历史记录失败:", error.userMessage || error.message);
  }
}

// 加载更多历史记录
async function fetchMoreHistory(apiParams, type) {
  try {
    const filterObj = {
      project_id: apiParams?.pid,
      directory_id: apiParams?.dir,
      "project_object.tenant_id": getTenantId(),
      suffix: type,
    };

    const joinObj = {
      leftJoin: {
        db: "code_bricks",
        table: "project_object_content",
        as: "t1",
        on: {
          "project_object.id": "t1.object_id",
        },
      },
    };

    const keyObj = {
      name: 1,
      id: 1,
      project_id: 1,
      suffix: 1,
      "t1.content": 1,
      "project_object.create_date": 1,
      "project_object.last_modified": 1,
    };

    const params = {
      page: currentPage.value,
      pagesize: pageSize.value,
      filter: JSON.stringify(clearEmptyProperties(filterObj)),
      join: JSON.stringify(joinObj),
      keys: JSON.stringify(keyObj),
      sort: JSON.stringify({ "project_object.create_date": -1 }),
    };

    const res = await api.object.getList(params);
    if (res.status === 200 && res?.data?.data) {
      const newItems = [];
      res?.data?.data?.forEach((item) => {
        if (item?.content) {
          try {
            const jsonCont = JSON.parse(item.content);
            const cont = type === "api"
              ? jsonCont
              : ApiDataConverter.connectorToApi(jsonCont, item?.create_date);
            const historyItem = {
              ...cont,
              fid: item.id,
              fname: item.name,
              pid: item.project_id,
              suffix: item.suffix,
            };
            // 检查是否已存在（防止重复）
            if (!historyList.value.find(existing => existing.fid === historyItem.fid)) {
              newItems.push(historyItem);
            }
          } catch (parseError) {
            console.warn('解析历史记录失败:', parseError);
          }
        }
      });
      
      // 追加新数据
      historyList.value.push(...newItems);
      
      // 检查是否还有更多数据
      hasMore.value = newItems.length === pageSize.value && historyList.value.length < totalCount.value;
    } else {
      hasMore.value = false;
    }
  } catch (error) {
    console.error("加载更多历史记录失败:", error.userMessage || error.message);
    hasMore.value = false;
  }
}


// 组件销毁时清理资源
let scrollHandler = null;

onMounted(() => {
  // 等待DOM渲染完成后绑定滚动事件
  nextTick(() => {
    if (historyListRef.value) {
      scrollHandler = handleScroll;
      historyListRef.value.addEventListener('scroll', scrollHandler, { passive: true });
    }
  });
});

onUnmounted(() => {
  // 清理滚动事件监听器
  if (historyListRef.value && scrollHandler) {
    historyListRef.value.removeEventListener('scroll', scrollHandler);
  }
  scrollHandler = null;
});
</script>

<style scoped>
.history-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.search-section {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.history-list {
  width: 100%;
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.history-item {
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f5f5f5;
}

.history-item:hover {
  background-color: #f5f5f5;
}

.history-item:last-child {
  border-bottom: none;
}

.item-content {
  width: 100%;
  flex: 1;
  min-width: 0;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.method-tag {
  font-size: 10px;
  font-weight: 500;
  min-width: 45px;
  text-align: center;
}

.timestamp {
  font-size: 10px;
  color: #999;
}

.item-url {
  width: 100%;
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.duration {
  font-size: 10px;
  color: #666;
}

.item-actions {
  margin-left: 8px;
}

.empty-state {
  margin: 40px 0;
}

.panel-footer {
  padding: 8px 16px;
  border-top: 1px solid #f0f0f0;
}

/* 加载指示器样式 */
.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  gap: 8px;
  color: #666;
  font-size: 12px;
}

.initial-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  gap: 12px;
  color: #666;
  font-size: 14px;
}

/* 提示信息样式 */
.scroll-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  color: #1890ff;
  font-size: 12px;
  background: linear-gradient(90deg, transparent 0%, #f0f9ff 20%, #f0f9ff 80%, transparent 100%);
  border-radius: 4px;
  margin: 8px 16px;
  position: relative;
}

.scroll-hint::before {
  content: '↓';
  margin-right: 6px;
  font-size: 14px;
  animation: bounce 2s infinite;
}

.completion-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  color: #52c41a;
  font-size: 12px;
  background: linear-gradient(90deg, transparent 0%, #f6ffed 20%, #f6ffed 80%, transparent 100%);
  border-radius: 4px;
  margin: 8px 16px;
}

.completion-hint::before {
  content: '✓';
  margin-right: 6px;
  font-size: 14px;
  font-weight: bold;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-3px);
  }
  60% {
    transform: translateY(-1px);
  }
}

/* 滚动条样式 */
.history-list::-webkit-scrollbar {
  width: 4px;
}

.history-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.history-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.history-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 深色主题样式 */
[data-theme="dark"] .history-item {
  border-bottom: 1px solid #303030;
}

[data-theme="dark"] .history-item:hover {
  background-color: #262626;
}

[data-theme="dark"] .timestamp {
  color: #8c8c8c;
}

[data-theme="dark"] .item-url {
  color: #fff;
}

[data-theme="dark"] .duration {
  color: #8c8c8c;
}

[data-theme="dark"] .panel-footer {
  border-top: 1px solid #303030;
}

[data-theme="dark"] .history-list::-webkit-scrollbar-track {
  background: #1f1f1f;
}

[data-theme="dark"] .history-list::-webkit-scrollbar-thumb {
  background: #434343;
}

[data-theme="dark"] .history-list::-webkit-scrollbar-thumb:hover {
  background: #595959;
}

[data-theme="dark"] .loading-more {
  color: #8c8c8c;
}

[data-theme="dark"] .initial-loading {
  color: #8c8c8c;
}

[data-theme="dark"] .scroll-hint {
  color: #1890ff;
  background: linear-gradient(90deg, transparent 0%, #111b26 20%, #111b26 80%, transparent 100%);
}

[data-theme="dark"] .completion-hint {
  color: #52c41a;
  background: linear-gradient(90deg, transparent 0%, #162312 20%, #162312 80%, transparent 100%);
}
</style>
