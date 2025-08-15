<template>
  <div class="body-editor">
    <div class="body-type-selector">
      <a-radio-group :value="body.type" @change="(e) => updateBodyField('type', e.target.value)">
        <a-radio-button value="raw">Raw</a-radio-button>
        <a-radio-button value="form-data">Form Data</a-radio-button>
        <a-radio-button value="x-www-form-urlencoded">URL Encoded</a-radio-button>
      </a-radio-group>

      <!-- Raw类型的语言选择 -->
      <a-select
        v-if="body.type === 'raw'"
        :value="rawLanguage"
        style="width: 120px; margin-left: 16px"
        @change="handleLanguageChange"
      >
        <a-select-option value="json">JSON</a-select-option>
        <a-select-option value="xml">XML</a-select-option>
        <a-select-option value="html">HTML</a-select-option>
        <a-select-option value="text">Text</a-select-option>
      </a-select>
      
      <!-- 格式化按钮 -->
      <a-button 
        v-if="body.type === 'raw' && rawLanguage === 'json'"
        type="text"
        @click="formatJson"
        style="margin-left: 8px"
      >
        <template #icon><FormatPainterOutlined /></template>
        格式化
      </a-button>
    </div>

    <!-- Raw编辑器 -->
    <div v-if="body.type === 'raw'" class="raw-editor">
      <div ref="editorContainer" class="monaco-editor-container"></div>
    </div>

    <!-- Form Data -->
    <div v-else-if="body.type === 'form-data'" class="form-data">
      <FormDataTable
        :params="body.formData"
        placeholder-key="字段名"
        placeholder-value="字段值"
        @update:params="(params) => updateBodyField('formData', params)"
      />
    </div>

    <!-- URL Encoded -->
    <div v-else-if="body.type === 'x-www-form-urlencoded'" class="url-encoded">
      <ParamsTable
        :params="body.urlencoded"
        placeholder-key="参数名"
        placeholder-value="参数值"
        @update:params="(params) => updateBodyField('urlencoded', params)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, inject } from 'vue'
import { FormatPainterOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import * as monaco from 'monaco-editor'
import ParamsTable from './ParamsTable.vue'
import FormDataTable from './FormDataTable.vue'
import { 
  initializeMonaco, 
  getDefaultEditorOptions, 
  getThemeForMode 
} from '@/utils/monaco-config'

const props = defineProps({
  body: {
    type: Object,
    default: () => ({
      type: 'raw',
      raw: '',
      formData: [{ key: '', value: '', type: 'text', enabled: true, description: '', files: [] }],
      urlencoded: [{ key: '', value: '', enabled: true }]
    })
  }
})

const emit = defineEmits(['update:body'])

const editorContainer = ref(null)
const rawLanguage = ref('json')
let editor = null
let editorInitPromise = null
const isDestroyed = ref(false)

// 尝试注入主题状态，如果没有则使用默认值
const isDarkTheme = inject('isDarkTheme', ref(false))

// 更新body字段
const updateBodyField = async (field, value) => {
  const newBody = { ...props.body, [field]: value }
  emit('update:body', newBody)

  if (field === 'type') {
    if (value === 'raw' && !isDestroyed.value) {
      try {
        await nextTick()
        await initEditor()
      } catch (error) {
        console.error('Failed to initialize editor on type change:', error)
      }
    } else {
      destroyEditor()
    }
  }
}

// 处理类型变更（已移除，逻辑合并到updateBodyField中）

// 处理语言变更
const handleLanguageChange = (newLanguage) => {
  rawLanguage.value = newLanguage
  if (editor && !isDestroyed.value) {
    try {
      const model = editor.getModel()
      monaco.editor.setModelLanguage(model, newLanguage)
    } catch (error) {
      console.warn('Failed to change editor language:', error)
    }
  }
}

// 检查编辑器容器是否准备就绪
const isEditorContainerReady = () => {
  if (!editorContainer.value) return false
  
  const rect = editorContainer.value.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
}

// 初始化Monaco编辑器
const initEditor = async () => {
  if (isDestroyed.value || editor || !editorContainer.value) {
    return
  }

  // 防止重复初始化
  if (editorInitPromise) {
    return editorInitPromise
  }

  editorInitPromise = new Promise(async (resolve, reject) => {
    try {
      // 确保Monaco环境已初始化
      initializeMonaco()

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

      if (isDestroyed.value) {
        resolve()
        return
      }

      const theme = getThemeForMode(isDarkTheme.value)
      
      // 获取默认编辑器配置
      const editorOptions = {
        ...getDefaultEditorOptions(),
        value: props.body.raw || '',
        language: rawLanguage.value,
        theme
      }

      editor = monaco.editor.create(editorContainer.value, editorOptions)

      // 监听内容变化
      editor.onDidChangeModelContent(() => {
        if (isDestroyed.value) return
        
        try {
          const value = editor.getValue()
          if (props.body.raw !== value) {
            props.body.raw = value
            updateBody()
          }
        } catch (error) {
          console.warn('Error handling content change:', error)
        }
      })

      // 确保编辑器布局正确
      setTimeout(() => {
        if (editor && !isDestroyed.value) {
          editor.layout()
        }
      }, 100)

      resolve()
    } catch (error) {
      console.error('Failed to create Monaco editor:', error)
      reject(error)
    } finally {
      editorInitPromise = null
    }
  })

  return editorInitPromise
}

// 安全销毁编辑器
const destroyEditor = () => {
  if (editor) {
    try {
      editor.dispose()
    } catch (error) {
      console.warn('Error disposing Monaco editor:', error)
    } finally {
      editor = null
    }
  }
  
  // 清理初始化Promise
  if (editorInitPromise) {
    editorInitPromise = null
  }
}

// 格式化JSON
const formatJson = () => {
  if (!editor || isDestroyed.value) return

  try {
    const value = editor.getValue()
    if (!value.trim()) return

    const parsed = JSON.parse(value)
    const formatted = JSON.stringify(parsed, null, 2)
    editor.setValue(formatted)
    message.success('JSON格式化成功')
  } catch (error) {
    message.error('JSON格式错误，无法格式化')
  }
}

// 更新body数据
const updateBody = () => {
  emit('update:body', props.body)
}

// 监听body内容变化
watch(() => props.body.raw, (newValue) => {
  if (editor && !isDestroyed.value && editor.getValue() !== newValue) {
    try {
      editor.setValue(newValue || '')
    } catch (error) {
      console.warn('Failed to update editor value:', error)
    }
  }
})

// 监听主题变化
watch(
  isDarkTheme,
  (isDark) => {
    if (editor && !isDestroyed.value) {
      try {
        const theme = getThemeForMode(isDark)
        monaco.editor.setTheme(theme)
      } catch (error) {
        console.warn('Failed to update Monaco theme:', error)
      }
    }
  }
)

onMounted(async () => {
  isDestroyed.value = false
  
  if (props.body.type === 'raw') {
    try {
      await nextTick()
      await initEditor()
    } catch (error) {
      console.error('Failed to initialize editor on mount:', error)
    }
  }
})

onUnmounted(() => {
  isDestroyed.value = true
  destroyEditor()
})
</script>

<style scoped>
.body-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.body-type-selector {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.raw-editor {
  flex: 1;
  min-height: 300px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
}

.monaco-editor-container {
  height: 100%;
  min-height: 300px;
}

.form-data,
.url-encoded {
  flex: 1;
}

:deep(.ant-radio-button-wrapper) {
  border-radius: 6px;
}

:deep(.ant-radio-button-wrapper:first-child) {
  border-radius: 6px 0 0 6px;
}

:deep(.ant-radio-button-wrapper:last-child) {
  border-radius: 0 6px 6px 0;
}

/* 深色主题样式 */
[data-theme="dark"] .body-type-selector {
  border-bottom: 1px solid #303030;
}

[data-theme="dark"] .raw-editor {
  border-color: #434343;
}
</style>
