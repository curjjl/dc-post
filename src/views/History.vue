<template>
  <div class="history-page">
    <!-- 固定头部 -->
    <div class="header">
      <div class="header-content">
        <a-button type="text" @click="$router.push('/workspace')" class="back-btn">
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
        <!-- 空状态 -->
        <div v-if="displayedHistory.length === 0 && !loading" class="empty-state">
          <a-empty description="暂无历史记录">
            <template #image>
              <HistoryOutlined style="font-size: 48px; color: #d9d9d9" />
            </template>
            <a-button type="primary" @click="$router.push('/workspace')">
              开始发送请求
            </a-button>
          </a-empty>
        </div>

        <!-- 历史记录项 -->
        <div v-for="item in displayedHistory" :key="item.id" class="history-item">
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
              <a-button type="text" size="small" danger @click="deleteHistoryItem(item.id)">
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
          <div v-if="item.queryParams && item.queryParams.length > 0" class="request-preview">
            <div class="preview-section">
              <span class="preview-label">Query参数:</span>
              <div class="preview-content">
                <a-tag v-for="param in getEnabledParams(item.queryParams)" :key="param.key" size="small">
                  {{ param.key }}={{ param.value }}
                </a-tag>
              </div>
            </div>
          </div>

          <div v-if="item.headers && getEnabledHeaders(item.headers).length > 0" class="request-preview">
            <div class="preview-section">
              <span class="preview-label">Headers:</span>
              <div class="preview-content">
                <a-tag v-for="header in getEnabledHeaders(item.headers).slice(0, 3)" :key="header.key" size="small">
                  {{ header.key }}
                </a-tag>
                <span v-if="getEnabledHeaders(item.headers).length > 3" class="more-indicator">
                  +{{ getEnabledHeaders(item.headers).length - 3 }} 更多
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 加载更多指示器 -->
        <div v-if="loading" class="loading-indicator">
          <a-spin size="large">
            <template #indicator>
              <LoadingOutlined style="font-size: 24px" spin />
            </template>
          </a-spin>
          <p>加载中...</p>
        </div>

        <!-- 没有更多数据提示 -->
        <div v-if="!hasMore && displayedHistory.length > 0" class="no-more">
          <a-divider>
            <span style="color: #999; font-size: 12px;">已显示全部历史记录</span>
          </a-divider>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  HistoryOutlined,
  PlayCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons-vue'
import { message, Modal } from 'ant-design-vue'

const router = useRouter()

// 数据状态
const historyList = ref([])
const displayedHistory = ref([])
const searchKeyword = ref('')
const loading = ref(false)
const scrollContainer = ref(null)

// 分页相关
const pageSize = 10
const currentPage = ref(1)
const hasMore = ref(true)

// 搜索防抖
let searchTimeout = null

// 过滤后的历史记录
const filteredHistory = computed(() => {
  if (!searchKeyword.value) {
    return historyList.value
  }
  return historyList.value.filter(item =>
    item.url.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
    item.method.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
    (item.queryParams && item.queryParams.some(param =>
      param.key.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      param.value.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )) ||
    (item.headers && item.headers.some(header =>
      header.key.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      header.value.toLowerCase().includes(searchKeyword.value.toLowerCase())
    ))
  )
})

// 统计信息
const totalCount = computed(() => historyList.value.length)
const filteredCount = computed(() => filteredHistory.value.length)

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
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  // 小于1分钟
  if (diff < 60000) {
    return '刚刚'
  }
  // 小于1小时
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  }
  // 小于1天
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  }
  // 小于7天
  if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`
  }

  return date.toLocaleString()
}

// 获取启用的参数
const getEnabledParams = (params) => {
  return params ? params.filter(p => p.enabled && p.key) : []
}

// 获取启用的Headers
const getEnabledHeaders = (headers) => {
  return headers ? headers.filter(h => h.enabled && h.key) : []
}

// 加载历史记录
const loadHistory = () => {
  const saved = localStorage.getItem('api_request_history')
  if (saved) {
    historyList.value = JSON.parse(saved).reverse() // 最新的在前面
    loadMoreData()
  }
}

// 加载更多数据
const loadMoreData = () => {
  const startIndex = (currentPage.value - 1) * pageSize
  const endIndex = startIndex + pageSize
  const newItems = filteredHistory.value.slice(startIndex, endIndex)

  if (newItems.length > 0) {
    displayedHistory.value.push(...newItems)
    currentPage.value++
  }

  hasMore.value = endIndex < filteredHistory.value.length
  loading.value = false
}

// 重置显示数据
const resetDisplayedData = () => {
  displayedHistory.value = []
  currentPage.value = 1
  hasMore.value = true
  loadMoreData()
}

// 滚动处理
const handleScroll = () => {
  if (!scrollContainer.value || loading.value || !hasMore.value) return

  const { scrollTop, scrollHeight, clientHeight } = scrollContainer.value

  // 距离底部100px时开始加载
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    loading.value = true
    setTimeout(() => {
      loadMoreData()
    }, 500) // 模拟加载延迟
  }
}

// 搜索处理
const handleSearch = () => {
  resetDisplayedData()
}

// 搜索输入处理（防抖）
const handleSearchInput = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    resetDisplayedData()
  }, 300)
}

// 使用请求
const useRequest = (item) => {
  // 将请求数据存储到临时存储中，供工作台使用
  sessionStorage.setItem('selected_request', JSON.stringify(item))
  router.push('/workspace')
  message.success('已加载到工作台')
}

// 删除单个历史记录
const deleteHistoryItem = (id) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这条历史记录吗？',
    onOk() {
      historyList.value = historyList.value.filter(item => item.id !== id)
      displayedHistory.value = displayedHistory.value.filter(item => item.id !== id)
      localStorage.setItem('api_request_history', JSON.stringify(historyList.value))
      message.success('删除成功')
    }
  })
}

// 清空历史记录
const clearHistory = () => {
  Modal.confirm({
    title: '确认清空',
    content: '确定要清空所有历史记录吗？此操作不可恢复。',
    onOk() {
      historyList.value = []
      displayedHistory.value = []
      localStorage.removeItem('api_request_history')
      message.success('历史记录已清空')
      hasMore.value = false
    }
  })
}

// 添加滚动事件监听
const setupScrollListener = () => {
  if (scrollContainer.value) {
    scrollContainer.value.addEventListener('scroll', handleScroll)
  }
}

// 移除滚动事件监听
const removeScrollListener = () => {
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener('scroll', handleScroll)
  }
}

onMounted(() => {
  loadHistory()
  nextTick(() => {
    setupScrollListener()
  })
})

onUnmounted(() => {
  removeScrollListener()
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
})
</script>

<style scoped>
.history-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
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
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
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
</style>
