import { createRouter, createWebHistory } from 'vue-router'
import Workspace from '@/views/Workspace.vue'
import History from '@/views/History.vue'

const routes = [
  {
    path: '/',
    redirect: '/workspace'
  },
  {
    path: '/workspace',
    name: 'Workspace',
    component: Workspace
  },
  {
    path: '/history',
    name: 'History',
    component: History
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫 - 保存未完成请求
router.beforeEach((to, from, next) => {
  // 这里可以添加保存当前请求状态的逻辑
  next()
})

export default router
