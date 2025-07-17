import axios from 'axios'
import { defaultCacheManager, CacheStrategy } from './CacheManager.js'
import { defaultErrorHandler, RetryStrategy } from './ErrorHandler.js'

/**
 * 全局HTTP服务配置
 * 提供统一的axios实例和请求方法
 */

// 正在进行的请求Map（防止重复请求）
const pendingRequests = new Map()

// 网络状态检测
let isOnline = navigator.onLine
window.addEventListener('online', () => { isOnline = true })
window.addEventListener('offline', () => { isOnline = false })

/**
 * 创建axios实例
 */
const createAxiosInstance = (baseConfig = {}) => {
  const defaultConfig = {
    timeout: 30000,
    maxRedirects: 5,
    validateStatus: (status) => status < 500,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }

  const instance = axios.create({ ...defaultConfig, ...baseConfig })

  // 请求拦截器
  instance.interceptors.request.use(
    (config) => {
      // 添加请求元数据
      config.metadata = { 
        startTime: Date.now(),
        requestId: generateRequestId()
      }
      
      // 网络状态检查
      if (!isOnline) {
        return Promise.reject(new Error('网络连接不可用'))
      }

      // 自动添加认证token
      const token = getAuthToken()
      if (token && !config.headers.Authorization) {
        // config.headers.Authorization = `Bearer ${token}`
        config.headers.zy_token = token
        config.headers['access-token'] = token
      }

      // 防重复请求
      const requestKey = generateRequestKey(config)
      if (pendingRequests.has(requestKey)) {
        const cancelToken = axios.CancelToken.source()
        cancelToken.cancel('重复请求已取消')
        config.cancelToken = cancelToken.token
      } else {
        pendingRequests.set(requestKey, config.metadata.requestId)
      }

      // console.log(`[HTTP] ${config.method?.toUpperCase()} ${config.url} [${config.metadata.requestId}]`)
      return config
    },
    (error) => {
      console.error('[HTTP Request Error]', error)
      return Promise.reject(error)
    }
  )

  // 响应拦截器
  instance.interceptors.response.use(
    (response) => {
      const { config } = response
      const duration = Date.now() - config.metadata.startTime
      
      // 清除pending请求
      const requestKey = generateRequestKey(config)
      pendingRequests.delete(requestKey)

      // 添加响应元数据
      response.metadata = {
        duration,
        requestId: config.metadata.requestId,
        timestamp: new Date().toISOString(),
        cached: false
      }

      console.log(`[HTTP] ${response.status} ${duration}ms [${config.metadata.requestId}]`)
      return response
    },
    async (error) => {
      const { config } = error
      const duration = config?.metadata ? Date.now() - config.metadata.startTime : 0
      const requestId = config?.metadata?.requestId || 'unknown'
      
      // 清除pending请求
      if (config) {
        const requestKey = generateRequestKey(config)
        pendingRequests.delete(requestKey)
      }

      // 错误重试逻辑
      if (shouldRetry(error) && (!config._retryCount || config._retryCount < 3)) {
        config._retryCount = (config._retryCount || 0) + 1
        console.log(`[HTTP] 重试请求 ${config._retryCount}/3 [${requestId}]`)
        
        // 指数退避延迟
        const delay = Math.pow(2, config._retryCount) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
        
        return instance(config)
      }

      // 统一错误处理
      handleGlobalError(error, requestId, duration)
      
      return Promise.reject(error)
    }
  )

  return instance
}

/**
 * 生成请求ID
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

/**
 * 生成请求唯一键
 */
function generateRequestKey(config) {
  const { method, url, params, data } = config
  return `${method}_${url}_${JSON.stringify(params || {})}_${JSON.stringify(data || {})}`
}

/**
 * 获取认证token
 */
function getAuthToken() {
  return localStorage.getItem('zy_token') || 
         sessionStorage.getItem('zy_token') ||
         localStorage.getItem('access_token') ||
         sessionStorage.getItem('access_token')
}

/**
 * 判断是否应该重试
 */
function shouldRetry(error) {
  if (axios.isCancel(error)) return false
  
  // 网络错误或超时重试
  if (!error.response) return true
  
  // 5xx服务器错误重试
  if (error.response.status >= 500) return true
  
  // 429 请求过多重试
  if (error.response.status === 429) return true
  
  return false
}

/**
 * 全局错误处理
 */
function handleGlobalError(error, requestId, duration) {
  console.error(`[HTTP Error] ${requestId} ${duration}ms`, error.message)

  if (error.response) {
    const { status } = error.response
    
    switch (status) {
      case 401:
        // 清除认证信息
        localStorage.removeItem('zy_token')
        sessionStorage.removeItem('zy_token')
        localStorage.removeItem('access_token')
        sessionStorage.removeItem('access_token')
        
        // 触发全局事件，通知应用处理未授权
        window.dispatchEvent(new CustomEvent('auth:unauthorized'))
        break
        
      case 403:
        window.dispatchEvent(new CustomEvent('auth:forbidden'))
        break
        
      case 404:
        console.warn('[HTTP] 资源不存在')
        break
        
      case 429:
        console.warn('[HTTP] 请求过于频繁')
        break
        
      default:
        if (status >= 500) {
          console.error('[HTTP] 服务器内部错误')
        }
    }
  } else if (error.request) {
    console.error('[HTTP] 网络连接错误')
    window.dispatchEvent(new CustomEvent('network:error'))
  }
}

