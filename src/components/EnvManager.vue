<template>
  <a-modal
    :open="visible"
    title="环境变量管理"
    width="800px"
    :footer="null"
    @cancel="handleCancel"
  >
    <div class="env-manager">
      <!-- 环境选择 -->
      <div class="env-selector">
        <a-row :gutter="16" align="middle">
          <a-col :span="12">
            <a-select
              v-model:value="currentEnv"
              style="width: 100%"
              @change="handleEnvChange"
            >
              <a-select-option
                v-for="(env, name) in environments"
                :key="name"
                :value="name"
              >
                {{ name === 'default' ? '默认环境' : name }}
              </a-select-option>
            </a-select>
          </a-col>
          <a-col :span="12">
            <a-button-group>
              <a-button @click="showCreateEnv = true">
                <template #icon><PlusOutlined /></template>
                新建环境
              </a-button>
              <a-button 
                @click="deleteEnvironment" 
                :disabled="currentEnv === 'default'"
                danger
              >
                <template #icon><DeleteOutlined /></template>
                删除环境
              </a-button>
            </a-button-group>
          </a-col>
        </a-row>
      </div>

      <!-- 变量列表 -->
      <div class="variables-section">
        <div class="section-header">
          <h4>环境变量</h4>
          <a-button-group size="small">
            <a-button @click="addVariable">
              <template #icon><PlusOutlined /></template>
              添加变量
            </a-button>
            <a-button @click="importVariables">
              <template #icon><ImportOutlined /></template>
              导入
            </a-button>
            <a-button @click="exportVariables">
              <template #icon><ExportOutlined /></template>
              导出
            </a-button>
          </a-button-group>
        </div>

        <a-table
          :columns="columns"
          :data-source="variableList"
          :pagination="false"
          size="small"
          :scroll="{ y: 300 }"
        >
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'name'">
              <a-input
                v-model:value="record.name"
                placeholder="变量名"
                @change="updateVariable"
                :status="!isValidName(record.name) ? 'error' : ''"
              />
            </template>
            
            <template v-else-if="column.key === 'value'">
              <a-input
                v-model:value="record.value"
                placeholder="变量值"
                @change="updateVariable"
              />
            </template>
            
            <template v-else-if="column.key === 'actions'">
              <a-button
                type="text"
                size="small"
                danger
                @click="removeVariable(index)"
              >
                <template #icon><DeleteOutlined /></template>
              </a-button>
            </template>
          </template>
        </a-table>
      </div>

      <!-- 预览区域 -->
      <div class="preview-section">
        <h4>使用示例</h4>
        <div class="example-item">
          <span class="example-label">URL:</span>
          <code>{{ exampleUrl }}</code>
        </div>
        <div class="example-item">
          <span class="example-label">Header:</span>
          <code>{{ exampleHeader }}</code>
        </div>
        <div class="example-item">
          <span class="example-label">解析后:</span>
          <code>{{ previewUrl }}</code>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="actions">
        <a-space>
          <a-button @click="handleCancel">取消</a-button>
          <a-button type="primary" @click="saveVariables">保存</a-button>
        </a-space>
      </div>
    </div>

    <!-- 创建环境对话框 -->
    <a-modal
      v-model:open="showCreateEnv"
      title="创建新环境"
      @ok="createEnvironment"
      @cancel="showCreateEnv = false"
    >
      <a-form layout="vertical">
        <a-form-item label="环境名称" required>
          <a-input
            v-model:value="newEnvName"
            placeholder="输入环境名称"
            @keyup.enter="createEnvironment"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 导入对话框 -->
    <a-modal
      v-model:open="showImport"
      title="导入环境变量"
      @ok="handleImport"
      @cancel="showImport = false"
    >
      <a-form layout="vertical">
        <a-form-item label="JSON数据">
          <a-textarea
            v-model:value="importData"
            :rows="10"
            placeholder="粘贴JSON格式的环境变量数据"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-modal>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { 
  PlusOutlined, 
  DeleteOutlined, 
  ImportOutlined, 
  ExportOutlined 
} from '@ant-design/icons-vue'
import { message, Modal } from 'ant-design-vue'
import envService from '@/services/envService.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible'])

// 数据状态
const environments = ref({})
const currentEnv = ref('default')
const variableList = ref([])
const showCreateEnv = ref(false)
const showImport = ref(false)
const newEnvName = ref('')
const importData = ref('')

// 表格列配置
const columns = [
  {
    title: '变量名',
    key: 'name',
    width: '40%'
  },
  {
    title: '变量值',
    key: 'value',
    width: '50%'
  },
  {
    title: '操作',
    key: 'actions',
    width: '10%',
    align: 'center'
  }
]

// 示例URL
const exampleUrl = computed(() => {
  return '{{baseUrl}}/api/{{version}}/users'
})

// 示例Header
const exampleHeader = computed(() => {
  return 'Authorization: Bearer {{token}}'
})

