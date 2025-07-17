/**
 * API服务使用示例
 * 展示如何使用封装的HTTP服务和API服务
 */

import api from '../api/index.js'
import { CacheStrategy } from '../services/CacheManager.js'
import { RetryStrategy } from '../services/ErrorHandler.js'

/**
 * 基础HTTP请求示例
 */
export async function basicHttpExamples() {
  console.log('=== 基础HTTP请求示例 ===')
  
  try {
    // GET请求
    const users = await api.http.get('/users', {
      params: { page: 1, pageSize: 10 }
    })
    console.log('用户列表:', users.data)
    
    // POST请求
    const newUser = await api.http.post('/users', {
      name: '张三',
      email: 'zhangsan@example.com'
    })
    console.log('创建用户:', newUser.data)
    
    // PUT请求
    const updatedUser = await api.http.put('/users/1', {
      name: '李四',
      email: 'lisi@example.com'
    })
    console.log('更新用户:', updatedUser.data)
    
    // DELETE请求
    const deleteResult = await api.http.delete('/users/1')
    console.log('删除用户:', deleteResult.data)
    
  } catch (error) {
    console.error('HTTP请求错误:', error.userMessage || error.message)
  }
}

/**
 * 缓存策略示例
 */
export async function cacheStrategyExamples() {
  console.log('=== 缓存策略示例 ===')
  
  try {
    // 缓存优先策略
    const cachedData = await api.http.get('/users', {
      cacheStrategy: CacheStrategy.CACHE_FIRST,
      cacheTime: 10 * 60 * 1000 // 缓存10分钟
    })
    console.log('缓存优先数据:', cachedData.metadata.cached)
    
    // 网络优先策略
    const freshData = await api.http.get('/users', {
      cacheStrategy: CacheStrategy.NETWORK_FIRST
    })
    console.log('网络优先数据:', freshData.metadata.cached)
    
    // 仅使用缓存
    try {
      const cacheOnlyData = await api.http.get('/users', {
        cacheStrategy: CacheStrategy.CACHE_ONLY
      })
      console.log('仅缓存数据:', cacheOnlyData.data)
    } catch (error) {
      console.log('缓存中没有数据:', error.message)
    }
    
    // 仅使用网络
    const networkOnlyData = await api.http.get('/users', {
      cacheStrategy: CacheStrategy.NETWORK_ONLY
    })
    console.log('仅网络数据:', networkOnlyData.data)
    
  } catch (error) {
    console.error('缓存策略错误:', error.userMessage || error.message)
  }
}

/**
 * 重试策略示例
 */
export async function retryStrategyExamples() {
  console.log('=== 重试策略示例 ===')
  
  try {
    // 指数退避重试
    const data1 = await api.http.get('/unreliable-endpoint', {
      maxRetries: 3,
      retryStrategy: RetryStrategy.EXPONENTIAL_BACKOFF
    })
    console.log('指数退避重试成功:', data1.data)
    
    // 固定延迟重试
    const data2 = await api.http.get('/another-endpoint', {
      maxRetries: 2,
      retryStrategy: RetryStrategy.FIXED_DELAY
    })
    console.log('固定延迟重试成功:', data2.data)
    
    // 禁用重试
    const data3 = await api.http.get('/fast-fail-endpoint', {
      retry: false
    })
    console.log('无重试请求成功:', data3.data)
    
  } catch (error) {
    console.error('重试策略错误:', error.userMessage || error.message)
  }
}

/**
 * 用户服务示例
 */
export async function userServiceExamples() {
  console.log('=== 用户服务示例 ===')
  
  try {
    // 获取用户列表
    const userList = await api.user.getUsers({
      page: 1,
      pageSize: 20,
      keyword: '张'
    })
    console.log('用户列表:', userList.data)
    
    // 获取用户详情
    const userDetail = await api.user.getUserById(1)
    console.log('用户详情:', userDetail.data)
    
    // 创建用户
    const newUser = await api.user.createUser({
      name: '王五',
      email: 'wangwu@example.com',
      phone: '13800138000'
    })
    console.log('创建用户:', newUser.data)
    
    // 更新用户
    const updatedUser = await api.user.updateUser(1, {
      name: '王五五',
      phone: '13900139000'
    })
    console.log('更新用户:', updatedUser.data)
    
    // 上传头像
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = 'image/*'
    
    fileInput.onchange = async (event) => {
      const file = event.target.files[0]
      if (file) {
        const uploadResult = await api.user.uploadAvatar(1, file)
        console.log('头像上传:', uploadResult.data)
      }
    }
    
    // 批量删除用户
    const batchDeleteResult = await api.user.batchDeleteUsers([2, 3, 4])
    console.log('批量删除:', batchDeleteResult.data)
    
  } catch (error) {
    console.error('用户服务错误:', error.userMessage || error.message)
  }
}

/**
 * 认证服务示例
 */
