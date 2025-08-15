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
    <div class="history-list">
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
        v-if="!filteredHistory.length"
        :image="false"
        description="暂无历史记录"
        class="empty-state"
      >
        <template #image>
          <HistoryOutlined style="font-size: 48px; color: #d9d9d9" />
        </template>
      </a-empty>
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

// 数据状态
const totalCount = ref(0);
const historyList = ref([]);
const searchKeyword = ref("");
const loading = ref(false);

// 过滤后的历史记录
const filteredHistory = computed(() => {
  if (!searchKeyword.value) {
    return historyList.value.slice(0, 50); // 限制显示数量以提高性能
  }

  const keyword = searchKeyword.value.toLowerCase();
  return historyList.value
    .filter(
      (item) =>
        item.url.toLowerCase().includes(keyword) ||
        item.method.toLowerCase().includes(keyword)
    )
    .slice(0, 50);
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
      const objectRes = await api.object.deleteObject(item.fid);
      const objContRes = await api.objectCont.deleteObjectCont(item.fid);
      if (objectRes.status === 200 && objContRes.status === 200) {
        message.success("删除成功");
      } else {
        message.error("删除失败");
      }
      handleQueryParamsChange();
      historyList.value = historyList.value.filter(
        (item) => item.fid !== item.fid
      );
      totalCount.value = totalCount.value - 1;
    },
  });
};

// 清空所有历史
const clearAllHistory = () => {
  Modal.confirm({
    title: "确认清空",
    content: "确定要清空所有历史记录吗？此操作不可恢复。",
    onOk() {
      historyList.value = [];
      localStorage.removeItem("api_request_history");
      message.success("历史记录已清空");
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
  const queryParams = {
    id: props.id,
    name: props.name,
    code: props.code,
    pid: props.pid,
    dir: props.dir,
  };

  // fetchHistory(queryParams, type);

  if (hasValidQueryParams(queryParams)) {
    // 构建API查询参数
    const apiParams = buildApiQueryParams(queryParams);
    fetchHistory(apiParams, type);
  }
}

// 查询历史记录
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
      page: 1,
      pagesize: 10,
      filter: JSON.stringify(clearEmptyProperties(filterObj)),
      join: JSON.stringify(joinObj),
      keys: JSON.stringify(keyObj),
      sort: JSON.stringify({ "project_object.create_date": -1 }),
    };

    const totalRes = await api.object.getListTotal(params);
    if (totalRes?.status === 200) {
      const _data = totalRes?.data?.data;
      totalCount.value = _data?._size || 0;
    }

    const res = await api.object.getList(params);
    if (res.status === 200 && res?.data?.data) {
      res?.data?.data?.map((item) => {
        let cont = null;
        if (item?.content) {
          const jsonCont = JSON.parse(item.content);
          cont =
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
          historyList.value.push(historyItem);
        }
      });

      // API转Connector
      // const connectorData = ApiDataConverter.apiToConnector(apiContent);

      // Connector转API
      // const apiData = ApiDataConverter.connectorToApi(connectorContent);
    }
    loading.value = false;
  } catch (error) {
    //  console.log("error:", error);
    loading.value = false;
    console.error("服务错误:", error.userMessage || error.message);
  }
}

onMounted(() => {
  // loadHistory();
  // // 监听存储变化，实时更新历史记录
  // window.addEventListener("storage", (e) => {
  //   if (e.key === "api_request_history") {
  //     loadHistory();
  //   }
  // });
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
</style>
