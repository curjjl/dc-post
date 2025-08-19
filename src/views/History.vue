<template>
  <div class="history-page">
    <div class="header">
      <div class="header-content">
        <a-button type="text" @click="goBackToWorkspace" class="back-btn">
          <template #icon><ArrowLeftOutlined /></template>
          返回工作台
        </a-button>
        <h1 class="title">请求历史</h1>
        <div class="header-actions">
          <a-button @click="clearHistory" danger>
            <template #icon><DeleteOutlined /></template>
            清空历史
          </a-button>
        </div>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <div class="search-container">
        <a-input-search
          v-model:value="searchKeyword"
          placeholder="搜索请求URL、方法..."
          size="large"
          @search="handleSearch"
          @input="handleSearchInput"
        />
        <div class="stats">
          <span>共 {{ totalCount }} 条记录</span>
          <span v-if="searchKeyword">找到 {{ filteredCount }} 条匹配</span>
        </div>
      </div>
    </div>

    <!-- 历史记录列表 -->
    <div class="history-content" ref="scrollContainer" @scroll="handleScroll">
      <div class="history-list">
        <!-- 历史记录项 -->
        <a-tabs v-model:activeKey="activeKey" @change="handleQueryParamsChange">
          <a-tab-pane key="api" tab="请求历史"> </a-tab-pane>
          <!-- <a-tab-pane key="debug" tab="已保存"></a-tab-pane> -->
          <a-tab-pane key="connector" tab="连接器"></a-tab-pane>
        </a-tabs>
        <!-- 空状态 -->
        <div
          v-if="displayedHistory.length === 0 && !loading"
          class="empty-state"
        >
          <a-empty
            v-if="!loadError"
            :description="`暂无${activeKey === 'api' ? '历史记录' : '数据'}`"
          >
            <template #image>
              <HistoryOutlined style="font-size: 48px; color: #d9d9d9" />
            </template>
            <a-button
              v-if="!searchKeyword"
              type="primary"
              @click="goBackToWorkspace"
            >
              开始发送请求
            </a-button>
            <a-button v-else @click="clearSearch"> 清空搜索 </a-button>
          </a-empty>

          <!-- 首次加载错误 -->
          <a-result
            v-else
            status="error"
            title="加载失败"
            :sub-title="loadError"
          >
            <template #extra>
              <a-space>
                <a-button type="primary" @click="retryLoad"> 重试 </a-button>
                <a-button @click="goBackToWorkspace"> 返回工作台 </a-button>
              </a-space>
            </template>
          </a-result>
        </div>
        <div
          v-for="item in displayedHistory"
          :key="item.fid || item.id"
          class="history-item"
        >
          <div class="item-header">
            <div class="method-url">
              <a-tag :color="getMethodColor(item.method)" class="method-tag">
                {{ item.method }}
              </a-tag>
              <span class="url" :title="item.url">{{ item.url }}</span>
            </div>
            <div class="item-actions">
              <a-button type="text" size="small" @click="useRequest(item)">
                <template #icon><PlayCircleOutlined /></template>
                使用
              </a-button>
              <a-button
                type="text"
                size="small"
                danger
                @click="deleteHistoryItem(item)"
              >
                <template #icon><DeleteOutlined /></template>
              </a-button>
            </div>
          </div>

          <div class="item-details">
            <div class="detail-row">
              <span class="detail-label">时间:</span>
              <span class="detail-value">{{ formatTime(item.timestamp) }}</span>
            </div>
            <div v-if="item.status" class="detail-row">
              <span class="detail-label">状态:</span>
              <a-tag :color="getStatusColor(item.status)" size="small">
                {{ item.status }}
              </a-tag>
            </div>
            <div v-if="item.duration" class="detail-row">
              <span class="detail-label">耗时:</span>
              <span class="detail-value">{{ item.duration }}ms</span>
            </div>
          </div>

          <!-- 请求详情预览 -->
          <div
            v-if="item.queryParams && item.queryParams.length > 0"
            class="request-preview"
          >
            <div class="preview-section">
              <span class="preview-label">Query参数:</span>
              <div class="preview-content">
                <a-tag
                  v-for="param in getEnabledParams(item.queryParams)"
                  :key="param.key"
                  size="small"
                >
                  {{ param.key }}={{ param.value }}
                </a-tag>
              </div>
            </div>
          </div>

          <div
            v-if="item.headers && getEnabledHeaders(item.headers).length > 0"
            class="request-preview"
          >
            <div class="preview-section">
              <span class="preview-label">Headers:</span>
              <div class="preview-content">
                <a-tag
                  v-for="header in getEnabledHeaders(item.headers).slice(0, 3)"
                  :key="header.key"
                  size="small"
                >
                  {{ header.key }}
                </a-tag>
                <span
                  v-if="getEnabledHeaders(item.headers).length > 3"
                  class="more-indicator"
                >
                  +{{ getEnabledHeaders(item.headers).length - 3 }} 更多
                </span>
              </div>
            </div>
          </div>
        </div>
        <!-- 加载更多指示器 -->
        <div v-if="loading && !loadError" class="loading-indicator">
          <a-spin size="large">
            <template #indicator>
              <LoadingOutlined style="font-size: 24px" spin />
            </template>
          </a-spin>
          <p>{{ isLoadingMore ? "加载更多..." : "加载中..." }}</p>
        </div>

        <!-- 加载错误提示 -->
        <div v-if="loadError && displayedHistory.length > 0" class="load-error">
          <a-result status="warning" title="加载失败" :sub-title="loadError">
            <template #extra>
              <a-button type="primary" @click="retryLoad">
                重试加载 ({{ retryCount }}/{{ maxRetries }})
              </a-button>
            </template>
          </a-result>
        </div>

        <!-- 没有更多数据提示 -->
        <div
          v-if="
            !hasMore && displayedHistory.length > 0 && !loading && !loadError
          "
          class="no-more"
        >
          <a-divider>
            <span style="color: #999; font-size: 12px">已全部加载</span>
          </a-divider>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { useRouter } from "vue-router";
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  HistoryOutlined,
  PlayCircleOutlined,
  LoadingOutlined,
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
  suffix: {
    type: String,
    default: null,
  },
  dir: {
    type: String,
    default: null,
  },
});

