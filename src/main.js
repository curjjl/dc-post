import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import { initializeMonaco } from './utils/monaco-config'

// 初始化Monaco Editor配置
initializeMonaco()

const app = createApp(App)

app.use(router)
app.use(Antd)

app.mount('#app')
