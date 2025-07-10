<template>
  <div id="app" :data-theme="isDarkMode ? 'dark' : 'light'">
    <a-config-provider :theme="{ algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm }">
      <router-view />
    </a-config-provider>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { theme } from 'ant-design-vue'

// 主题切换状态
const isDarkMode = ref(false)

// 提供全局主题切换方法
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
}

// 初始化主题
const savedTheme = localStorage.getItem('theme')
if (savedTheme) {
  isDarkMode.value = savedTheme === 'dark'
}

// 将主题切换方法暴露给全局
window.toggleTheme = toggleTheme
</script>

<style>
#app {
  height: 100vh;
  overflow: hidden;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif, 'Apple Color Emoji',
    'Segoe UI Emoji', 'Segoe UI Symbol';
}

.ant-layout {
  height: 100vh;
}

.ant-layout-sider {
  background: #fff !important;
}

.ant-layout-content {
  background: #f5f5f5;
}

/* 深色主题下的全局样式调整 */
[data-theme="dark"] {
  color-scheme: dark;
}

[data-theme="dark"] .ant-layout-sider {
  background: #141414 !important;
  border-color: #303030 !important;
}

[data-theme="dark"] .ant-layout-content {
  background: #000;
}

[data-theme="dark"] .ant-layout-header {
  background: #141414 !important;
  border-color: #303030 !important;
}

/* 深色主题下的卡片和面板 */
[data-theme="dark"] .ant-card {
  background: #141414 !important;
  border-color: #303030 !important;
}

[data-theme="dark"] .ant-card-head {
  background: #1f1f1f !important;
  border-color: #303030 !important;
}

/* 深色主题下的输入框 */
[data-theme="dark"] .ant-input,
[data-theme="dark"] .ant-select-selector {
  background: #1f1f1f !important;
  border-color: #434343 !important;
  color: #fff !important;
}

[data-theme="dark"] .ant-input:hover,
[data-theme="dark"] .ant-select:hover .ant-select-selector {
  border-color: #177ddc !important;
}

[data-theme="dark"] .ant-input:focus,
[data-theme="dark"] .ant-select-focused .ant-select-selector {
  border-color: #177ddc !important;
  box-shadow: 0 0 0 2px rgba(23, 125, 220, 0.2) !important;
}

/* 深色主题下的按钮 */
[data-theme="dark"] .ant-btn-text {
  color: #fff !important;
}

[data-theme="dark"] .ant-btn-text:hover {
  background: #262626 !important;
}

/* 深色主题下的标签页 */
[data-theme="dark"] .ant-tabs-tab {
  color: #fff !important;
}

[data-theme="dark"] .ant-tabs-tab:hover {
  color: #177ddc !important;
}

[data-theme="dark"] .ant-tabs-tab-active {
  color: #177ddc !important;
}

[data-theme="dark"] .ant-tabs-ink-bar {
  background: #177ddc !important;
}

/* 深色主题下的表格 */
[data-theme="dark"] .ant-table {
  background: #141414 !important;
}

[data-theme="dark"] .ant-table-thead > tr > th {
  background: #1f1f1f !important;
  border-color: #303030 !important;
  color: #fff !important;
}

[data-theme="dark"] .ant-table-tbody > tr > td {
  border-color: #303030 !important;
  color: #fff !important;
}

[data-theme="dark"] .ant-table-tbody > tr:hover > td {
  background: #262626 !important;
}

/* 深色主题下的下拉菜单 */
[data-theme="dark"] .ant-select-dropdown {
  background: #1f1f1f !important;
  border-color: #434343 !important;
}

[data-theme="dark"] .ant-select-item {
  color: #fff !important;
}

[data-theme="dark"] .ant-select-item:hover {
  background: #262626 !important;
}

[data-theme="dark"] .ant-select-item-option-selected {
  background: #111b26 !important;
  color: #177ddc !important;
}

/* 深色主题下的模态框 */
[data-theme="dark"] .ant-modal-content {
  background: #141414 !important;
}

[data-theme="dark"] .ant-modal-header {
  background: #1f1f1f !important;
  border-color: #303030 !important;
}

[data-theme="dark"] .ant-modal-title {
  color: #fff !important;
}

[data-theme="dark"] .ant-modal-footer {
  background: #1f1f1f !important;
  border-color: #303030 !important;
}

/* 深色主题下的空状态 */
[data-theme="dark"] .ant-empty-description {
  color: #8c8c8c !important;
}

/* 深色主题下的分割线 */
[data-theme="dark"] .ant-divider {
  border-color: #303030 !important;
}

/* 深色主题下的滚动条 */
[data-theme="dark"] ::-webkit-scrollbar-track {
  background: #1f1f1f !important;
}

[data-theme="dark"] ::-webkit-scrollbar-thumb {
  background: #434343 !important;
}

[data-theme="dark"] ::-webkit-scrollbar-thumb:hover {
  background: #595959 !important;
}
</style>
