<template>
  <div class="monaco-error-boundary">
    <!-- 正常状态：渲染子组件 -->
    <template v-if="!hasError">
      <slot />
    </template>
    
    <!-- 错误状态：显示降级UI -->
    <div v-else class="error-fallback">
      <div class="error-icon">
        <ExclamationCircleOutlined style="font-size: 48px; color: #ff4d4f" />
      </div>
      
      <div class="error-content">
        <h3>编辑器加载失败</h3>
        <p class="error-message">{{ errorMessage }}</p>
        
        <div class="error-actions">
          <a-button type="primary" @click="retryLoad">
            <template #icon><ReloadOutlined /></template>
            重新加载
          </a-button>
          
          <a-button @click="useFallback" style="margin-left: 8px">
            <template #icon><EditOutlined /></template>
            使用简单编辑器
          </a-button>
        </div>
        
        <a-collapse v-if="showErrorDetails" ghost style="margin-top: 16px">
          <a-collapse-panel key="1" header="错误详情">
            <pre class="error-details">{{ errorDetails }}</pre>
          </a-collapse-panel>
        </a-collapse>
        
        <a-button 
          type="link" 
          size="small" 
          @click="showErrorDetails = !showErrorDetails"
          style="margin-top: 8px"
        >
          {{ showErrorDetails ? '隐藏' : '显示' }}错误详情
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onErrorCaptured, onMounted, onUnmounted } from 'vue'
import { 
  ExclamationCircleOutlined, 
  ReloadOutlined, 
  EditOutlined 
} from '@ant-design/icons-vue'

const props = defineProps({
  // 最大重试次数
  maxRetries: {
    type: Number,
    default: 3
  },
  // 是否显示降级选项
  showFallback: {
    type: Boolean,
    default: true
  },
  // 自定义错误消息
  customErrorMessage: {
    type: String,
    default: ''
  }
})

const emit = defineEmits([
  'error',
  'retry',
  'fallback'
])

const hasError = ref(false)
const errorMessage = ref('')
const errorDetails = ref('')
const showErrorDetails = ref(false)
const retryCount = ref(0)

// 捕获子组件错误
onErrorCaptured((error, instance, info) => {
  console.error('Monaco Editor Error Boundary caught error:', error, info)
  
  handleError(error, info)
  
  // 阻止错误继续向上传播
  return false
})

// 处理错误
const handleError = (error, info = '') => {
  hasError.value = true
  
  // 设置用户友好的错误消息
  if (props.customErrorMessage) {
    errorMessage.value = props.customErrorMessage
  } else if (error.message?.includes('Monaco')) {
    errorMessage.value = 'Monaco编辑器初始化失败，可能是由于网络问题或浏览器兼容性问题。'
  } else if (error.message?.includes('Worker')) {
    errorMessage.value = '编辑器Web Worker加载失败，将回退到基本模式。'
  } else {
    errorMessage.value = '编辑器遇到未知错误，请尝试刷新页面或使用简单编辑器。'
  }
  
  // 设置详细错误信息
  errorDetails.value = [
    `错误: ${error.message || '未知错误'}`,
    `堆栈: ${error.stack || '无堆栈信息'}`,
    `组件信息: ${info || '无组件信息'}`,
    `时间: ${new Date().toISOString()}`,
    `用户代理: ${navigator.userAgent}`,
    `重试次数: ${retryCount.value}/${props.maxRetries}`
  ].join('\n\n')
  
  // 触发错误事件
  emit('error', {
    error,
    info,
    retryCount: retryCount.value
  })
}

// 重试加载
const retryLoad = () => {
  if (retryCount.value >= props.maxRetries) {
    errorMessage.value = `已达到最大重试次数 (${props.maxRetries})，请尝试使用简单编辑器或刷新页面。`
    return
  }
  
  retryCount.value++
  hasError.value = false
  errorMessage.value = ''
  errorDetails.value = ''
  showErrorDetails.value = false
  
  emit('retry', retryCount.value)
}

// 使用降级方案
const useFallback = () => {
  emit('fallback')
}

// 重置错误状态
const reset = () => {
  hasError.value = false
  errorMessage.value = ''
  errorDetails.value = ''
  showErrorDetails.value = false
  retryCount.value = 0
}

// 全局错误处理
const handleGlobalError = (event) => {
  const error = event.error || new Error(event.message || 'Unknown error')
  
  // 只处理与Monaco相关的错误
  if (error.message?.includes('Monaco') || 
      error.message?.includes('monaco') ||
      event.filename?.includes('monaco')) {
    handleError(error, 'Global error handler')
    event.preventDefault()
  }
}

onMounted(() => {
  // 监听全局错误
  window.addEventListener('error', handleGlobalError)
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error ? event.reason : new Error(event.reason)
    handleGlobalError({ error })
  })
})

onUnmounted(() => {
  // 清理全局错误监听器
  window.removeEventListener('error', handleGlobalError)
})

// 暴露方法给父组件
defineExpose({
  reset,
  hasError,
  retryCount
})
</script>

<style scoped>
.monaco-error-boundary {
  width: 100%;
  height: 100%;
}

.error-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  height: 100%;
  min-height: 300px;
}

.error-icon {
  margin-bottom: 24px;
}

.error-content {
  max-width: 500px;
}

.error-content h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #262626;
}

.error-message {
  color: #8c8c8c;
  margin-bottom: 24px;
  line-height: 1.6;
}

.error-actions {
  margin-bottom: 16px;
}

.error-details {
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow: auto;
  text-align: left;
}

/* 深色主题样式 */
[data-theme="dark"] .error-content h3 {
  color: #fff;
}

[data-theme="dark"] .error-message {
  color: #8c8c8c;
}

[data-theme="dark"] .error-details {
  background: #1f1f1f;
  border-color: #434343;
  color: #fff;
}
</style>