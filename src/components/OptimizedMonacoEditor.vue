<template>
  <MonacoErrorBoundary
    :max-retries="maxRetries"
    :show-fallback="true"
    :custom-error-message="customErrorMessage"
    @error="handleError"
    @retry="handleRetry"
    @fallback="handleFallback"
    ref="errorBoundaryRef"
  >
    <div class="optimized-monaco-editor">
      <!-- Monaco Editor 容器 -->
      <div 
        v-if="!useFallback"
        ref="editorContainer" 
        class="monaco-editor-container"
        :style="{ height }"
      />
      
      <!-- 降级编辑器 -->
      <FallbackEditor
        v-else
        v-model:value="internalValue"
        :language="language"
        :readonly="readonly"
        :disabled="disabled"
        :height="height"
        :fontSize="fontSize"
        :placeholder="placeholder"
        :show-header="showFallbackHeader"
        @change="handleValueChange"
        @focus="handleFocus"
        @blur="handleBlur"
      />
    </div>
  </MonacoErrorBoundary>
</template>

<script setup>
import { 
  ref, 
  onMounted, 
  onUnmounted, 
  watch, 
  nextTick, 
  inject 
} from 'vue'
import { message } from 'ant-design-vue'
import * as monaco from 'monaco-editor'
import MonacoErrorBoundary from './MonacoErrorBoundary.vue'
import FallbackEditor from './FallbackEditor.vue'
import { 
  initializeMonaco,
  getDefaultEditorOptions,
  getReadonlyEditorOptions,
  detectLanguage,
  getThemeForMode,
  createManagedEditor,
  disposeManagedEditor
} from '@/utils/monaco-config'

