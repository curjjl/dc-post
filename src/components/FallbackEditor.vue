<template>
  <div class="fallback-editor">
    <div class="editor-header" v-if="showHeader">
      <div class="editor-info">
        <InfoCircleOutlined style="color: #1890ff; margin-right: 4px" />
        <span>简单编辑器模式</span>
      </div>
      <div class="editor-actions">
        <a-button 
          v-if="language === 'json' && showFormatButton" 
          type="text" 
          size="small"
          @click="formatJson"
        >
          <template #icon><FormatPainterOutlined /></template>
          格式化
        </a-button>
        <a-button 
          type="text" 
          size="small"
          @click="copyContent"
        >
          <template #icon><CopyOutlined /></template>
          复制
        </a-button>
      </div>
    </div>
    
    <textarea
      ref="textareaRef"
      v-model="internalValue"
      :placeholder="placeholder"
      :readonly="readonly"
      :disabled="disabled"
      class="fallback-textarea"
      :style="{ 
        height: height,
        fontSize: fontSize + 'px'
      }"
      @input="handleInput"
      @change="handleChange"
      @focus="handleFocus"
      @blur="handleBlur"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { 
  InfoCircleOutlined,
  FormatPainterOutlined, 
  CopyOutlined 
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

const props = defineProps({
  // 编辑器值
  value: {
    type: String,
    default: ''
  },
  // 占位符
  placeholder: {
    type: String,
    default: '在此输入内容...'
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
  // 语言类型
  language: {
    type: String,
    default: 'text'
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
  // 是否显示头部
  showHeader: {
    type: Boolean,
    default: true
  },
  // 是否显示格式化按钮
  showFormatButton: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits([
  'update:value',
  'change',
  'focus',
  'blur'
])

const textareaRef = ref(null)
const internalValue = ref(props.value)

// 监听外部值变化
watch(() => props.value, (newValue) => {
  if (newValue !== internalValue.value) {
    internalValue.value = newValue
  }
})

// 监听内部值变化
watch(internalValue, (newValue) => {
  emit('update:value', newValue)
})

// 处理输入
const handleInput = (event) => {
  internalValue.value = event.target.value
}

// 处理变化
const handleChange = (event) => {
  emit('change', event.target.value)
}

// 处理焦点
const handleFocus = (event) => {
  emit('focus', event)
}

// 处理失去焦点
const handleBlur = (event) => {
  emit('blur', event)
}

// 格式化JSON
const formatJson = () => {
  try {
    const value = internalValue.value
    if (!value.trim()) return
    
    const parsed = JSON.parse(value)
    const formatted = JSON.stringify(parsed, null, 2)
    internalValue.value = formatted
    message.success('JSON格式化成功')
  } catch (error) {
    message.error('JSON格式错误，无法格式化')
  }
}

// 复制内容
const copyContent = async () => {
  try {
    await navigator.clipboard.writeText(internalValue.value)
    message.success('内容已复制到剪贴板')
  } catch (error) {
    // 降级方案：使用document.execCommand
    try {
      textareaRef.value.select()
      document.execCommand('copy')
      message.success('内容已复制到剪贴板')
    } catch (fallbackError) {
      message.error('复制失败')
    }
  }
}

// 设置光标位置
const setCursorPosition = (position) => {
  if (textareaRef.value) {
    textareaRef.value.selectionStart = position
    textareaRef.value.selectionEnd = position
    textareaRef.value.focus()
  }
}

// 插入文本
const insertText = (text, position) => {
  const textarea = textareaRef.value
  if (!textarea) return
  
  const currentValue = internalValue.value
  const actualPosition = position !== undefined ? position : textarea.selectionStart
  
  const newValue = 
    currentValue.slice(0, actualPosition) + 
    text + 
    currentValue.slice(actualPosition)
  
  internalValue.value = newValue
  
  // 设置光标位置到插入文本后
  nextTick(() => {
    setCursorPosition(actualPosition + text.length)
  })
}

// 获取选中文本
const getSelectedText = () => {
  const textarea = textareaRef.value
  if (!textarea) return ''
  
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  return internalValue.value.slice(start, end)
}

// 替换选中文本
const replaceSelectedText = (text) => {
  const textarea = textareaRef.value
  if (!textarea) return
  
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const currentValue = internalValue.value
  
  const newValue = 
    currentValue.slice(0, start) + 
    text + 
    currentValue.slice(end)
  
  internalValue.value = newValue
  
  // 设置光标位置
  nextTick(() => {
    setCursorPosition(start + text.length)
  })
}

onMounted(() => {
  // 如果是只读模式，添加特殊样式
  if (props.readonly) {
    textareaRef.value?.setAttribute('data-readonly', 'true')
  }
})

// 暴露方法给父组件
defineExpose({
  focus: () => textareaRef.value?.focus(),
  blur: () => textareaRef.value?.blur(),
  setCursorPosition,
  insertText,
  getSelectedText,
  replaceSelectedText,
  formatJson,
  copyContent
})
</script>

<style scoped>
.fallback-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.editor-info {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #666;
}

.editor-actions {
  display: flex;
  gap: 4px;
}

.fallback-textarea {
  flex: 1;
  padding: 12px;
  border: none;
  outline: none;
  resize: none;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  line-height: 1.5;
  background: #fff;
  color: #262626;
  font-size: 14px;
}

.fallback-textarea:focus {
  box-shadow: none;
}

.fallback-textarea[readonly] {
  background: #f5f5f5;
  color: #666;
  cursor: default;
}

.fallback-textarea[disabled] {
  background: #f5f5f5;
  color: #bfbfbf;
  cursor: not-allowed;
}

/* 深色主题样式 */
[data-theme="dark"] .fallback-editor {
  border-color: #434343;
}

[data-theme="dark"] .editor-header {
  background: #1f1f1f;
  border-bottom-color: #303030;
}

[data-theme="dark"] .editor-info {
  color: #8c8c8c;
}

[data-theme="dark"] .fallback-textarea {
  background: #141414;
  color: #fff;
}

[data-theme="dark"] .fallback-textarea[readonly] {
  background: #1f1f1f;
  color: #8c8c8c;
}

[data-theme="dark"] .fallback-textarea[disabled] {
  background: #1f1f1f;
  color: #434343;
}

/* 滚动条样式 */
.fallback-textarea::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.fallback-textarea::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 4px;
}

.fallback-textarea::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 4px;
}

.fallback-textarea::-webkit-scrollbar-thumb:hover {
  background: #bfbfbf;
}

[data-theme="dark"] .fallback-textarea::-webkit-scrollbar-track {
  background: #1f1f1f;
}

[data-theme="dark"] .fallback-textarea::-webkit-scrollbar-thumb {
  background: #434343;
}

[data-theme="dark"] .fallback-textarea::-webkit-scrollbar-thumb:hover {
  background: #595959;
}
</style>