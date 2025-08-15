<template>
  <a-modal
    :open="visible"
    title="主题换肤"
    width="900px"
    :footer="null"
    @cancel="handleCancel"
    class="theme-switcher-modal"
  >
    <div class="theme-switcher">
      <a-tabs v-model:activeKey="activeTab" type="card">
        <!-- 预设主题选择 -->
        <a-tab-pane key="preset" tab="预设主题">
          <div class="theme-section">
            <p class="section-description">选择一个预设主题，快速切换应用外观</p>
            
            <div class="theme-grid">
              <div
                v-for="(theme, key) in presetThemes"
                :key="key"
                :class="['theme-preview-card', { active: currentThemeKey === key }]"
                @click="selectTheme(key)"
              >
                <div class="theme-preview-content">
                  <!-- 主题色彩预览 -->
                  <div class="theme-preview-colors">
                    <div 
                      class="theme-preview-color"
                      :style="{ backgroundColor: theme.token.colorPrimary }"
                      :title="`主色: ${theme.token.colorPrimary}`"
                    ></div>
                    <div 
                      class="theme-preview-color"
                      :style="{ backgroundColor: theme.token.colorSuccess }"
                      :title="`成功色: ${theme.token.colorSuccess}`"
                    ></div>
                    <div 
                      class="theme-preview-color"
                      :style="{ backgroundColor: theme.token.colorWarning }"
                      :title="`警告色: ${theme.token.colorWarning}`"
                    ></div>
                    <div 
                      class="theme-preview-color"
                      :style="{ backgroundColor: theme.token.colorError }"
                      :title="`错误色: ${theme.token.colorError}`"
                    ></div>
                  </div>
                  
                  <!-- 主题信息 -->
                  <div class="theme-preview-name">{{ theme.name }}</div>
                  <div class="theme-preview-description">
                    {{ getThemeDescription(theme) }}
                  </div>
                  
                  <!-- 背景预览 -->
                  <div 
                    class="theme-preview-bg"
                    :style="{ 
                      backgroundColor: theme.token.colorBgBase,
                      color: theme.token.colorTextBase 
                    }"
                  >
                    <div class="preview-element">预览</div>
                  </div>
                </div>
                
                <!-- 选中标识 -->
                <div v-if="currentThemeKey === key" class="theme-selected-badge">
                  <CheckOutlined />
                </div>
              </div>
            </div>
          </div>
        </a-tab-pane>

        <!-- 自定义主题 -->
        <a-tab-pane key="custom" tab="自定义主题">
          <div class="theme-section">
            <p class="section-description">创建和管理自定义主题</p>
            
            <!-- 自定义主题列表 -->
            <div v-if="customThemes.length > 0" class="custom-themes-list">
              <h4>我的主题</h4>
              <div class="theme-grid">
                <div
                  v-for="theme in customThemes"
                  :key="theme.key"
                  :class="['theme-preview-card', { active: currentThemeKey === theme.key }]"
                  @click="selectTheme(theme.key)"
                >
                  <div class="theme-preview-content">
                    <div class="theme-preview-colors">
                      <div 
                        class="theme-preview-color"
                        :style="{ backgroundColor: theme.token.colorPrimary }"
                      ></div>
                      <div 
                        class="theme-preview-color"
                        :style="{ backgroundColor: theme.token.colorSuccess }"
                      ></div>
                      <div 
                        class="theme-preview-color"
                        :style="{ backgroundColor: theme.token.colorWarning }"
                      ></div>
                      <div 
                        class="theme-preview-color"
                        :style="{ backgroundColor: theme.token.colorError }"
                      ></div>
                    </div>
                    
                    <div class="theme-preview-name">{{ theme.name }}</div>
                    <div class="theme-preview-description">自定义主题</div>
                  </div>
                  
                  <!-- 操作按钮 -->
                  <div class="theme-actions-overlay">
                    <a-button 
                      size="small" 
                      type="text" 
                      @click.stop="editCustomTheme(theme)"
                      title="编辑"
                    >
                      <EditOutlined />
                    </a-button>
                    <a-button 
                      size="small" 
                      type="text" 
                      danger
                      @click.stop="deleteCustomTheme(theme.key)"
                      title="删除"
                    >
                      <DeleteOutlined />
                    </a-button>
                  </div>
                  
                  <div v-if="currentThemeKey === theme.key" class="theme-selected-badge">
                    <CheckOutlined />
                  </div>
                </div>
              </div>
            </div>

            <!-- 创建新主题 -->
            <div class="create-theme-section">
              <a-button type="primary" @click="showThemeEditor = true">
                <template #icon><PlusOutlined /></template>
                创建新主题
              </a-button>
            </div>
          </div>
        </a-tab-pane>

        <!-- 主题编辑器 -->
        <a-tab-pane key="editor" tab="主题编辑器" :disabled="!showThemeEditor">
          <div v-if="showThemeEditor" class="theme-editor">
            <div class="editor-header">
              <h4>{{ editingTheme.key ? '编辑主题' : '创建新主题' }}</h4>
              <p>自定义颜色和样式以创建独特的主题</p>
            </div>

            <a-form layout="vertical" :model="editingTheme">
              <a-row :gutter="24">
                <a-col :span="12">
                  <a-form-item label="主题名称" required>
                    <a-input v-model:value="editingTheme.name" placeholder="输入主题名称" />
                  </a-form-item>
                  
                  <a-form-item label="主题标识" required>
                    <a-input 
                      v-model:value="editingTheme.key" 
                      placeholder="theme-key" 
                      :disabled="!!editingTheme.originalKey"
                    />
                  </a-form-item>

                  <a-form-item label="基础算法">
                    <a-select v-model:value="editingTheme.algorithmType">
                      <a-select-option value="default">默认算法</a-select-option>
                      <a-select-option value="dark">深色算法</a-select-option>
                      <a-select-option value="compact">紧凑算法</a-select-option>
                      <a-select-option value="darkCompact">深色+紧凑</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>

                <a-col :span="12">
                  <div class="color-picker-section">
                    <h5>颜色配置</h5>
                    
                    <div class="color-picker-item">
                      <span class="color-picker-label">主色调</span>
                      <input
                        type="color"
                        v-model="editingTheme.token.colorPrimary"
                        class="color-picker-input"
                      />
                    </div>
                    
                    <div class="color-picker-item">
                      <span class="color-picker-label">成功色</span>
                      <input
                        type="color"
                        v-model="editingTheme.token.colorSuccess"
                        class="color-picker-input"
                      />
                    </div>
                    
                    <div class="color-picker-item">
                      <span class="color-picker-label">警告色</span>
                      <input
                        type="color"
                        v-model="editingTheme.token.colorWarning"
                        class="color-picker-input"
                      />
                    </div>
                    
                    <div class="color-picker-item">
                      <span class="color-picker-label">错误色</span>
                      <input
                        type="color"
                        v-model="editingTheme.token.colorError"
                        class="color-picker-input"
                      />
                    </div>
                    
                    <div class="color-picker-item">
                      <span class="color-picker-label">背景色</span>
                      <input
                        type="color"
                        v-model="editingTheme.token.colorBgBase"
                        class="color-picker-input"
                      />
                    </div>
                    
                    <div class="color-picker-item">
                      <span class="color-picker-label">文字色</span>
                      <input
                        type="color"
                        v-model="editingTheme.token.colorTextBase"
                        class="color-picker-input"
                      />
                    </div>
                  </div>
                </a-col>
              </a-row>

              <a-row :gutter="24">
                <a-col :span="12">
                  <a-form-item label="圆角大小">
                    <a-slider
                      v-model:value="editingTheme.token.borderRadius"
                      :min="0"
                      :max="20"
                      :marks="{ 0: '0px', 6: '6px', 12: '12px', 20: '20px' }"
                    />
                  </a-form-item>
                </a-col>

                <a-col :span="12">
                  <a-form-item label="线框模式">
                    <a-switch v-model:checked="editingTheme.token.wireframe" />
                  </a-form-item>
                </a-col>
              </a-row>

              <!-- 实时预览 -->
              <div class="theme-preview-section">
                <h5>预览效果</h5>
                <div class="live-preview" :style="getPreviewStyle()">
                  <div class="preview-card">
                    <div class="preview-header">示例卡片</div>
                    <div class="preview-content">
                      <a-button 
                        type="primary" 
                        size="small"
                        :style="{ backgroundColor: editingTheme.token.colorPrimary, borderColor: editingTheme.token.colorPrimary }"
                      >
                        主要按钮
                      </a-button>
                      <a-button size="small" style="margin-left: 8px;">次要按钮</a-button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 编辑器操作 -->
              <div class="editor-actions">
                <a-space>
                  <a-button @click="cancelThemeEditor">取消</a-button>
                  <a-button type="primary" @click="saveCustomTheme">
                    {{ editingTheme.originalKey ? '保存修改' : '创建主题' }}
                  </a-button>
                </a-space>
              </div>
            </a-form>
          </div>
        </a-tab-pane>

        <!-- 导入导出 -->
        <a-tab-pane key="import-export" tab="导入导出">
          <div class="import-export-section">
            <a-row :gutter="24">
              <a-col :span="12">
                <h4>导出主题</h4>
                <p>将当前主题或自定义主题导出为JSON文件</p>
                
                <a-form-item label="选择要导出的主题">
                  <a-select v-model:value="exportThemeKey" style="width: 100%">
                    <a-select-option value="current">当前主题</a-select-option>
                    <a-select-option 
                      v-for="(theme, key) in allThemes" 
                      :key="key" 
                      :value="key"
                    >
                      {{ theme.name }}
                    </a-select-option>
                  </a-select>
                </a-form-item>
                
                <a-button type="primary" @click="exportTheme">
                  <template #icon><ExportOutlined /></template>
                  导出主题
                </a-button>
              </a-col>

              <a-col :span="12">
                <h4>导入主题</h4>
                <p>从JSON文件导入自定义主题</p>
                
                <a-upload
                  :before-upload="importTheme"
                  :show-upload-list="false"
                  accept=".json"
                >
                  <a-button>
                    <template #icon><ImportOutlined /></template>
                    选择文件导入
                  </a-button>
                </a-upload>
                
                <div class="import-textarea">
                  <a-form-item label="或直接粘贴主题JSON">
                    <a-textarea
                      v-model:value="importThemeText"
                      :rows="6"
                      placeholder="粘贴主题JSON配置..."
                    />
                  </a-form-item>
                  <a-button type="primary" @click="importThemeFromText">
                    导入主题
                  </a-button>
                </div>
              </a-col>
            </a-row>
          </div>
        </a-tab-pane>
      </a-tabs>

      <!-- 底部操作 -->
      <div class="theme-actions">
        <a-row justify="space-between">
          <a-col>
            <a-space>
              <a-button @click="resetToDefault">重置为默认</a-button>
              <a-button danger @click="clearAllCustomThemes">清除所有自定义主题</a-button>
            </a-space>
          </a-col>
          <a-col>
            <a-space>
              <a-button @click="handleCancel">关闭</a-button>
            </a-space>
          </a-col>
        </a-row>
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, computed, inject, watch, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { 
  CheckOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined,
  ExportOutlined,
  ImportOutlined
} from '@ant-design/icons-vue'
import { theme } from 'ant-design-vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible'])

