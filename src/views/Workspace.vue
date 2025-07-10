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
          <a-button type="text" @click="showCodeGenerator = true" :disabled="!hasValidRequest">
            <template #icon><CodeOutlined /></template>
            生成代码
          </a-button>
          <a-button type="text" @click="$router.push('/history')">
            <template #icon><HistoryOutlined /></template>
            历史记录
          </a-button>
          <a-button type="text" @click="toggleTheme">
            <template #icon><BulbOutlined /></template>
            {{ isDarkMode ? '浅色主题' : '深色主题' }}
          </a-button>
        </div>
      </div>
    </a-layout-header>

    <a-layout>
      <!-- 左侧历史记录面板 -->
      <a-layout-sider 
        v-model:collapsed="historyCollapsed" 
        :width="300" 
        collapsible
        theme="light"
        class="history-sider"
      >
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
        :width="400"
        collapsible
        theme="light"
        class="response-sider"
        :reverseArrow="true"
      >
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
import { ref, computed } from 'vue'
import { HistoryOutlined, BulbOutlined, SettingOutlined, CodeOutlined } from '@ant-design/icons-vue'
import RequestConfig from '@/components/RequestConfig.vue'
import ResponsePanel from '@/components/ResponsePanel.vue'
import HistoryPanel from '@/components/HistoryPanel.vue'
import EnvManager from '@/components/EnvManager.vue'
import CodeGenerator from '@/components/CodeGenerator.vue'
import httpService from '@/services/httpService.js'

// 面板折叠状态
const historyCollapsed = ref(false)
const responseCollapsed = ref(false)

// 请求状态
const requestLoading = ref(false)
const currentResponse = ref(null)
const requestConfigRef = ref(null)
const currentRequestData = ref({})

// 对话框状态
const showEnvManager = ref(false)
const showCodeGenerator = ref(false)

// 主题状态
const isDarkMode = ref(false)

// 初始化主题状态
const initTheme = () => {
  const savedTheme = localStorage.getItem('theme')
  isDarkMode.value = savedTheme === 'dark'
}

// 是否有有效的请求数据
const hasValidRequest = computed(() => {
  return currentRequestData.value.url && currentRequestData.value.method
})

// 主题切换
const toggleTheme = () => {
  if (window.toggleTheme) {
    window.toggleTheme()
    // 更新本地状态
    isDarkMode.value = !isDarkMode.value
  }
}

// 处理发送请求
const handleSendRequest = async (requestData) => {
  requestLoading.value = true
  currentRequestData.value = requestData // 保存当前请求数据

  try {
    console.log('发送请求:', requestData)

    // 使用HTTP服务发送请求
    const response = await httpService.sendRequest(requestData)
    currentResponse.value = response

    // 更新历史记录中的响应信息
    updateHistoryWithResponse(requestData.id, response)

  } catch (error) {
    console.error('请求失败:', error)
    currentResponse.value = {
      status: 0,
      statusText: 'Error',
      headers: {},
      data: { error: error.message },
      duration: 0,
      size: '0 B'
    }
  } finally {
    requestLoading.value = false
  }
}

// 更新历史记录中的响应信息
const updateHistoryWithResponse = (requestId, response) => {
  const history = JSON.parse(localStorage.getItem('api_request_history') || '[]')
  const index = history.findIndex(item => item.id === requestId)

  if (index !== -1) {
    history[index] = {
      ...history[index],
      status: response.status,
      statusText: response.statusText,
      duration: response.duration,
      responseSize: response.size
    }
    localStorage.setItem('api_request_history', JSON.stringify(history))
  }
}

// 处理选择历史请求
const handleSelectRequest = (requestData) => {
  if (requestConfigRef.value) {
    requestConfigRef.value.loadRequest(requestData)
  }
}

// 初始化
initTheme()
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

.history-sider, .response-sider {
  background: #fff !important;
  border-left: 1px solid #f0f0f0;
  border-right: 1px solid #f0f0f0;
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

[data-theme="dark"] .main-content {
  background: #000;
}
</style>
