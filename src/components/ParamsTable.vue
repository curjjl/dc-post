<template>
  <div class="params-table">
    <a-table 
      :columns="columns" 
      :data-source="params" 
      :pagination="false"
      size="small"
      :scroll="{ y: 300 }"
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

        <template v-else-if="column.key === 'value'">
          <a-input
            :value="record.value"
            :placeholder="placeholderValue"
            @change="(e) => updateParam(index, 'value', e.target.value)"
            @blur="addNewRowIfNeeded"
          />
        </template>
        
        <template v-else-if="column.key === 'actions'">
          <a-button 
            type="text" 
            size="small" 
            danger
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
      class="add-button"
      @click="addParam"
    >
      <template #icon><PlusOutlined /></template>
      添加参数
    </a-button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons-vue'

const props = defineProps({
  params: {
    type: Array,
    default: () => [{ key: '', value: '', enabled: true }]
  },
  placeholderKey: {
    type: String,
    default: '键'
  },
  placeholderValue: {
    type: String,
    default: '值'
  },
  presetOptions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:params'])

// 表格列配置
const columns = [
  {
    title: '',
    key: 'enabled',
    width: 50,
    align: 'center'
  },
  {
    title: '键',
    key: 'key',
    width: '40%'
  },
  {
    title: '值',
    key: 'value',
    width: '50%'
  },
  {
    title: '',
    key: 'actions',
    width: 60,
    align: 'center'
  }
]

// 键的自动完成选项
const keyOptions = computed(() => {
  return props.presetOptions.map(option => ({
    value: option,
    label: option
  }))
})

// 键的描述信息
const keyDescriptions = {
  'Content-Type': '指定请求体的媒体类型',
  'Authorization': '身份验证信息',
  'Accept': '客户端能够接收的内容类型',
  'User-Agent': '用户代理字符串',
  'X-API-Key': 'API密钥',
  'X-Requested-With': '标识Ajax请求',
  'Cache-Control': '缓存控制指令',
  'Accept-Language': '客户端语言偏好',
  'Accept-Encoding': '客户端支持的编码格式',
  'Connection': '连接管理',
  'Host': '目标主机',
  'Referer': '引用页面',
  'Origin': '请求来源'
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

// 更新单个参数
const updateParam = (index, field, value) => {
  const newParams = [...props.params]
  newParams[index] = { ...newParams[index], [field]: value }
  emit('update:params', newParams)
}

// 更新参数
const updateParams = () => {
  emit('update:params', props.params)
}

// 添加参数
const addParam = () => {
  const newParams = [...props.params, { key: '', value: '', enabled: true }]
  emit('update:params', newParams)
}

// 删除参数
const removeParam = (index) => {
  if (props.params.length > 1) {
    const newParams = props.params.filter((_, i) => i !== index)
    emit('update:params', newParams)
  }
}

// 如果需要则添加新行
const addNewRowIfNeeded = () => {
  const lastParam = props.params[props.params.length - 1]
  if (lastParam && (lastParam.key || lastParam.value)) {
    // 检查是否已经有空行
    const hasEmptyRow = props.params.some(param => !param.key && !param.value)
    if (!hasEmptyRow) {
      addParam()
    }
  }
}
</script>

<style scoped>
.params-table {
  width: 100%;
}

.add-button {
  margin-top: 8px;
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

:deep(.ant-auto-complete .ant-input) {
  border: none;
  box-shadow: none;
  transition: all 0.2s ease;
}

:deep(.ant-auto-complete .ant-input:hover) {
  border: 1px solid #d9d9d9;
}

:deep(.ant-auto-complete .ant-input:focus) {
  border: 1px solid #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

/* 下拉选项样式 */
:deep(.ant-select-dropdown) {
  border-radius: 6px;
  box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
}

:deep(.ant-select-item-option) {
  padding: 8px 12px;
}

:deep(.ant-select-item-option:hover) {
  background-color: #f5f5f5;
}

:deep(.ant-select-item-option-selected) {
  background-color: #e6f7ff;
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

[data-theme="dark"] :deep(.ant-auto-complete .ant-input:hover) {
  border: 1px solid #434343;
}

[data-theme="dark"] :deep(.ant-select-item-option:hover) {
  background-color: #262626;
}

[data-theme="dark"] :deep(.ant-select-item-option-selected) {
  background-color: #111b26;
}
</style>