const router = useRouter();

const activeKey = ref("api");

// 数据状态
const historyList = ref([]);
const displayedHistory = ref([]);
const searchKeyword = ref("");
const loading = ref(false);
const scrollContainer = ref(null);
const loadError = ref(null);
const retryCount = ref(0);
const maxRetries = 3;

// 分页相关
const pageSize = 20;
const currentPage = ref(1);
const hasMore = ref(true);
const isInitialLoad = ref(true);
const searchParams = ref(null);

// 节流控制
let loadMoreTimeout = null;
const isLoadingMore = ref(false);

// 搜索防抖
let searchTimeout = null;

// 过滤后的历史记录（现在主要用于前端显示逻辑，搜索已移至后台）
const filteredHistory = computed(() => {
  // 由于搜索已在后台进行，这里主要返回已显示的历史记录
  return displayedHistory.value;
});

// 统计信息
// const totalCount = computed(() => historyList.value.length);
const totalCount = ref(0);
const filteredCount = computed(() => filteredHistory.value.length);

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
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  // 小于1分钟
  if (diff < 60000) {
    return "刚刚";
  }
  // 小于1小时
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  }
  // 小于1天
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`;
  }
  // 小于7天
  if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`;
  }

  return date.toLocaleString();
};

// 获取启用的参数
const getEnabledParams = (params) => {
  return params ? params.filter((p) => p.enabled && p.key) : [];
};

// 获取启用的Headers
const getEnabledHeaders = (headers) => {
  return headers && Array.isArray(headers)
    ? headers?.filter((h) => h.enabled && h.key)
    : [];
};

// 加载历史记录
// const loadHistory = () => {
//   const saved = localStorage.getItem("api_request_history");
//   if (saved) {
//     historyList.value = JSON.parse(saved).reverse(); // 最新的在前面
//     loadMoreData();
//   }
// };

