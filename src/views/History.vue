<template>
  <a-layout class="history-layout">
    <a-layout-header class="header">
      <div class="header-content">
        <a-button type="text" @click="$router.push('/workspace')">
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
    </a-layout-header>

    <a-layout-content class="content">
      <div class="history-container">
        <a-card title="历史记录" :bordered="false">
          <template #extra>
            <a-input-search
              v-model:value="searchKeyword"
              placeholder="搜索请求..."
              style="width: 300px"
              @search="handleSearch"
            />
          </template>
          
          <a-list
            :data-source="filteredHistory"
            :pagination="paginationConfig"
            item-layout="vertical"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <template #actions>
                  <a-button type="link" @click="useRequest(item)">使用</a-button>
                  <a-button type="link" danger @click="deleteHistoryItem(item.id)">删除</a-button>
                </template>
                
                <a-list-item-meta>
                  <template #title>
                    <a-tag :color="getMethodColor(item.method)">{{ item.method }}</a-tag>
                    <span class="url">{{ item.url }}</span>
                  </template>
                  <template #description>
                    <div class="request-info">
                      <span>时间: {{ formatTime(item.timestamp) }}</span>
                      <span v-if="item.status">状态: {{ item.status }}</span>
                      <span v-if="item.duration">耗时: {{ item.duration }}ms</span>
                    </div>
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </div>
    </a-layout-content>
  </a-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeftOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { message, Modal } from 'ant-design-vue'

const router = useRouter()

// 数据状态
const historyList = ref([])
const searchKeyword = ref('')

// 分页配置
const paginationConfig = {
  pageSize: 10,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 条记录`
}

// 过滤后的历史记录
const filteredHistory = computed(() => {
  if (!searchKeyword.value) {
    return historyList.value
  }
  return historyList.value.filter(item => 
    item.url.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
    item.method.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

// 获取请求方法颜色
const getMethodColor = (method) => {
  const colors = {
    GET: 'green',
    POST: 'blue',
    PUT: 'orange',
    DELETE: 'red',
    PATCH: 'purple'
  }
  return colors[method] || 'default'
}

// 格式化时间
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString()
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
      localStorage.removeItem('api_request_history')
      message.success('历史记录已清空')
    }
  })
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.history-layout {
  height: 100vh;
}

.header {
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  padding: 0 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.content {
  padding: 24px;
  background: #f5f5f5;
}

.history-container {
  max-width: 1200px;
  margin: 0 auto;
}

.url {
  margin-left: 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.request-info {
  display: flex;
  gap: 16px;
  color: #666;
  font-size: 12px;
}
</style>