// 预览URL
const previewUrl = computed(() => {
  const variables = {}
  variableList.value.forEach(item => {
    if (item.name && item.value) {
      variables[item.name] = item.value
    }
  })
  
  let url = '{{baseUrl}}/api/{{version}}/users'
  return url.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return variables[varName] || match
  })
})

// 验证变量名
const isValidName = (name) => {
  return envService.isValidVariableName(name)
}

// 加载环境数据
const loadEnvironments = () => {
  environments.value = envService.getAllEnvironments()
  currentEnv.value = envService.getCurrentEnvironment()
  loadCurrentEnvVariables()
}

// 加载当前环境的变量
const loadCurrentEnvVariables = () => {
  const envVars = environments.value[currentEnv.value] || {}
  variableList.value = Object.entries(envVars).map(([name, value]) => ({
    name,
    value
  }))
  
  // 确保至少有一个空行
  if (variableList.value.length === 0 || variableList.value[variableList.value.length - 1].name) {
    variableList.value.push({ name: '', value: '' })
  }
}

// 环境变更处理
const handleEnvChange = () => {
  loadCurrentEnvVariables()
}

// 添加变量
const addVariable = () => {
  variableList.value.push({ name: '', value: '' })
}

// 删除变量
const removeVariable = (index) => {
  variableList.value.splice(index, 1)
}

// 更新变量
const updateVariable = () => {
  // 自动添加新行
  const lastItem = variableList.value[variableList.value.length - 1]
  if (lastItem && (lastItem.name || lastItem.value)) {
    variableList.value.push({ name: '', value: '' })
  }
}

// 创建环境
const createEnvironment = () => {
  if (!newEnvName.value.trim()) {
    message.error('请输入环境名称')
    return
  }
  
  if (environments.value[newEnvName.value]) {
    message.error('环境名称已存在')
    return
  }
  
  try {
    envService.createEnvironment(newEnvName.value, {})
    loadEnvironments()
    currentEnv.value = newEnvName.value
    showCreateEnv.value = false
    newEnvName.value = ''
    message.success('环境创建成功')
  } catch (error) {
    message.error('创建环境失败: ' + error.message)
  }
}

// 删除环境
const deleteEnvironment = () => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除环境 "${currentEnv.value}" 吗？`,
    onOk() {
      try {
        envService.deleteEnvironment(currentEnv.value)
        loadEnvironments()
        message.success('环境删除成功')
      } catch (error) {
        message.error('删除环境失败: ' + error.message)
      }
    }
  })
}

// 导入变量
const importVariables = () => {
  showImport.value = true
  importData.value = ''
}

// 处理导入
const handleImport = () => {
  try {
    const data = JSON.parse(importData.value)
    variableList.value = Object.entries(data).map(([name, value]) => ({
      name,
      value: String(value)
    }))
    variableList.value.push({ name: '', value: '' })
    showImport.value = false
    message.success('导入成功')
  } catch (error) {
    message.error('导入失败: JSON格式错误')
  }
}

// 导出变量
const exportVariables = () => {
  const variables = {}
  variableList.value.forEach(item => {
    if (item.name && item.value) {
      variables[item.name] = item.value
    }
  })
  
  const jsonStr = JSON.stringify(variables, null, 2)
  navigator.clipboard.writeText(jsonStr).then(() => {
    message.success('环境变量已复制到剪贴板')
  }).catch(() => {
    message.error('复制失败')
  })
}

// 保存变量
const saveVariables = () => {
  const variables = {}
  const invalidNames = []
  
  variableList.value.forEach(item => {
    if (item.name) {
      if (!isValidName(item.name)) {
        invalidNames.push(item.name)
      } else {
        variables[item.name] = item.value || ''
      }
    }
  })
  
  if (invalidNames.length > 0) {
    message.error(`变量名格式错误: ${invalidNames.join(', ')}`)
    return
  }
  
  try {
    environments.value[currentEnv.value] = variables
    envService.saveEnvironments(environments.value)
    envService.setCurrentEnvironment(currentEnv.value)
    
    handleCancel()
    message.success('环境变量保存成功')
  } catch (error) {
    message.error('保存失败: ' + error.message)
  }
}

// 取消操作
const handleCancel = () => {
  emit('update:visible', false)
}

// 监听visible变化
watch(() => props.visible, (newVal) => {
  if (newVal) {
    loadEnvironments()
  }
})

onMounted(() => {
  if (props.visible) {
    loadEnvironments()
  }
})
</script>

<style scoped>
.env-manager {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.env-selector {
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.variables-section {
  flex: 1;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h4 {
  margin: 0;
}

.preview-section {
  background: #fafafa;
  padding: 16px;
  border-radius: 6px;
}

.preview-section h4 {
  margin: 0 0 12px 0;
}

.example-item {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.example-label {
  min-width: 60px;
  font-weight: 500;
}

.example-item code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

:deep(.ant-table-tbody > tr > td) {
  padding: 4px 8px;
}

:deep(.ant-input) {
  border: none;
  box-shadow: none;
}

:deep(.ant-input:focus) {
  border: 1px solid #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

:deep(.ant-input-status-error) {
  border-color: #ff4d4f;
}
</style>