// 加载更多数据
const loadMoreData = async () => {
  if (isLoadingMore.value || !hasMore.value) {
    return;
  }

  try {
    isLoadingMore.value = true;
    loading.value = true;

    // 如果是搜索状态，使用搜索参数；否则使用原始参数
    const params = searchParams.value || {
      id: props.id,
      name: props.name,
      code: props.code,
      pid: props.pid,
      dir: props.dir,
    };

    await fetchHistoryPage(params, activeKey.value, currentPage.value);
  } catch (error) {
    console.error("加载更多数据失败:", error);
    message.error("加载更多数据失败");
  } finally {
    isLoadingMore.value = false;
    loading.value = false;
  }
};

// 重置显示数据
const resetDisplayedData = async () => {
  displayedHistory.value = [];
  historyList.value = [];
  currentPage.value = 1;
  hasMore.value = true;
  isInitialLoad.value = true;

  const params = searchParams.value || {
    id: props.id,
    name: props.name,
    code: props.code,
    pid: props.pid,
    dir: props.dir,
  };

  try {
    loading.value = true;
    await fetchHistoryPage(params, activeKey.value, 1);
  } catch (error) {
    console.error("重置数据失败:", error);
  } finally {
    loading.value = false;
  }
};

// 滚动处理（优化性能和兼容性）
const handleScroll = () => {
  if (
    !scrollContainer.value ||
    loading.value ||
    !hasMore.value ||
    isLoadingMore.value
  ) {
    return;
  }

  const { scrollTop, scrollHeight, clientHeight } = scrollContainer.value;

  // 优化：使用自适应阈值，提高不同屏幕尺寸的兼容性
  const remainingHeight = scrollHeight - scrollTop - clientHeight;
  const dynamicThreshold = Math.min(150, Math.max(50, scrollHeight * 0.1));

  // 当距离底部小于动态阈值时开始加载
  if (remainingHeight <= dynamicThreshold) {
    // 节流处理，避免重复触发
    if (loadMoreTimeout) {
      clearTimeout(loadMoreTimeout);
    }

    loadMoreTimeout = setTimeout(() => {
      // 使用 requestAnimationFrame 优化加载时机
      requestAnimationFrame(() => {
        loadMoreData();
      });
    }, 150); // 平衡响应性和性能
  }
};

// 搜索处理
const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    // 清空搜索，恢复正常加载
    searchParams.value = null;
    await resetDisplayedData();
    return;
  }

  // 设置搜索参数
  searchParams.value = {
    id: props.id,
    name: props.name,
    code: props.code,
    pid: props.pid,
    dir: props.dir,
    search: searchKeyword.value.trim(),
  };

  await resetDisplayedData();
};

// 搜索输入处理（防抖）
const handleSearchInput = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    handleSearch();
  }, 300);
};

// 监听查询参数变化
watch(
  () => [props.pid, props.dir],
  (newParams) => {
    // console.log("History页面查询参数变化:", {
    //   id: newParams[0],
    //   name: newParams[1],
    //   code: newParams[2],
    //   pid: newParams[3],
    //   dir: newParams[4],
    // });
    // 这里可以根据参数变化执行相应的逻辑
    handleQueryParamsChange(activeKey.value);
  },
  { immediate: true }
);

// 处理查询参数变化
function handleQueryParamsChange(type = "api") {
  // 可以在这里根据查询参数执行查询后台服务等操作
  const queryParams = {
    id: props.id,
    name: props.name,
    code: props.code,
    pid: props.pid,
    dir: props.dir,
  };

  fetchHistory(queryParams, type);

  // if (hasValidQueryParams(queryParams)) {
  //   // 构建API查询参数
  //   const apiParams = buildApiQueryParams(queryParams);
  //   fetchHistory(apiParams, type);
  // }
}

// 查询历史记录（兼容原有调用）
async function fetchHistory(apiParams, type) {
  await fetchHistoryPage(apiParams, type, 1, true);
}

