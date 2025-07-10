<template>
  <div class="form-data-table">
    <a-table 
      :columns="columns" 
      :data-source="params" 
      :pagination="false"
      size="small"
      class="params-table"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'enabled'">
          <a-checkbox 
            :checked="record.enabled" 
            @change="(e) => updateParam(index, 'enabled', e.target.checked)"
          />
        </template>
        
        <template v-else-if="column.key === 'key'">
          <a-auto-complete
            :value="record.key"
            :options="keyOptions"
            :placeholder="placeholderKey"
            :filter-option="filterOption"
            :dropdown-match-select-width="false"
            class="key-input"
            @change="(value) => updateParam(index, 'key', value)"
            @blur="addNewRowIfNeeded"
            @select="(value) => updateParam(index, 'key', value)"
          >
            <template #option="{ value, label }">
              <div class="key-option">
                <span class="key-name">{{ label || value }}</span>
                <span v-if="getKeyDescription(value)" class="key-desc">{{ getKeyDescription(value) }}</span>
              </div>
            </template>
          </a-auto-complete>
        </template>
        
        <template v-else-if="column.key === 'type'">
          <a-select 
            :value="record.type || 'text'" 
            @change="(value) => updateParam(index, 'type', value)"
            style="width: 100%"
          >
            <a-select-option value="text">Text</a-select-option>
            <a-select-option value="file">File</a-select-option>
          </a-select>
        </template>
        
        <template v-else-if="column.key === 'value'">
          <!-- 文件类型 -->
          <div v-if="record.type === 'file'" class="file-input-container">
            <a-upload
              :file-list="record.files || []"
              :before-upload="() => false"
              @change="(info) => handleFileChange(index, info)"
              :multiple="false"
              :show-upload-list="{ showRemoveIcon: true }"
            >
              <a-button size="small">
                <template #icon><UploadOutlined /></template>
                选择文件
              </a-button>
            </a-upload>
          </div>
          
          <!-- 文本类型 -->
          <a-input 
            v-else
            :value="record.value" 
            :placeholder="placeholderValue"
            @change="(e) => updateParam(index, 'value', e.target.value)"
            @blur="addNewRowIfNeeded"
          />
        </template>
        
        <template v-else-if="column.key === 'description'">
          <a-input 
            :value="record.description" 
            placeholder="描述"
            @change="(e) => updateParam(index, 'description', e.target.value)"
          />
        </template>
        
        <template v-else-if="column.key === 'actions'">
          <a-button 
            type="text" 
            danger 
            size="small"
            @click="removeParam(index)"
            :disabled="params.length <= 1"
          >
            <template #icon><DeleteOutlined /></template>
          </a-button>
        </template>
      </template>
    </a-table>
    
    <a-button 
      type="dashed" 
      block 
      @click="addParam"
      class="add-button"
    >
      <template #icon><PlusOutlined /></template>
      添加参数
    </a-button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons-vue'

const props = defineProps({
  params: {
    type: Array,
    default: () => [{ key: '', value: '', type: 'text', enabled: true, description: '' }]
  },
  placeholderKey: {
    type: String,
    default: '参数名'
  },
  placeholderValue: {
    type: String,
    default: '参数值'
  }
})

const emit = defineEmits(['update:params'])

// 表格列定义
const columns = [
  { title: '', key: 'enabled', width: 50 },
  { title: '参数名', key: 'key', width: '25%' },
  { title: '类型', key: 'type', width: '15%' },
  { title: '值', key: 'value', width: '35%' },
  { title: '描述', key: 'description', width: '20%' },
  { title: '', key: 'actions', width: 50 }
]

// 键的自动完成选项
const keyOptions = computed(() => {
  const commonKeys = [
    'file', 'image', 'document', 'data', 'content',
    'name', 'title', 'description', 'category', 'type'
  ]
  return commonKeys.map(option => ({ 
    value: option, 
    label: option 
  }))
})

