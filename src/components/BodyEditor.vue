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
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { FormatPainterOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import * as monaco from 'monaco-editor'
import ParamsTable from './ParamsTable.vue'
import FormDataTable from './FormDataTable.vue'

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

// 更新body字段
const updateBodyField = (field, value) => {
  const newBody = { ...props.body, [field]: value }
  emit('update:body', newBody)

  if (field === 'type') {
    if (value === 'raw') {
      nextTick(() => {
        initEditor()
      })
    } else {
      destroyEditor()
    }
  }
}

// 处理类型变更
const handleTypeChange = () => {
  updateBody()
  if (props.body.type === 'raw') {
    nextTick(() => {
      initEditor()
    })
  } else {
    destroyEditor()
  }
}

// 处理语言变更
const handleLanguageChange = () => {
  if (editor) {
    const model = editor.getModel()
    monaco.editor.setModelLanguage(model, rawLanguage.value)
  }
}

// 初始化Monaco编辑器
const initEditor = () => {
  if (!editorContainer.value || editor) return

  try {
    editor = monaco.editor.create(editorContainer.value, {
      value: props.body.raw || '',
      language: rawLanguage.value,
      theme: 'vs',
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: 'on',
      roundedSelection: false,
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto'
      },
      wordWrap: 'on',
      formatOnPaste: true,
      formatOnType: true,
      // 禁用一些可能导致Worker问题的功能
      quickSuggestions: false,
      parameterHints: { enabled: false },
      suggestOnTriggerCharacters: false,
      acceptSuggestionOnEnter: 'off',
      tabCompletion: 'off',
      wordBasedSuggestions: false,
      // 禁用语法检查相关功能
      validate: false,
      lint: {
        enable: false
      }
    })

    // 监听内容变化
    editor.onDidChangeModelContent(() => {
      const value = editor.getValue()
      props.body.raw = value
      updateBody()
    })
  } catch (error) {
    console.error('Failed to create Monaco editor:', error)
  }
}

// 销毁编辑器
const destroyEditor = () => {
  if (editor) {
    editor.dispose()
    editor = null
  }
}

// 格式化JSON
const formatJson = () => {
  if (!editor) return

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

// 监听body变化
watch(() => props.body.raw, (newValue) => {
  if (editor && editor.getValue() !== newValue) {
    editor.setValue(newValue || '')
  }
})

onMounted(() => {
  if (props.body.type === 'raw') {
    nextTick(() => {
      initEditor()
    })
  }
})

onUnmounted(() => {
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