// 分页查询历史记录
async function fetchHistoryPage(apiParams, type, page = 1, isReset = false) {
  try {
    // 如果是重置加载，清空现有数据
    if (isReset || isInitialLoad.value) {
      displayedHistory.value = [];
      historyList.value = [];
      isInitialLoad.value = false;
      loadError.value = null; // 重置错误状态
    }

    const filterObj = {
      project_id: apiParams?.pid,
      directory_id: apiParams?.dir,
      "project_object.tenant_id": getTenantId(),
      suffix: type,
    };

    // 如果有搜索关键词，添加搜索条件
    if (apiParams?.search) {
      filterObj.$or = [
        { name: { $like: `%${apiParams.search}%` } },
        { "t1.content": { $like: `%${apiParams.search}%` } },
      ];
    }

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
      page: page,
      pagesize: pageSize || 20,
      filter: JSON.stringify(clearEmptyProperties(filterObj)),
      join: JSON.stringify(joinObj),
      keys: JSON.stringify(keyObj),
      sort: JSON.stringify({ "project_object.create_date": -1 }),
    };

    // 只在第一页或重置时获取总数
    if (page === 1 || isReset) {
      try {
        const totalRes = await api.object.getListTotal(params);
        if (totalRes?.status === 200) {
          const _data = totalRes?.data?.data;
          totalCount.value = _data?._size || 0;
        }
      } catch (totalError) {
        console.warn("获取总数失败:", totalError);
        // 总数获取失败不影响数据加载
      }
    }

    const res = await api.object.getList(params);
    if (res.status === 200 && res?.data?.data) {
      const newItems = [];

      res?.data?.data?.forEach((item) => {
        if (item?.content) {
          try {
            const jsonCont = JSON.parse(item.content);
            const cont =
              type === "api"
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
            console.warn("解析数据失败:", parseError, item);
          }
        }
      });

      // 添加新数据到列表
      displayedHistory.value.push(...newItems);
      historyList.value.push(...newItems);

      // 更新分页状态
      currentPage.value = page + 1;
      hasMore.value = newItems.length === pageSize; // 如果返回数据少于pageSize，说明没有更多数据

      // 成功加载，重置错误状态
      loadError.value = null;
      retryCount.value = 0;
    } else {
      // 没有数据或请求失败
      hasMore.value = false;
    }
  } catch (error) {
    console.error("服务错误:", error.userMessage || error.message);
    hasMore.value = false;

    const errorMessage = error.userMessage || error.message || "未知错误";
    loadError.value = errorMessage;

    // 只有在首次加载失败时才显示错误消息
    if (page === 1 || isReset) {
      if (retryCount.value < maxRetries) {
        retryCount.value++;
        console.log(`加载失败，准备第${retryCount.value}次重试...`);
        // 自动重试（延迟递增）
        setTimeout(() => {
          retryLoad();
        }, 1000 * retryCount.value);
      } else {
        message.error("加载历史记录失败，请检查网络连接");
      }
    }
  }
}

// 使用请求
const useRequest = (item) => {
  console.log("item====", item);
  if (item) {
    // 将请求数据存储到临时存储中，供工作台使用
    // sessionStorage.setItem("selected_request", JSON.stringify(item));
    // 保持当前查询参数，跳转到工作台
    const queryParams = {
      id: item.fid,
      pid: props.pid,
      dir: props.dir,
      name: item.fname,
      suffix: item.suffix,
    };
    const routeObject = buildRouteObject("Workspace", queryParams);
    router.push(routeObject);
    message.success("已加载到工作台");
  }
};

// 返回工作台（保持查询参数）
const goBackToWorkspace = () => {
  const queryParams = {
    id: props.id,
    name: props.name,
    code: props.code,
    pid: props.pid,
    dir: props.dir,
    suffix: props.suffix,
  };
  const routeObject = buildRouteObject("Workspace", queryParams);
  router.push(routeObject);
};

// 删除单个历史记录
const deleteHistoryItem = (item) => {
  if (!item || !item.fid) {
    return message.error("请求数据异常");
  }
  Modal.confirm({
    title: "确认删除",
    content: "确定要删除这条历史记录吗？",
    okText: "删除",
    cancelText: "取消",
    onOk: async () => {
      try {
        const objectRes = await api.object.deleteObject(item.fid);
        const objContRes = await api.objectCont.deleteObjectCont(item.fid);

        if (objectRes.status === 200 && objContRes.status === 200) {
          // 从当前显示列表中移除
          const targetFid = item.fid;
          historyList.value = historyList.value.filter(
            (historyItem) => historyItem.fid !== targetFid
          );
          displayedHistory.value = displayedHistory.value.filter(
            (historyItem) => historyItem.fid !== targetFid
          );

          // 更新总数
          if (totalCount.value > 0) {
            totalCount.value = totalCount.value - 1;
          }

          message.success("删除成功");
        } else {
          message.error("删除失败");
        }
      } catch (error) {
        console.error("删除失败:", error);
        message.error("删除失败，请重试");
      }
    },
  });
};

