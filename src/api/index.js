/**
 * API服务统一导出和配置
 * 提供全局API配置和服务实例管理
 */

import { GlobalHttpService, createAxiosInstance } from '../services/globalHttpService.js'
import { BaseApiService } from '../services/BaseApiService.js'
import { CacheStrategy } from '../services/CacheManager.js'
import { RetryStrategy } from '../services/ErrorHandler.js'

// 导入具体的API服务
import { userService } from './UserService.js'
import { authService } from './AuthService.js'
import { commonService } from './CommonService.js'

/**
 * API配置
 */
export const apiConfig = {
  // 基础配置
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  
  // 缓存配置
  cache: {
    enabled: true,
    defaultTTL: 5 * 60 * 1000, // 5分钟
    maxSize: 200,
    strategy: CacheStrategy.CACHE_FIRST
  },
  
  // 重试配置
  retry: {
    enabled: true,
    maxRetries: 3,
    strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
    baseDelay: 1000,
    maxDelay: 30000
  },
  
  // 请求头配置
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
}

/**
 * 创建配置好的HTTP服务实例
 */
export function createHttpService(customConfig = {}) {
  const config = {
    baseURL: apiConfig.baseURL,
    timeout: apiConfig.timeout,
    headers: apiConfig.headers,
    ...customConfig
  }
  
  const service = new GlobalHttpService(config)
  
  // 应用缓存配置
  if (apiConfig.cache.enabled) {
    service.setCacheEnabled(true)
    service.setCacheStrategy(apiConfig.cache.strategy)
  }
  
  // 应用重试配置
  if (apiConfig.retry.enabled) {
    service.setRetryEnabled(true)
    service.setRetryStrategy(apiConfig.retry.strategy)
  }
  
  return service
}

/**
 * 创建API服务基类实例
 */
export function createApiService(endpoint, customConfig = {}) {
  const config = {
    timeout: apiConfig.timeout,
    cacheTime: apiConfig.cache.defaultTTL,
    ...customConfig
  }
  
  return new BaseApiService(`${apiConfig.baseURL}${endpoint}`, config)
}

/**
 * API服务工厂
 * 用于动态创建API服务实例
 */
export class ApiServiceFactory {
  constructor() {
    this.services = new Map()
    this.defaultConfig = { ...apiConfig }
  }
  
  /**
   * 设置默认配置
   */
  setDefaultConfig(config) {
    Object.assign(this.defaultConfig, config)
    return this
  }
  
  /**
   * 创建或获取API服务
   */
  getService(name, endpoint, customConfig = {}) {
    if (this.services.has(name)) {
      return this.services.get(name)
    }
    
    const service = createApiService(endpoint, customConfig)
    this.services.set(name, service)
    
    return service
  }
  
  /**
   * 注册API服务
   */
  registerService(name, service) {
    this.services.set(name, service)
    return this
  }
  
  /**
   * 获取所有服务
   */
  getAllServices() {
    return Object.fromEntries(this.services)
  }
  
  /**
   * 清除所有服务缓存
   */
  clearAllCaches() {
    for (const service of this.services.values()) {
      if (service.http && typeof service.http.clearCache === 'function') {
        service.http.clearCache()
      }
    }
  }
  
  /**
   * 获取所有服务统计
   */
  getAllStats() {
    const stats = {}
    
    for (const [name, service] of this.services) {
      if (service.http) {
        stats[name] = {
          cache: service.http.getCacheStats?.() || {},
          errors: service.http.getErrorStats?.() || {}
        }
      }
    }
    
    return stats
  }
}

// 创建默认工厂实例
export const apiFactory = new ApiServiceFactory()

// 注册默认服务
apiFactory.registerService('user', userService)
apiFactory.registerService('auth', authService)
apiFactory.registerService('common', commonService)

/**
 * 全局API配置方法
 */
export function configureApi(config) {
  Object.assign(apiConfig, config)
  
  // 更新工厂默认配置
  apiFactory.setDefaultConfig(apiConfig)
  
  // 更新已注册服务的配置
  for (const service of apiFactory.services.values()) {
    if (service.http) {
      if (config.baseURL) {
        service.http.setBaseURL(config.baseURL)
      }
      if (config.headers) {
        service.http.setHeaders(config.headers)
      }
      if (config.cache) {
        service.http.setCacheEnabled(config.cache.enabled)
        service.http.setCacheStrategy(config.cache.strategy)
      }
      if (config.retry) {
        service.http.setRetryEnabled(config.retry.enabled)
        service.http.setRetryStrategy(config.retry.strategy)
      }
    }
  }
}

/**
 * 设置全局认证token
 */
export function setAuthToken(token, type = 'Bearer') {
  const authHeader = `${type} ${token}`
  
  // 更新全局配置
  apiConfig.headers.Authorization = authHeader
  
  // 更新所有服务
  for (const service of apiFactory.services.values()) {
    if (service.http && typeof service.http.setHeaders === 'function') {
      service.http.setHeaders({ Authorization: authHeader })
    }
  }
}

/**
 * 清除全局认证token
 */
export function clearAuthToken() {
  delete apiConfig.headers.Authorization
  
  // 清除所有服务的认证头
  for (const service of apiFactory.services.values()) {
    if (service.http && typeof service.http.setHeaders === 'function') {
      service.http.setHeaders({ Authorization: '' })
    }
  }
}

/**
 * 创建默认HTTP服务实例
 */
export const httpService = createHttpService()

/**
 * 导出所有API服务
 */
export const api = {
  // HTTP服务
  http: httpService,
  
  // 具体业务服务
  user: userService,
  auth: authService,
  common: commonService,
  
  // 工厂方法
  factory: apiFactory,
  
  // 配置方法
  configure: configureApi,
  setAuthToken,
  clearAuthToken,
  
  // 统计方法
  getStats: () => apiFactory.getAllStats(),
  clearCaches: () => apiFactory.clearAllCaches()
}

// 默认导出
export default api

/**
 * 使用示例：
 * 
 * // 基础使用
 * import api from '@/api'
 * 
 * // 使用具体服务
 * const users = await api.user.getUsers()
 * const loginResult = await api.auth.login({ username, password })
 * 
 * // 使用HTTP服务
 * const response = await api.http.get('/custom-endpoint')
 * 
 * // 配置API
 * api.configure({
 *   baseURL: 'https://api.example.com',
 *   headers: { 'X-Custom-Header': 'value' }
 * })
 * 
 * // 设置认证
 * api.setAuthToken('your-token')
 * 
 * // 创建自定义服务
 * const customService = api.factory.getService('custom', '/custom')
 * 
 * // 获取统计信息
 * const stats = api.getStats()
 * console.log('API统计:', stats)
 */