export async function authServiceExamples() {
  console.log('=== 认证服务示例 ===')
  
  try {
    // 用户登录
    const loginResult = await api.auth.login({
      username: 'admin@example.com',
      password: 'password123',
      rememberMe: true
    })
    console.log('登录结果:', loginResult.data)
    
    // 获取当前用户信息
    const currentUser = await api.auth.getCurrentUser()
    console.log('当前用户:', currentUser.data)
    
    // 更新用户信息
    const updateResult = await api.auth.updateCurrentUser({
      name: '管理员',
      phone: '13800138000'
    })
    console.log('更新结果:', updateResult.data)
    
    // 修改密码
    const changePasswordResult = await api.auth.changePassword({
      currentPassword: 'password123',
      newPassword: 'newpassword456'
    })
    console.log('密码修改:', changePasswordResult.data)
    
    // 刷新token
    const refreshResult = await api.auth.refreshToken()
    console.log('Token刷新:', refreshResult.data)
    
    // 用户登出
    const logoutResult = await api.auth.logout()
    console.log('登出结果:', logoutResult.data)
    
  } catch (error) {
    console.error('认证服务错误:', error.userMessage || error.message)
  }
}

/**
 * 文件上传下载示例
 */
export async function fileOperationExamples() {
  console.log('=== 文件操作示例 ===')
  
  try {
    // 文件上传
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.multiple = true
    
    fileInput.onchange = async (event) => {
      const files = Array.from(event.target.files)
      
      for (const file of files) {
        const uploadResult = await api.http.upload('/files/upload', file, {
          category: 'documents'
        }, {
          onProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            console.log(`上传进度: ${file.name} ${percent}%`)
          }
        })
        console.log('文件上传成功:', uploadResult.data)
      }
    }
    
    // 文件下载
    const downloadResponse = await api.http.download('/files/download/123', {
      format: 'pdf'
    }, {
      onProgress: (progressEvent) => {
        if (progressEvent.lengthComputable) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          console.log(`下载进度: ${percent}%`)
        }
      }
    })
    
    // 创建下载链接
    const blob = new Blob([downloadResponse.data])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'downloaded-file.pdf'
    link.click()
    window.URL.revokeObjectURL(url)
    
  } catch (error) {
    console.error('文件操作错误:', error.userMessage || error.message)
  }
}

/**
 * 批量请求示例
 */
export async function batchRequestExamples() {
  console.log('=== 批量请求示例 ===')
  
  try {
    // 并行请求
    const parallelResults = await api.http.all([
      api.user.getUsers({ page: 1 }),
      api.user.getUserStats(),
      api.auth.getCurrentUser()
    ])
    console.log('并行请求结果:', parallelResults.map(r => r.data))
    
    // 并发控制的批量请求
    const batchOperations = [
      { method: 'GET', endpoint: '/users', params: { page: 1 } },
      { method: 'GET', endpoint: '/users', params: { page: 2 } },
      { method: 'GET', endpoint: '/users', params: { page: 3 } },
      { method: 'POST', endpoint: '/users', data: { name: 'Test1' } },
      { method: 'POST', endpoint: '/users', data: { name: 'Test2' } }
    ]
    
    const batchResults = await api.user.batch(batchOperations)
    console.log('批量操作结果:', batchResults)
    
  } catch (error) {
    console.error('批量请求错误:', error.userMessage || error.message)
  }
}

/**
 * 错误处理示例
 */
export async function errorHandlingExamples() {
  console.log('=== 错误处理示例 ===')
  
  // 监听全局错误事件
  window.addEventListener('http:error', (event) => {
    const { error, type, context } = event.detail
    console.log(`全局错误 [${type}] ${context}:`, error.userMessage)
  })
  
  // 监听认证事件
  window.addEventListener('auth:unauthorized', () => {
    console.log('用户未授权，需要重新登录')
  })
  
  window.addEventListener('auth:forbidden', () => {
    console.log('权限不足，无法访问')
  })
  
  window.addEventListener('network:error', () => {
    console.log('网络连接错误')
  })
  
  try {
    // 模拟各种错误
    await api.http.get('/non-existent-endpoint')
  } catch (error) {
    console.log('404错误:', error.userMessage)
  }
  
  try {
    await api.http.post('/protected-endpoint', {})
  } catch (error) {
    console.log('认证错误:', error.userMessage)
  }
}

/**
 * 性能监控示例
 */
export async function performanceMonitoringExamples() {
  console.log('=== 性能监控示例 ===')
  
  // 获取缓存统计
  const cacheStats = api.http.getCacheStats()
  console.log('缓存统计:', cacheStats)
  
  // 获取错误统计
  const errorStats = api.http.getErrorStats()
  console.log('错误统计:', errorStats)
  
  // 获取所有API服务统计
  const allStats = api.getStats()
  console.log('所有服务统计:', allStats)
  
  // 清除缓存
  api.clearCaches()
  console.log('已清除所有缓存')
}

/**
 * 运行所有示例
 */
export async function runAllExamples() {
  console.log('开始运行API使用示例...')
  
  await basicHttpExamples()
  await cacheStrategyExamples()
  await retryStrategyExamples()
  await userServiceExamples()
  await authServiceExamples()
  await fileOperationExamples()
  await batchRequestExamples()
  await errorHandlingExamples()
  await performanceMonitoringExamples()
  
  console.log('所有示例运行完成!')
}

// 如果直接运行此文件，执行所有示例
if (typeof window !== 'undefined') {
  // 在浏览器环境中，可以通过控制台调用
  window.apiExamples = {
    runAll: runAllExamples,
    basic: basicHttpExamples,
    cache: cacheStrategyExamples,
    retry: retryStrategyExamples,
    user: userServiceExamples,
    auth: authServiceExamples,
    file: fileOperationExamples,
    batch: batchRequestExamples,
    error: errorHandlingExamples,
    performance: performanceMonitoringExamples
  }
  
  console.log('API示例已加载，使用 window.apiExamples.runAll() 运行所有示例')
}