const props = defineProps({
  // 编辑器值
  value: {
    type: String,
    default: ''
  },
  // 语言类型
  language: {
    type: String,
    default: 'json'
  },
  // 是否只读
  readonly: {
    type: Boolean,
    default: false
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  // 编辑器高度
  height: {
    type: String,
    default: '300px'
  },
  // 字体大小
  fontSize: {
    type: Number,
    default: 14
  },
  // 占位符
  placeholder: {
    type: String,
    default: '在此输入内容...'
  },
  // 最大重试次数
  maxRetries: {
    type: Number,
    default: 3
  },
  // 自定义错误消息
  customErrorMessage: {
    type: String,
    default: ''
  },
  // 是否显示降级编辑器头部
  showFallbackHeader: {
    type: Boolean,
    default: true
  },
  // 编辑器配置选项
  options: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits([
  'update:value',
  'change',
  'focus',
  'blur',
  'ready',
  'error',
  'fallback'
])

// 组件状态
const editorContainer = ref(null)
const errorBoundaryRef = ref(null)
const internalValue = ref(props.value)
const useFallback = ref(false)
const isDestroyed = ref(false)

// Monaco Editor 相关
let editor = null
let editorId = null

// 注入主题状态
const isDarkTheme = inject('isDarkTheme', ref(false))

// 检查编辑器容器是否准备就绪
const isEditorContainerReady = () => {
  if (!editorContainer.value) return false
  
  const rect = editorContainer.value.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
}

// 初始化Monaco编辑器
const initEditor = async () => {
  if (isDestroyed.value || editor || useFallback.value || !editorContainer.value) {
    return
  }

  try {
    // 等待容器准备就绪
    const maxRetries = 20
    let retries = 0
    
    while (!isEditorContainerReady() && retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 50))
      retries++
    }

    if (!isEditorContainerReady()) {
      throw new Error('Editor container not ready after retries')
    }

    if (isDestroyed.value) return

    // 准备编辑器选项
    const baseOptions = props.readonly ? 
      getReadonlyEditorOptions() : 
      getDefaultEditorOptions()
    
    const editorOptions = {
      ...baseOptions,
      ...props.options,
      value: internalValue.value,
      language: props.language,
      theme: getThemeForMode(isDarkTheme.value),
      fontSize: props.fontSize,
      readOnly: props.readonly,
      placeholder: props.placeholder
    }

    // 使用资源管理器创建编辑器
    const result = await createManagedEditor(
      editorContainer.value, 
      editorOptions
    )
    
    editor = result.editor
    editorId = result.editorId

    // 监听内容变化
    if (!props.readonly) {
      editor.onDidChangeModelContent(() => {
        if (isDestroyed.value) return
        
        try {
          const value = editor.getValue()
          if (internalValue.value !== value) {
            internalValue.value = value
            emit('update:value', value)
            emit('change', value)
          }
        } catch (error) {
          console.warn('Error handling content change:', error)
        }
      })
    }

    // 监听焦点事件
    editor.onDidFocusEditorText(() => {
      emit('focus')
    })

    editor.onDidBlurEditorText(() => {
      emit('blur')
    })

    // 确保编辑器布局正确
    setTimeout(() => {
      if (editor && !isDestroyed.value) {
        editor.layout()
      }
    }, 100)

    emit('ready', editor)

  } catch (error) {
    console.error('Failed to initialize Monaco editor:', error)
    throw error
  }
}

// 销毁编辑器
const destroyEditor = () => {
  if (editorId) {
    disposeManagedEditor(editorId)
    editor = null
    editorId = null
  }
}

// 处理值变化
const handleValueChange = (value) => {
  internalValue.value = value
  emit('update:value', value)
  emit('change', value)
}

// 处理焦点事件
const handleFocus = () => {
  emit('focus')
}

// 处理失去焦点事件
const handleBlur = () => {
  emit('blur')
}

// 处理错误
const handleError = (errorInfo) => {
  console.error('Monaco Editor Error:', errorInfo)
  emit('error', errorInfo)
}

// 处理重试
const handleRetry = (retryCount) => {
  console.log(`Retrying Monaco Editor initialization (${retryCount})`)
  
  // 清理现有编辑器
  destroyEditor()
  
  // 重新初始化
  setTimeout(() => {
    initEditor().catch(error => {
      console.error('Retry failed:', error)
    })
  }, 100)
}

// 处理降级
const handleFallback = () => {
  console.log('Switching to fallback editor')
  useFallback.value = true
  destroyEditor()
  emit('fallback')
  message.info('已切换到简单编辑器模式')
}

// 监听外部值变化
watch(() => props.value, (newValue) => {
  if (newValue !== internalValue.value) {
    internalValue.value = newValue
    
    if (editor && !isDestroyed.value && !useFallback.value) {
      try {
        const currentValue = editor.getValue()
        if (newValue !== currentValue) {
          editor.setValue(newValue || '')
        }
      } catch (error) {
        console.warn('Failed to update editor value:', error)
      }
    }
  }
})

// 监听语言变化
watch(() => props.language, (newLanguage) => {
  if (editor && !isDestroyed.value && !useFallback.value) {
    try {
      const model = editor.getModel()
      monaco.editor.setModelLanguage(model, newLanguage)
    } catch (error) {
      console.warn('Failed to change editor language:', error)
    }
  }
})

// 监听主题变化
watch(isDarkTheme, (isDark) => {
  if (editor && !isDestroyed.value && !useFallback.value) {
    try {
      const theme = getThemeForMode(isDark)
      monaco.editor.setTheme(theme)
    } catch (error) {
      console.warn('Failed to update Monaco theme:', error)
    }
  }
})

// 组件方法
const focus = () => {
  if (editor && !useFallback.value) {
    editor.focus()
  }
}

const blur = () => {
  if (editor && !useFallback.value) {
    editor.getDomNode()?.blur()
  }
}

const layout = () => {
  if (editor && !useFallback.value) {
    try {
      editor.layout()
    } catch (error) {
      console.warn('Failed to layout editor:', error)
    }
  }
}

const resetErrorState = () => {
  if (errorBoundaryRef.value) {
    errorBoundaryRef.value.reset()
  }
  useFallback.value = false
}

onMounted(async () => {
  isDestroyed.value = false
  
  try {
    await nextTick()
    await initEditor()
  } catch (error) {
    console.error('Failed to initialize editor on mount:', error)
  }
})

onUnmounted(() => {
  isDestroyed.value = true
  destroyEditor()
})

// 暴露方法给父组件
defineExpose({
  focus,
  blur,
  layout,
  resetErrorState,
  getEditor: () => editor,
  isUsingFallback: () => useFallback.value
})
</script>

<style scoped>
.optimized-monaco-editor {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.monaco-editor-container {
  flex: 1;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
}

/* 深色主题样式 */
[data-theme="dark"] .monaco-editor-container {
  border-color: #434343;
}
</style>