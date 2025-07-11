<template>
  <div class="request-config">
    <!-- 请求基本配置 -->
    <a-card :title="route.query.name || '请求配置'" class="config-card">
      <a-form :model="requestForm" layout="vertical">
        <!-- 请求方法和URL -->
        <a-row :gutter="16">
          <a-col :span="4">
            <a-form-item label="方法">
              <a-select v-model:value="requestForm.method" size="large">
                <a-select-option value="GET">GET</a-select-option>
                <a-select-option value="POST">POST</a-select-option>
                <a-select-option value="PUT">PUT</a-select-option>
                <a-select-option value="DELETE">DELETE</a-select-option>
                <a-select-option value="PATCH">PATCH</a-select-option>
                <a-select-option value="HEAD">HEAD</a-select-option>
                <a-select-option value="OPTIONS">OPTIONS</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="16">
            <a-form-item label="URL">
              <a-input
                v-model:value="displayUrl"
                placeholder="https://api.example.com/endpoint?param1=value1&param2=value2"
                size="large"
                @change="handleUrlChange"
                @blur="handleUrlBlur"
              />
            </a-form-item>
          </a-col>
          <a-col :span="4">
            <a-form-item label=" ">
              <a-button 
                type="primary" 
                size="large" 
                block
                :loading="loading"
                @click="sendRequest"
              >
                发送
              </a-button>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <!-- 参数配置标签页 -->
    <a-card class="params-card">
      <a-tabs v-model:activeKey="activeTab">
        <!-- Query参数 -->
        <a-tab-pane key="query" tab="Query参数">
          <ParamsTable 
            v-model:params="requestForm.queryParams"
            placeholder-key="参数名"
            placeholder-value="参数值"
          />
        </a-tab-pane>

        <!-- Headers -->
        <a-tab-pane key="headers" tab="Headers">
          <ParamsTable 
            v-model:params="requestForm.headers"
            placeholder-key="Header名"
            placeholder-value="Header值"
            :preset-options="headerPresets"
          />
        </a-tab-pane>

        <!-- 认证 -->
        <a-tab-pane key="auth" tab="认证">
          <AuthConfig v-model:auth="requestForm.auth" />
        </a-tab-pane>

        <!-- 请求体 -->
        <a-tab-pane key="body" tab="请求体" v-if="hasBody">
          <BodyEditor v-model:body="requestForm.body" />
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import ParamsTable from './ParamsTable.vue'
import AuthConfig from './AuthConfig.vue'
import BodyEditor from './BodyEditor.vue'
import { processEnvironmentVariables } from '@/utils/envUtils.js'
import { useRoute } from 'vue-router'

const route = useRoute()

const emit = defineEmits(['send-request'])

// 表单数据
const requestForm = ref({
  method: 'GET',
  url: '',
  queryParams: [{ key: '', value: '', enabled: true }],
  headers: [
    { key: 'Content-Type', value: 'application/json', enabled: true },
    { key: '', value: '', enabled: true }
  ],
  auth: {
    type: 'none',
    basic: { username: '', password: '' },
    bearer: { token: '' },
    oauth2: { accessToken: '' }
  },
  body: {
    type: 'raw',
    raw: '',
    formData: [{ key: '', value: '', enabled: true }],
    urlencoded: [{ key: '', value: '', enabled: true }]
  }
})

const activeTab = ref('query')
const loading = ref(false)

// URL显示状态（包含查询参数的完整URL）
const displayUrl = ref('')

// 是否正在更新URL（防止循环更新）
const isUpdatingUrl = ref(false)

// 解析URL中的查询参数
const parseUrlParams = (url) => {
  try {
    if (!url || !url.trim()) {
      return {
        baseUrl: '',
        params: [{ key: '', value: '', enabled: true }]
      }
    }

    const urlObj = new URL(url)
    const params = []

    // 解析查询参数
    urlObj.searchParams.forEach((value, key) => {
      params.push({ key, value, enabled: true })
    })

    // 如果没有参数，添加一个空行
    if (params.length === 0) {
      params.push({ key: '', value: '', enabled: true })
    }

    return {
      baseUrl: urlObj.origin + urlObj.pathname,
      params
    }
  } catch (error) {
    // 如果URL格式不正确，尝试手动解析
    const questionMarkIndex = url.indexOf('?')
    if (questionMarkIndex === -1) {
      return {
        baseUrl: url,
        params: [{ key: '', value: '', enabled: true }]
      }
    }

    const baseUrl = url.substring(0, questionMarkIndex)
    const queryString = url.substring(questionMarkIndex + 1)
    const params = []

    if (queryString) {
      const pairs = queryString.split('&')
      pairs.forEach(pair => {
        const equalIndex = pair.indexOf('=')
        if (equalIndex === -1) {
          params.push({ key: decodeURIComponent(pair), value: '', enabled: true })
        } else {
          const key = decodeURIComponent(pair.substring(0, equalIndex))
          const value = decodeURIComponent(pair.substring(equalIndex + 1))
          params.push({ key, value, enabled: true })
        }
      })
    }

    if (params.length === 0) {
      params.push({ key: '', value: '', enabled: true })
    }

    return { baseUrl, params }
  }
}



// 构建完整的URL（包含查询参数）- 用于显示，保持原始格式
const buildFullUrl = () => {
  // 对于显示，不处理环境变量，保持原始格式
  let baseUrl = requestForm.value.url
  if (!baseUrl || !baseUrl.trim()) {
    return ''
  }

  const enabledParams = requestForm.value.queryParams.filter(param =>
    param.enabled && param.key && param.key.trim()
  )

  if (enabledParams.length === 0) {
    return baseUrl
  }

  // 对于显示URL，不进行环境变量替换和编码，保持原始可读性
  const queryString = enabledParams
    .map(param => {
      const key = param.key.trim()
      // 保持原始参数值，不进行环境变量替换
      const value = param.value || ''
      return `${key}=${value}`
    })
    .join('&')

  return baseUrl + (baseUrl.includes('?') ? '&' : '?') + queryString
}