// 键的描述信息
const keyDescriptions = {
  'file': '文件字段',
  'image': '图片文件',
  'document': '文档文件',
  'data': '数据字段',
  'content': '内容字段'
}

// 获取键的描述
const getKeyDescription = (key) => {
  return keyDescriptions[key] || ''
}

// 过滤选项
const filterOption = (input, option) => {
  const inputLower = input.toLowerCase()
  const valueLower = option.value.toLowerCase()
  const labelLower = (option.label || '').toLowerCase()
  const descLower = (getKeyDescription(option.value) || '').toLowerCase()
  
  return valueLower.includes(inputLower) || 
         labelLower.includes(inputLower) || 
         descLower.includes(inputLower)
}

// 更新参数
const updateParam = (index, field, value) => {
  const newParams = [...props.params]
  newParams[index] = { ...newParams[index], [field]: value }
  
  // 如果类型改为file，清空value并初始化files数组
  if (field === 'type' && value === 'file') {
    newParams[index].value = ''
    newParams[index].files = []
  }
  // 如果类型改为text，清空files数组
  else if (field === 'type' && value === 'text') {
    newParams[index].files = []
  }
  
  emit('update:params', newParams)
}

// 处理文件变化
const handleFileChange = (index, info) => {
  const newParams = [...props.params]
  newParams[index] = { 
    ...newParams[index], 
    files: info.fileList,
    value: info.fileList.map(file => file.name).join(', ')
  }
  emit('update:params', newParams)
}

// 添加参数
const addParam = () => {
  const newParams = [...props.params, { 
    key: '', 
    value: '', 
    type: 'text', 
    enabled: true, 
    description: '',
    files: []
  }]
  emit('update:params', newParams)
}

// 删除参数
const removeParam = (index) => {
  if (props.params.length > 1) {
    const newParams = props.params.filter((_, i) => i !== index)
    emit('update:params', newParams)
  }
}

// 添加新行（如果需要）
const addNewRowIfNeeded = () => {
  const lastParam = props.params[props.params.length - 1]
  if (lastParam && (lastParam.key || lastParam.value)) {
    addParam()
  }
}
</script>

<style scoped>
.form-data-table {
  width: 100%;
}

.add-button {
  margin-top: 8px;
}

.file-input-container {
  width: 100%;
}

/* 键输入框样式 */
.key-input {
  width: 100%;
}

.key-option {
  display: flex;
  flex-direction: column;
  padding: 4px 0;
}

.key-name {
  font-weight: 500;
  color: #262626;
  font-size: 14px;
}

.key-desc {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 2px;
  line-height: 1.2;
}

:deep(.ant-table-tbody > tr > td) {
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 500;
}

:deep(.ant-input) {
  border: none;
  box-shadow: none;
  transition: all 0.2s ease;
}

:deep(.ant-input:hover) {
  border: 1px solid #d9d9d9;
}

:deep(.ant-input:focus) {
  border: 1px solid #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

:deep(.ant-select) {
  width: 100%;
}

:deep(.ant-select .ant-select-selector) {
  border: none;
  box-shadow: none;
  transition: all 0.2s ease;
}

:deep(.ant-select:hover .ant-select-selector) {
  border: 1px solid #d9d9d9;
}

:deep(.ant-select.ant-select-focused .ant-select-selector) {
  border: 1px solid #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

:deep(.ant-upload) {
  width: 100%;
}

:deep(.ant-upload-list) {
  margin-top: 4px;
}

/* 深色主题适配 */
[data-theme="dark"] .key-name {
  color: #f0f0f0;
}

[data-theme="dark"] .key-desc {
  color: #a6a6a6;
}

[data-theme="dark"] :deep(.ant-input:hover) {
  border: 1px solid #434343;
}

[data-theme="dark"] :deep(.ant-select:hover .ant-select-selector) {
  border: 1px solid #434343;
}
</style>