// 创建默认实例
const defaultInstance = createAxiosInstance()

/**
 * 全局HTTP服务类
 */
class GlobalHttpService {
  constructor(customConfig = {}) {
    this.instance = createAxiosInstance(customConfig)
    this.cacheManager = defaultCacheManager
    this.errorHandler = defaultErrorHandler
    this.cacheEnabled = true
    this.retryEnabled = true
    this.defaultCacheTime = 5 * 60 * 1000 // 5分钟
    this.defaultCacheStrategy = CacheStrategy.CACHE_FIRST
    this.defaultRetryStrategy = RetryStrategy.EXPONENTIAL_BACKOFF
  }

  /**
   * 设置基础URL
   */
  setBaseURL(baseURL) {
    this.instance.defaults.baseURL = baseURL
    return this
  }

  /**
   * 设置默认headers
   */
  setHeaders(headers) {
    Object.assign(this.instance.defaults.headers, headers)
    return this
  }

  /**
   * 启用/禁用缓存
   */
  setCacheEnabled(enabled) {
    this.cacheEnabled = enabled
    return this
  }

  /**
   * 设置缓存管理器
   */
  setCacheManager(cacheManager) {
    this.cacheManager = cacheManager
    return this
  }

  /**
   * 设置缓存策略
   */
  setCacheStrategy(strategy) {
    this.defaultCacheStrategy = strategy
    return this
  }

  /**
   * 设置错误处理器
   */
  setErrorHandler(errorHandler) {
    this.errorHandler = errorHandler
    return this
  }

  /**
   * 设置重试策略
   */
  setRetryStrategy(strategy) {
    this.defaultRetryStrategy = strategy
    return this
  }

  /**
   * 启用/禁用重试
   */
  setRetryEnabled(enabled) {
    this.retryEnabled = enabled
    return this
  }

  /**
   * 清除所有缓存
   */
  clearCache() {
    this.cacheManager.clear()
    return this
  }

  /**
   * 清除指定缓存
   */
  clearCacheByKey(key) {
    this.cacheManager.delete(key)
    return this
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return this.cacheManager.getStats()
  }

  /**
   * 获取错误统计
   */
  getErrorStats() {
    return this.errorHandler.getErrorStats()
  }

  /**
   * 清除所有统计
   */
  clearStats() {
    this.errorHandler.clearStats()
    return this
  }

  /**
   * 执行带缓存策略的请求
   */
  async requestWithCache(method, url, data, config = {}) {
    const {
      cacheStrategy = this.defaultCacheStrategy,
      cacheTime = this.defaultCacheTime,
      ...requestConfig
    } = config

    // 生成缓存键
    const cacheKey = this.cacheManager.generateKey(method, url, requestConfig.params, data)

    // 根据缓存策略处理请求
    switch (cacheStrategy) {
      case CacheStrategy.CACHE_ONLY:
        return this.getCachedResponse(cacheKey) ||
               Promise.reject(new Error('缓存中没有找到数据'))

      case CacheStrategy.NETWORK_ONLY:
        return this.executeRequest(method, url, data, requestConfig)

      case CacheStrategy.CACHE_FIRST:
        const cached = this.getCachedResponse(cacheKey)
        if (cached) return cached

        const response = await this.executeRequest(method, url, data, requestConfig)
        if (method.toUpperCase() === 'GET' && response.status === 200) {
          this.setCachedResponse(cacheKey, response, cacheTime)
        }
        return response

      case CacheStrategy.NETWORK_FIRST:
        try {
          const response = await this.executeRequest(method, url, data, requestConfig)
          if (method.toUpperCase() === 'GET' && response.status === 200) {
            this.setCachedResponse(cacheKey, response, cacheTime)
          }
          return response
        } catch (error) {
          const cached = this.getCachedResponse(cacheKey)
          if (cached) {
            console.log(`[HTTP] 网络请求失败，返回缓存数据 ${url}`)
            return cached
          }
          throw error
        }

      default:
        return this.executeRequest(method, url, data, requestConfig)
    }
  }