// 清空历史记录
const clearHistory = () => {
  Modal.confirm({
    title: "确认清空",
    content: "确定要清空所有历史记录吗？此操作不可恢复。",
    okText: "清空",
    cancelText: "取消",
    onOk: async () => {
      try {
        // 这里应该调用后台API批量删除历史记录
        // 由于当前没有批量删除API，我们先清空前端数据
        // 实际项目中建议添加批量删除API

        historyList.value = [];
        displayedHistory.value = [];
        totalCount.value = 0;
        hasMore.value = false;
        loadError.value = null;
        retryCount.value = 0;

        // 如果有localStorage的兼容代码，也要清理
        localStorage.removeItem("api_request_history");

        message.success("历史记录已清空");

        // 重新加载数据以确保状态同步
        await nextTick();
        handleQueryParamsChange(activeKey.value);
      } catch (error) {
        console.error("清空历史记录失败:", error);
        message.error("清空失败，请重试");
      }
    },
  });
};

// 节流函数
const throttle = (func, wait) => {
  let timeout;
  let previous = 0;

  return function executedFunction(...args) {
    const now = Date.now();
    const remaining = wait - (now - previous);

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func.apply(this, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func.apply(this, args);
      }, remaining);
    }
  };
};

// 节流后的滚动处理函数
const throttledHandleScroll = throttle(handleScroll, 150);

// 添加滚动事件监听
const setupScrollListener = () => {
  if (scrollContainer.value) {
    scrollContainer.value.addEventListener("scroll", throttledHandleScroll, {
      passive: true,
    });
  }
};

// 移除滚动事件监听
const removeScrollListener = () => {
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener("scroll", throttledHandleScroll);
  }

  // 清理所有定时器
  if (loadMoreTimeout) {
    clearTimeout(loadMoreTimeout);
    loadMoreTimeout = null;
  }
};

// 重试加载
const retryLoad = async () => {
  loadError.value = null;
  await resetDisplayedData();
};

// 清空搜索
const clearSearch = () => {
  searchKeyword.value = "";
  searchParams.value = null;
  loadError.value = null;
  retryCount.value = 0;
  resetDisplayedData();
};

onMounted(() => {
  // loadHistory();
  nextTick(() => {
    setupScrollListener();
  });
});

onUnmounted(() => {
  removeScrollListener();
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
});
</script>

<style scoped>
.history-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  min-height: 0; /* 允许弹性容器收缩 */
}

/* 固定头部 */
.header {
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  padding: 0 24px;
  height: 64px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.back-btn {
  color: #666;
  font-size: 14px;
}

.back-btn:hover {
  color: #1890ff;
}

.title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #262626;
}

.header-actions {
  display: flex;
  gap: 8px;
}

/* 搜索栏 */
.search-bar {
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  padding: 16px 24px;
  flex-shrink: 0;
}

.search-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.stats {
  display: flex;
  gap: 16px;
  color: #666;
  font-size: 14px;
  white-space: nowrap;
}

/* 内容区域 */
.history-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px;
  min-height: 0; /* 关键：允许滚动容器收缩 */
  height: 0; /* 强制计算高度 */
}

.history-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 0;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 20px;
}

/* 历史记录项 */
.history-item {
  background: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}

.history-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border-color: #d9d9d9;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.method-url {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.method-tag {
  font-weight: 600;
  font-size: 12px;
  margin-right: 12px;
  flex-shrink: 0;
}

.url {
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 14px;
  color: #262626;
  word-break: break-all;
  line-height: 1.4;
}

.item-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  margin-left: 16px;
}

