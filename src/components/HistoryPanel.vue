<template>
  <div class="history-panel">
    <!-- 搜索框 -->
    <div class="search-section">
      <a-input-search
        v-model:value="searchKeyword"
        placeholder="搜索历史记录..."
        size="small"
        @search="handleSearch"
      />
    </div>

    <!-- 历史记录列表 -->
    <div class="history-list">
      <a-list
        :data-source="filteredHistory"
        size="small"
        :split="false"
      >
        <template #renderItem="{ item }">
          <a-list-item 
            class="history-item"
            @click="selectRequest(item)"
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
                <a-tag 
                  :color="getStatusColor(item.status)" 
                  size="small"
                >
                  {{ item.status }}
                </a-tag>
                <span v-if="item.duration" class="duration">{{ item.duration }}ms</span>
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
                    <a-menu-item @click="deleteRequest(item.id)" danger>
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
      <a-button 
        type="text" 
        size="small" 
        block
        @click="clearAllHistory"
        danger
      >
        <template #icon><DeleteOutlined /></template>
        清空历史
      </a-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  MoreOutlined, 
  PlayCircleOutlined, 
  CopyOutlined, 
  DeleteOutlined,
  HistoryOutlined 
} from '@ant-design/icons-vue'
import { message, Modal } from 'ant-design-vue'

const emit = defineEmits(['select-request'])

// 数据状态
const historyList = ref([])
const searchKeyword = ref('')

// 过滤后的历史记录
const filteredHistory = computed(() => {
  if (!searchKeyword.value) {
    return historyList.value.slice(0, 50) // 限制显示数量以提高性能
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  return historyList.value.filter(item => 
    item.url.toLowerCase().includes(keyword) ||
    item.method.toLowerCase().includes(keyword)
  ).slice(0, 50)
})

// 获取请求方法颜色
const getMethodColor = (method) => {
  const colors = {
    GET: 'green',
    POST: 'blue',
    PUT: 'orange',
    DELETE: 'red',
    PATCH: 'purple',
    HEAD: 'cyan',
    OPTIONS: 'geekblue'
  }
  return colors[method] || 'default'
}

// 获取状态码颜色
const getStatusColor = (status) => {
  if (status >= 200 && status < 300) return 'success'
  if (status >= 300 && status < 400) return 'warning'
  if (status >= 400 && status < 500) return 'error'
  if (status >= 500) return 'error'
  return 'default'
}

// 格式化时间
const formatTime = (timestamp) => {
  const now = Date.now()
  const diff = now - timestamp
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  
  return new Date(timestamp).toLocaleDateString()
}

// 截断URL显示
const truncateUrl = (url) => {
  if (url.length <= 40) return url
  return url.substring(0, 37) + '...'
}

// 加载历史记录
const loadHistory = () => {
  const saved = localStorage.getItem('api_request_history')
  if (saved) {
    historyList.value = JSON.parse(saved).reverse() // 最新的在前面
  }
}

// 搜索处理
const handleSearch = () => {
  // 搜索逻辑已在computed中处理
}

// 选择请求
const selectRequest = (item) => {
  emit('select-request', item)
  message.success('已加载请求配置')
}

// 复制请求
const duplicateRequest = (item) => {
  const newItem = {
    ...item,
    id: Date.now().toString(),
    timestamp: Date.now()
  }
  
  historyList.value.unshift(newItem)
  saveHistory()
  message.success('请求已复制')
}

// 删除单个请求
const deleteRequest = (id) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这条历史记录吗？',
    onOk() {
      historyList.value = historyList.value.filter(item => item.id !== id)
      saveHistory()
      message.success('删除成功')
    }
  })
}

// 清空所有历史
const clearAllHistory = () => {
  Modal.confirm({
    title: '确认清空',
    content: '确定要清空所有历史记录吗？此操作不可恢复。',
    onOk() {
      historyList.value = []
      localStorage.removeItem('api_request_history')
      message.success('历史记录已清空')
    }
  })
}

// 保存历史记录
const saveHistory = () => {
  localStorage.setItem('api_request_history', JSON.stringify(historyList.value.reverse()))
  historyList.value.reverse() // 恢复显示顺序
}

onMounted(() => {
  loadHistory()
  
  // 监听存储变化，实时更新历史记录
  window.addEventListener('storage', (e) => {
    if (e.key === 'api_request_history') {
      loadHistory()
    }
  })
})
</script>

<style scoped>
.history-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.search-section {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.history-list {
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
  font-size: 12px;
  color: #333;
  margin-bottom: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
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