// 注入主题管理器
const themeManager = inject('themeManager')
const currentTheme = inject('currentTheme')

// 组件状态
const activeTab = ref('preset')
const showThemeEditor = ref(false)
const exportThemeKey = ref('current')
const importThemeText = ref('')

// 当前主题
const currentThemeKey = computed(() => currentTheme.value.key)

// 所有主题
const allThemes = computed(() => themeManager.getAllThemes())

// 预设主题
const presetThemes = computed(() => {
  const themes = themeManager.getAllThemes()
  const preset = {}
  Object.keys(themes).forEach(key => {
    if (!themes[key].custom) {
      preset[key] = themes[key]
    }
  })
  return preset
})

// 自定义主题
const customThemes = computed(() => {
  const themes = themeManager.getAllThemes()
  return Object.values(themes).filter(theme => theme.custom)
})

// 编辑中的主题
const editingTheme = ref({
  name: '',
  key: '',
  algorithmType: 'default',
  token: {
    colorPrimary: '#1677ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1677ff',
    colorBgBase: '#ffffff',
    colorTextBase: '#000000',
    borderRadius: 6,
    wireframe: false,
  },
  customCss: {
    '--app-bg-color': '#f5f5f5',
    '--app-sidebar-bg': '#ffffff',
    '--app-header-bg': '#ffffff',
    '--app-border-color': '#d9d9d9',
    '--app-text-primary': '#262626',
    '--app-text-secondary': '#8c8c8c',
    '--app-shadow': '0 2px 8px rgba(0, 0, 0, 0.1)',
  }
})