  /**
   * 执行实际的HTTP请求
   */
  async executeRequest(method, url, data, config) {
    const requestFn = () => {
      switch (method.toUpperCase()) {
        case 'GET':
          return this.instance.get(url, config)
        case 'POST':
          return this.instance.post(url, data, config)
        case 'PUT':
          return this.instance.put(url, data, config)
        case 'PATCH':
          return this.instance.patch(url, data, config)
        case 'DELETE':
          return this.instance.delete(url, config)
        default:
          throw new Error(`不支持的请求方法: ${method}`)
      }
    }

    // 如果启用重试，使用错误处理器执行请求
    if (this.retryEnabled && config.retry !== false) {
      const retryConfig = {
        maxRetries: config.maxRetries,
        retryStrategy: config.retryStrategy || this.defaultRetryStrategy,
        requestId: config.requestId
      }

      return this.errorHandler.executeWithRetry(requestFn, retryConfig)
    }

    // 否则直接执行请求
    try {
      return await requestFn()
    } catch (error) {
      // 仍然需要处理全局错误
      this.errorHandler.handleGlobalError(error, `${method} ${url}`)
      throw this.errorHandler.enhanceError(error, { method, url })
    }
  }

  /**
   * 获取缓存的响应
   */
  getCachedResponse(cacheKey) {
    const cached = this.cacheManager.get(cacheKey)
    if (cached) {
      return { ...cached, metadata: { ...cached.metadata, cached: true } }
    }
    return null
  }

  /**
   * 缓存响应
   */
  setCachedResponse(cacheKey, response, cacheTime = this.defaultCacheTime) {
    this.cacheManager.set(cacheKey, response, cacheTime)
  }

  /**
   * GET请求
   */
  async get(url, config = {}) {
    try {
      return await this.requestWithCache('GET', url, null, config)
    } catch (error) {
      throw this.enhanceError(error, 'GET', url)
    }
  }

  /**
   * POST请求
   */
  async post(url, data = {}, config = {}) {
    try {
      const response = await this.instance.post(url, data, config)
      return response
    } catch (error) {
      throw this.enhanceError(error, 'POST', url)
    }
  }

  /**
   * PUT请求
   */
  async put(url, data = {}, config = {}) {
    try {
      const response = await this.instance.put(url, data, config)
      return response
    } catch (error) {
      throw this.enhanceError(error, 'PUT', url)
    }
  }

  /**
   * PATCH请求
   */
  async patch(url, data = {}, config = {}) {
    try {
      const response = await this.instance.patch(url, data, config)
      return response
    } catch (error) {
      throw this.enhanceError(error, 'PATCH', url)
    }
  }

  /**
   * DELETE请求
   */
  async delete(url, config = {}) {
    try {
      const response = await this.instance.delete(url, config)
      return response
    } catch (error) {
      throw this.enhanceError(error, 'DELETE', url)
    }
  }

  /**
   * 上传文件
   */
  async upload(url, formData, config = {}) {
    const uploadConfig = {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config.headers
      },
      onUploadProgress: config.onProgress || ((progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        console.log(`[HTTP Upload] ${percentCompleted}%`)
      })
    }

    try {
      const response = await this.instance.post(url, formData, uploadConfig)
      return response
    } catch (error) {
      throw this.enhanceError(error, 'UPLOAD', url)
    }
  }

  /**
   * 下载文件
   */
  async download(url, config = {}) {
    const downloadConfig = {
      ...config,
      responseType: 'blob',
      onDownloadProgress: config.onProgress || ((progressEvent) => {
        if (progressEvent.lengthComputable) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          console.log(`[HTTP Download] ${percentCompleted}%`)
        }
      })
    }

    try {
      const response = await this.instance.get(url, downloadConfig)
      return response
    } catch (error) {
      throw this.enhanceError(error, 'DOWNLOAD', url)
    }
  }

  /**
   * 增强错误信息
   */
  enhanceError(error, method, url) {
    if (error.response) {
      error.message = `${method} ${url} failed with status ${error.response.status}: ${error.response.statusText}`
    } else if (error.request) {
      error.message = `${method} ${url} failed: Network Error`
    } else {
      error.message = `${method} ${url} failed: ${error.message}`
    }
    return error
  }

  /**
   * 批量请求
   */
  async all(requests) {
    try {
      const responses = await Promise.all(requests.map(req => {
        if (typeof req === 'function') {
          return req()
        }
        return req
      }))
      return responses
    } catch (error) {
      console.error('[HTTP Batch] 批量请求失败', error)
      throw error
    }
  }

  /**
   * 并发控制的批量请求
   */
  async allSettled(requests, concurrency = 5) {
    const results = []
    const executing = []

    for (const request of requests) {
      const promise = Promise.resolve(
        typeof request === 'function' ? request() : request
      ).then(
        value => ({ status: 'fulfilled', value }),
        reason => ({ status: 'rejected', reason })
      )

      results.push(promise)

      if (requests.length >= concurrency) {
        executing.push(promise)

        if (executing.length >= concurrency) {
          await Promise.race(executing)
          executing.splice(executing.findIndex(p => p === promise), 1)
        }
      }
    }

    return Promise.all(results)
  }
}

export { GlobalHttpService, createAxiosInstance }
export default defaultInstance
