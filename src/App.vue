<template>
  <div id="app">
    <a-config-provider :theme="currentThemeConfig">
      <router-view />
    </a-config-provider>
  </div>
</template>

<script setup>
import { ref, computed, provide, onMounted, onUnmounted } from 'vue'
import { initializeMonaco } from '@/utils/monaco-config'
import { themeManager, themeUtils } from '@/utils/themeConfig'

// 当前主题状态
const currentTheme = ref(themeManager.getCurrentTheme())

// 计算Ant Design的主题配置
const currentThemeConfig = computed(() => ({
  algorithm: currentTheme.value.algorithm,
  token: currentTheme.value.token
}))

// 计算是否为深色主题
const isDarkTheme = computed(() => themeUtils.isDarkTheme())

// 提供主题相关状态和方法给子组件
provide('themeManager', themeManager)
provide('currentTheme', currentTheme)
provide('isDarkTheme', isDarkTheme)

// 主题切换方法
const setTheme = (themeKey) => {
  return themeManager.setTheme(themeKey)
}

// 获取所有主题
const getAllThemes = () => {
  return themeManager.getAllThemes()
}

// 订阅主题变化
let unsubscribe = null

onMounted(() => {
  // 初始化主题
  themeManager.applyCssVariables()
  
  // 订阅主题变化
  unsubscribe = themeManager.subscribe((theme) => {
    currentTheme.value = theme
  })
  
  // 初始化Monaco Editor
  initializeMonaco()
  
  // 将主题相关方法暴露给全局（兼容性）
  window.setTheme = setTheme
  window.getAllThemes = getAllThemes
  window.themeManager = themeManager
  
  // 兼容旧的toggleTheme方法
  window.toggleTheme = () => {
    const isCurrentlyDark = themeUtils.isDarkTheme()
    setTheme(isCurrentlyDark ? 'light' : 'dark')
  }
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})
</script>

<style>
/* CSS变量定义 - 由主题管理器动态设置 */
:root {
  /* 默认值，会被themeManager.applyCssVariables()覆盖 */
  --app-bg-color: #f5f5f5;
  --app-sidebar-bg: #ffffff;
  --app-header-bg: #ffffff;
  --app-border-color: #d9d9d9;
  --app-text-primary: #262626;
  --app-text-secondary: #8c8c8c;
  --app-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

#app {
  height: 100vh;
  overflow: hidden;
  background: var(--app-bg-color);
  color: var(--app-text-primary);
  transition: all 0.3s ease;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif, 'Apple Color Emoji',
    'Segoe UI Emoji', 'Segoe UI Symbol';
  transition: all 0.3s ease;
}

.ant-layout {
  height: 100vh;
}

.ant-layout-sider {
  background: var(--app-sidebar-bg) !important;
  border-right: 1px solid var(--app-border-color) !important;
  transition: all 0.3s ease;
}

.ant-layout-content {
  background: var(--app-bg-color);
  transition: all 0.3s ease;
}

.ant-layout-header {
  background: var(--app-header-bg) !important;
  border-bottom: 1px solid var(--app-border-color) !important;
  transition: all 0.3s ease;
}

/* 通用组件样式增强 */
.ant-card {
  box-shadow: var(--app-shadow);
  transition: all 0.3s ease;
}

.ant-btn {
  transition: all 0.3s ease;
}

.ant-input, .ant-select-selector {
  transition: all 0.3s ease;
}

/* 深色主题特殊样式 */
[data-theme="dark"] {
  color-scheme: dark;
}

/* 滚动条美化 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: var(--app-bg-color);
}

::-webkit-scrollbar-thumb {
  background: var(--app-border-color);
  border-radius: 3px;
  transition: all 0.3s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--app-text-secondary);
}

/* 主题切换动画 */
* {
  transition-property: background-color, border-color, color, box-shadow, background;
  transition-duration: 0.3s;
  transition-timing-function: ease;
}

/* 主题预览卡片样式 */
.theme-preview-card {
  position: relative;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.theme-preview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.theme-preview-card.active {
  border-color: var(--ant-color-primary);
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.2);
}

.theme-preview-content {
  padding: 16px;
  border-radius: 6px;
  position: relative;
  overflow: hidden;
}

.theme-preview-colors {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.theme-preview-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.theme-preview-name {
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 4px;
}

.theme-preview-description {
  font-size: 12px;
  opacity: 0.7;
}

/* 主题切换器组件样式 */
.theme-switcher {
  padding: 20px;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.theme-actions {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--app-border-color);
}

/* 自定义主题编辑器样式 */
.theme-editor {
  padding: 20px;
}

.color-picker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.color-picker-label {
  font-weight: 500;
}

.color-picker-input {
  width: 60px;
  height: 30px;
  border: 1px solid var(--app-border-color);
  border-radius: 4px;
  cursor: pointer;
}
</style>