// 获取主题描述
const getThemeDescription = (theme) => {
  const descriptions = {
    light: '经典的浅色主题，适合日常使用',
    dark: '护眼的深色主题，适合夜间使用',
    compact: '节省空间的紧凑布局',
    blue: '专业的蓝色科技风格',
    green: '清新的自然绿色风格',
    red: '热情的红色主题',
    purple: '优雅的紫色主题',
    orange: '活力的橙色主题',
    darkCompact: '深色+紧凑的高效模式',
    highContrast: '高对比度，提升可访问性'
  }
  return descriptions[theme.key] || '自定义主题'
}

// 选择主题
const selectTheme = (themeKey) => {
  themeManager.setTheme(themeKey)
  message.success(`已切换到 ${allThemes.value[themeKey].name} 主题`)
}

// 编辑自定义主题
const editCustomTheme = (theme) => {
  editingTheme.value = {
    ...theme,
    originalKey: theme.key,
    algorithmType: getAlgorithmType(theme.algorithm)
  }
  showThemeEditor.value = true
  activeTab.value = 'editor'
}

// 获取算法类型
const getAlgorithmType = (algorithm) => {
  if (Array.isArray(algorithm)) {
    if (algorithm.includes(theme.darkAlgorithm) && algorithm.includes(theme.compactAlgorithm)) {
      return 'darkCompact'
    }
    if (algorithm.includes(theme.compactAlgorithm)) {
      return 'compact'
    }
  }
  if (algorithm === theme.darkAlgorithm) {
    return 'dark'
  }
  return 'default'
}

