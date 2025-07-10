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

/* 深色主题下的样式调整 */
[data-theme="dark"] .ant-layout-sider {
  background: #141414 !important;
}

[data-theme="dark"] .ant-layout-content {
  background: #000;
}
</style>