.item-details {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.detail-label {
  color: #666;
  font-size: 12px;
  font-weight: 500;
}

.detail-value {
  color: #262626;
  font-size: 12px;
}

/* 请求预览 */
.request-preview {
  margin-top: 8px;
}

.preview-section {
  margin-bottom: 8px;
}

.preview-label {
  color: #666;
  font-size: 12px;
  font-weight: 500;
  margin-right: 8px;
}

.preview-content {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.more-indicator {
  color: #999;
  font-size: 12px;
}

/* 加载指示器 */
.loading-indicator {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.loading-indicator p {
  margin-top: 12px;
  font-size: 14px;
}

/* 加载错误 */
.load-error {
  margin: 20px 0;
}

.load-error .ant-result {
  padding: 20px;
}

/* 没有更多数据 */
.no-more {
  margin: 40px 0 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    padding: 0 16px;
  }

  .search-container {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .stats {
    justify-content: center;
  }

  .history-content {
    padding: 0 16px;
  }

  .history-item {
    padding: 16px;
  }

  .item-header {
    flex-direction: column;
    gap: 12px;
  }

  .item-actions {
    margin-left: 0;
    align-self: flex-end;
  }

  .item-details {
    gap: 16px;
  }
}

/* 滚动条样式 */
.history-content::-webkit-scrollbar {
  width: 6px;
}

.history-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.history-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.history-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 深色主题样式 */
[data-theme="dark"] .history-page {
  background: #000;
}

[data-theme="dark"] .header {
  background: #141414;
  border-bottom: 1px solid #303030;
}

[data-theme="dark"] .back-btn {
  color: #8c8c8c;
}

[data-theme="dark"] .back-btn:hover {
  color: #177ddc;
}

[data-theme="dark"] .title {
  color: #fff;
}

[data-theme="dark"] .search-bar {
  background: #141414;
  border-bottom: 1px solid #303030;
}

[data-theme="dark"] .stats {
  color: #8c8c8c;
}

[data-theme="dark"] .history-item {
  background: #141414;
  border-color: #303030;
}

[data-theme="dark"] .history-item:hover {
  border-color: #434343;
}

[data-theme="dark"] .url {
  color: #fff;
}

[data-theme="dark"] .detail-label {
  color: #8c8c8c;
}

[data-theme="dark"] .detail-value {
  color: #fff;
}

[data-theme="dark"] .preview-label {
  color: #8c8c8c;
}

[data-theme="dark"] .more-indicator {
  color: #8c8c8c;
}

[data-theme="dark"] .loading-indicator {
  color: #8c8c8c;
}

[data-theme="dark"] .loading-indicator p {
  color: #8c8c8c;
}

[data-theme="dark"] .history-content::-webkit-scrollbar-track {
  background: #1f1f1f;
}

[data-theme="dark"] .history-content::-webkit-scrollbar-thumb {
  background: #434343;
}

[data-theme="dark"] .history-content::-webkit-scrollbar-thumb:hover {
  background: #595959;
}

[data-theme="dark"] .load-error .ant-result {
  background: transparent;
}

/* 高度适配优化 - 不同分辨率下的滚动容器 */
@media (max-height: 600px) {
  .history-content {
    max-height: calc(100vh - 140px); /* 小屏幕设备 */
  }
}

@media (min-height: 800px) {
  .history-content {
    max-height: calc(100vh - 180px); /* 中等屏幕设备 */
  }
}

@media (min-height: 1080px) {
  .history-content {
    max-height: calc(100vh - 200px); /* 大屏幕设备 */
  }
}

/* 移动端响应式优化 */
@media (max-width: 768px) {
  .history-content {
    padding: 0 16px;
    max-height: calc(100vh - 160px); /* 移动端屏幕适配 */
  }
  
  .history-list {
    padding: 16px 0;
  }
}

/* 触摸设备优化 */
@media (pointer: coarse) {
  .history-content {
    -webkit-overflow-scrolling: touch; /* iOS平滑滚动 */
    max-height: calc(100vh - 150px); /* 触摸设备高度适配 */
  }
}

/* 宽高比适配 */
@media (max-aspect-ratio: 1/1) {
  /* 竖屏设备 */
  .history-content {
    max-height: calc(100vh - 170px);
  }
}

@media (min-aspect-ratio: 16/9) {
  /* 宽屏设备 */
  .history-content {
    max-height: calc(100vh - 220px);
  }
}

/* 高DPI屏幕优化 */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .history-content {
    /* 针对高分辨率屏幕的滚动优化 */
    will-change: scroll-position;
  }
}
</style>