// 获取算法
const getAlgorithm = (algorithmType) => {
  switch (algorithmType) {
    case 'dark':
      return theme.darkAlgorithm
    case 'compact':
      return [theme.defaultAlgorithm, theme.compactAlgorithm]
    case 'darkCompact':
      return [theme.darkAlgorithm, theme.compactAlgorithm]
    default:
      return theme.defaultAlgorithm
  }
}

// 获取预览样式
const getPreviewStyle = () => ({
  backgroundColor: editingTheme.value.token.colorBgBase,
  color: editingTheme.value.token.colorTextBase,
  borderRadius: `${editingTheme.value.token.borderRadius}px`
})

// 保存自定义主题
const saveCustomTheme = () => {
  if (!editingTheme.value.name || !editingTheme.value.key) {
    message.error('请填写主题名称和标识')
    return
  }

  const themeConfig = {
    name: editingTheme.value.name,
    key: editingTheme.value.key,
    algorithm: getAlgorithm(editingTheme.value.algorithmType),
    token: { ...editingTheme.value.token },
    customCss: { ...editingTheme.value.customCss }
  }

  // 如果是编辑现有主题，先删除原主题
  if (editingTheme.value.originalKey && editingTheme.value.originalKey !== editingTheme.value.key) {
    themeManager.removeCustomTheme(editingTheme.value.originalKey)
  }

  themeManager.addCustomTheme(editingTheme.value.key, themeConfig)
  message.success(`主题 ${editingTheme.value.name} 保存成功`)
  
  cancelThemeEditor()
}

// 取消编辑主题
const cancelThemeEditor = () => {
  showThemeEditor.value = false
  activeTab.value = 'custom'
  resetEditingTheme()
}

// 重置编辑主题
const resetEditingTheme = () => {
  editingTheme.value = {
    name: '',
    key: '',
    algorithmType: 'default',
    token: {
      colorPrimary: '#1677ff',
      colorSuccess: '#52c41a',
      colorWarning: '#faad14',
      colorError: '#ff4d4f',
      colorInfo: '#1677ff',
      colorBgBase: '#ffffff',
      colorTextBase: '#000000',
      borderRadius: 6,
      wireframe: false,
    },
    customCss: {
      '--app-bg-color': '#f5f5f5',
      '--app-sidebar-bg': '#ffffff',
      '--app-header-bg': '#ffffff',
      '--app-border-color': '#d9d9d9',
      '--app-text-primary': '#262626',
      '--app-text-secondary': '#8c8c8c',
      '--app-shadow': '0 2px 8px rgba(0, 0, 0, 0.1)',
    }
  }
}