// 构建用于实际HTTP请求的URL（完全编码）
const buildRequestUrl = () => {
  // 先处理环境变量替换
  let baseUrl = processEnvironmentVariables(requestForm.value.url)
  if (!baseUrl || !baseUrl.trim()) {
    return ''
  }

  const enabledParams = requestForm.value.queryParams.filter(param =>
    param.enabled && param.key && param.key.trim()
  )

  if (enabledParams.length === 0) {
    return baseUrl
  }

  // 对于实际请求，完全编码所有参数
  const queryString = enabledParams
    .map(param => {
      // 对参数键和值都进行环境变量替换
      const processedKey = processEnvironmentVariables(param.key.trim())
      const processedValue = processEnvironmentVariables(param.value || '')
      return `${encodeURIComponent(processedKey)}=${encodeURIComponent(processedValue)}`
    })
    .join('&')

  return baseUrl + (baseUrl.includes('?') ? '&' : '?') + queryString
}

// 处理URL输入变化
const handleUrlChange = (e) => {
  if (isUpdatingUrl.value) return
  displayUrl.value = e.target.value
}

// 处理URL输入失焦
const handleUrlBlur = () => {
  if (isUpdatingUrl.value) return

  const url = displayUrl.value.trim()
  if (url) {
    isUpdatingUrl.value = true
    const { baseUrl, params } = parseUrlParams(url)
    requestForm.value.url = baseUrl
    requestForm.value.queryParams = params
    isUpdatingUrl.value = false
  } else {
    requestForm.value.url = ''
    requestForm.value.queryParams = [{ key: '', value: '', enabled: true }]
  }
}

// 更新显示URL
const updateDisplayUrl = () => {
  if (isUpdatingUrl.value) return
  isUpdatingUrl.value = true
  displayUrl.value = buildFullUrl()
  isUpdatingUrl.value = false
}

// Header预设选项
const headerPresets = [
  'Content-Type',
  'Authorization',
  'Accept',
  'User-Agent',
  'X-API-Key',
  'X-Requested-With'
]

// 是否显示请求体标签
const hasBody = computed(() => {
  return ['POST', 'PUT', 'PATCH'].includes(requestForm.value.method)
})

// 发送请求
const sendRequest = () => {
  if (!requestForm.value.url) {
    return
  }

  loading.value = true

  // 构建请求数据，使用正确编码的URL用于实际请求
  const requestData = {
    ...requestForm.value,
    // 使用buildRequestUrl来获取正确编码的URL用于实际HTTP请求
    requestUrl: buildRequestUrl(),
    timestamp: Date.now(),
    id: Date.now().toString()
  }

  // 保存到历史记录
  saveToHistory(requestData)

  emit('send-request', requestData)

  setTimeout(() => {
    loading.value = false
  }, 100)
}

// 保存到历史记录
const saveToHistory = (requestData) => {
  const history = JSON.parse(localStorage.getItem('api_request_history') || '[]')
  history.push(requestData)
  
  // 限制历史记录数量
  if (history.length > 100) {
    history.shift()
  }
  
  localStorage.setItem('api_request_history', JSON.stringify(history))
}

// 加载请求数据（从历史记录或其他来源）
const loadRequest = (requestData) => {
  isUpdatingUrl.value = true
  requestForm.value = {
    ...requestForm.value,
    ...requestData
  }
  // 更新显示URL
  updateDisplayUrl()
  isUpdatingUrl.value = false
}

// 检查是否有选中的请求需要加载
const checkSelectedRequest = () => {
  const selected = sessionStorage.getItem('selected_request')
  if (selected) {
    const requestData = JSON.parse(selected)
    loadRequest(requestData)
    sessionStorage.removeItem('selected_request')
  }
}

// 监听queryParams变化，同步更新URL显示
watch(() => requestForm.value.queryParams, () => {
  updateDisplayUrl()
}, { deep: true })

// 监听baseUrl变化，同步更新URL显示
watch(() => requestForm.value.url, () => {
  updateDisplayUrl()
})

// 初始化
onMounted(() => {
  checkSelectedRequest()
  updateDisplayUrl()
})

// 暴露方法给父组件
defineExpose({
  loadRequest
})
</script>

<style scoped>
.request-config {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-card {
  margin-bottom: 0;
}

.params-card {
  flex: 1;
}

.params-card :deep(.ant-card-body) {
  padding: 0;
}

.params-card :deep(.ant-tabs-content-holder) {
  padding: 16px;
}

.params-card :deep(.ant-tabs-tab) {
  padding: 8px 16px;
}

/* 深色主题样式 */
[data-theme="dark"] .config-card {
  background: #141414;
  border-color: #303030;
}

[data-theme="dark"] .params-card {
  background: #141414;
  border-color: #303030;
}

[data-theme="dark"] .params-card :deep(.ant-card-head) {
  background: #1f1f1f;
  border-color: #303030;
}

[data-theme="dark"] .params-card :deep(.ant-tabs-nav) {
  background: #1f1f1f;
}

[data-theme="dark"] .params-card :deep(.ant-tabs-tab) {
  color: #fff;
}

[data-theme="dark"] .params-card :deep(.ant-tabs-tab:hover) {
  color: #177ddc;
}

[data-theme="dark"] .params-card :deep(.ant-tabs-tab-active) {
  color: #177ddc;
}
</style>