// 删除自定义主题
const deleteCustomTheme = (themeKey) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这个自定义主题吗？此操作不可恢复。',
    onOk() {
      themeManager.removeCustomTheme(themeKey)
      message.success('主题删除成功')
    }
  })
}

// 导出主题
const exportTheme = () => {
  const themeKey = exportThemeKey.value === 'current' ? currentThemeKey.value : exportThemeKey.value
  const themeJson = themeManager.exportTheme(themeKey)
  
  if (themeJson) {
    const blob = new Blob([themeJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `theme-${themeKey}.json`
    a.click()
    URL.revokeObjectURL(url)
    message.success('主题导出成功')
  } else {
    message.error('导出失败')
  }
}

// 导入主题文件
const importTheme = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const themeConfig = JSON.parse(e.target.result)
      if (themeManager.importTheme(themeConfig)) {
        message.success('主题导入成功')
      } else {
        message.error('主题格式不正确')
      }
    } catch (error) {
      message.error('文件格式错误')
    }
  }
  reader.readAsText(file)
  return false // 阻止默认上传
}

// 从文本导入主题
const importThemeFromText = () => {
  if (!importThemeText.value.trim()) {
    message.error('请输入主题配置')
    return
  }

  if (themeManager.importTheme(importThemeText.value)) {
    message.success('主题导入成功')
    importThemeText.value = ''
  } else {
    message.error('主题格式不正确')
  }
}

// 重置为默认主题
const resetToDefault = () => {
  Modal.confirm({
    title: '确认重置',
    content: '确定要重置为默认主题吗？这将清除所有自定义主题和设置。',
    onOk() {
      themeManager.reset()
      message.success('已重置为默认主题')
    }
  })
}

// 清除所有自定义主题
const clearAllCustomThemes = () => {
  Modal.confirm({
    title: '确认清除',
    content: '确定要清除所有自定义主题吗？此操作不可恢复。',
    onOk() {
      const themes = themeManager.getAllThemes()
      Object.keys(themes).forEach(key => {
        if (themes[key].custom) {
          themeManager.removeCustomTheme(key)
        }
      })
      message.success('已清除所有自定义主题')
    }
  })
}

// 关闭弹窗
const handleCancel = () => {
  emit('update:visible', false)
  if (showThemeEditor.value) {
    cancelThemeEditor()
  }
}

// 监听显示状态
watch(() => props.visible, (visible) => {
  if (!visible) {
    activeTab.value = 'preset'
    showThemeEditor.value = false
    resetEditingTheme()
  }
})
</script>

<style scoped>
.theme-switcher-modal :deep(.ant-modal-content) {
  background: var(--app-sidebar-bg);
}

.theme-section {
  margin-bottom: 20px;
}

.section-description {
  color: var(--app-text-secondary);
  margin-bottom: 16px;
}

.theme-preview-bg {
  margin-top: 8px;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid var(--app-border-color);
}

.preview-element {
  font-size: 12px;
  text-align: center;
}

.theme-actions-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  display: none;
  gap: 4px;
}

.theme-preview-card:hover .theme-actions-overlay {
  display: flex;
}

.theme-selected-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: var(--ant-color-primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.create-theme-section {
  margin-top: 20px;
  text-align: center;
  padding: 40px;
  border: 2px dashed var(--app-border-color);
  border-radius: 8px;
}

.custom-themes-list {
  margin-bottom: 20px;
}

.editor-header {
  margin-bottom: 24px;
}

.color-picker-section h5 {
  margin-bottom: 16px;
}

.theme-preview-section {
  margin-top: 24px;
  padding: 16px;
  border: 1px solid var(--app-border-color);
  border-radius: 6px;
}

.live-preview {
  padding: 16px;
  border-radius: 6px;
  border: 1px solid var(--app-border-color);
}

.preview-card {
  background: rgba(255, 255, 255, 0.1);
  padding: 12px;
  border-radius: 4px;
}

.preview-header {
  font-weight: 500;
  margin-bottom: 8px;
}

.editor-actions {
  margin-top: 24px;
  text-align: right;
}

.import-export-section {
  padding: 20px 0;
}

.import-textarea {
  margin-top: 16px;
}
</style>