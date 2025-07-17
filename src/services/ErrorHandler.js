/**
 * 错误处理和重试管理器
 * 提供智能错误处理、重试策略和网络状态监控
 */

// 错误类型枚举
export const ErrorType = {
  NETWORK_ERROR: 'network_error',
  TIMEOUT_ERROR: 'timeout_error',
  SERVER_ERROR: 'server_error',
  CLIENT_ERROR: 'client_error',
  AUTHENTICATION_ERROR: 'authentication_error',
  AUTHORIZATION_ERROR: 'authorization_error',
  VALIDATION_ERROR: 'validation_error',
  RATE_LIMIT_ERROR: 'rate_limit_error',
  UNKNOWN_ERROR: 'unknown_error'
}

// 重试策略枚举
export const RetryStrategy = {
  NONE: 'none',
  FIXED_DELAY: 'fixed_delay',
  EXPONENTIAL_BACKOFF: 'exponential_backoff',
  LINEAR_BACKOFF: 'linear_backoff'
}

/**
 * 错误处理器类
 */
export class ErrorHandler {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3
    this.retryStrategy = options.retryStrategy || RetryStrategy.EXPONENTIAL_BACKOFF
    this.baseDelay = options.baseDelay || 1000
    this.maxDelay = options.maxDelay || 30000
    this.retryableErrors = options.retryableErrors || [
      ErrorType.NETWORK_ERROR,
      ErrorType.TIMEOUT_ERROR,
      ErrorType.SERVER_ERROR,
      ErrorType.RATE_LIMIT_ERROR
    ]
    
    // 错误统计
    this.errorStats = new Map()
    this.retryStats = new Map()
    
    // 网络状态监控
    this.isOnline = navigator.onLine
    this.setupNetworkMonitoring()
  }

  /**
   * 设置网络状态监控
   */
  setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      this.isOnline = true
      console.log('[Network] 网络连接已恢复')
      this.dispatchNetworkEvent('online')
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      console.log('[Network] 网络连接已断开')
      this.dispatchNetworkEvent('offline')
    })
  }

  /**
   * 分发网络事件
   */
  dispatchNetworkEvent(type) {
    window.dispatchEvent(new CustomEvent(`network:${type}`, {
      detail: { isOnline: this.isOnline, timestamp: Date.now() }
    }))
  }

  /**
   * 分类错误类型
   */
  classifyError(error) {
    if (!error.response) {
      // 网络错误或请求未发出
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return ErrorType.TIMEOUT_ERROR
      }
      return ErrorType.NETWORK_ERROR
    }

    const status = error.response.status

    if (status === 401) return ErrorType.AUTHENTICATION_ERROR
    if (status === 403) return ErrorType.AUTHORIZATION_ERROR
    if (status === 422) return ErrorType.VALIDATION_ERROR
    if (status === 429) return ErrorType.RATE_LIMIT_ERROR
    if (status >= 400 && status < 500) return ErrorType.CLIENT_ERROR
    if (status >= 500) return ErrorType.SERVER_ERROR

    return ErrorType.UNKNOWN_ERROR
  }

  /**
   * 判断错误是否可重试
   */
  isRetryableError(error) {
    const errorType = this.classifyError(error)
    return this.retryableErrors.includes(errorType)
  }

  /**
   * 计算重试延迟
   */
  calculateRetryDelay(attempt) {
    let delay

    switch (this.retryStrategy) {
      case RetryStrategy.FIXED_DELAY:
        delay = this.baseDelay
        break

      case RetryStrategy.LINEAR_BACKOFF:
        delay = this.baseDelay * attempt
        break

      case RetryStrategy.EXPONENTIAL_BACKOFF:
        delay = this.baseDelay * Math.pow(2, attempt - 1)
        break

      default:
        delay = this.baseDelay
    }

    // 添加随机抖动，避免雷群效应
    const jitter = Math.random() * 0.1 * delay
    delay += jitter

    return Math.min(delay, this.maxDelay)
  }

  /**
   * 执行重试
   */
  async executeWithRetry(requestFn, config = {}) {
    const maxRetries = config.maxRetries || this.maxRetries
    const requestId = config.requestId || `retry_${Date.now()}`
    
    let lastError
    let attempt = 0

    while (attempt <= maxRetries) {
      try {
        if (attempt > 0) {
          console.log(`[Retry] 第 ${attempt} 次重试 [${requestId}]`)
        }

        const result = await requestFn()
        
        // 记录成功统计
        if (attempt > 0) {
          this.recordRetrySuccess(requestId, attempt)
        }
        
        return result

      } catch (error) {
        lastError = error
        attempt++

        // 记录错误统计
        this.recordError(error, requestId)

        // 检查是否应该重试
        if (attempt > maxRetries || !this.isRetryableError(error)) {
          break
        }

        // 网络断开时不重试
        if (!this.isOnline) {
          console.log(`[Retry] 网络断开，停止重试 [${requestId}]`)
          break
        }

        // 计算延迟并等待
        const delay = this.calculateRetryDelay(attempt)
        console.log(`[Retry] 等待 ${delay}ms 后重试 [${requestId}]`)
        await this.sleep(delay)
      }
    }

    // 记录重试失败
    this.recordRetryFailure(requestId, attempt - 1)
    throw this.enhanceError(lastError, { requestId, totalAttempts: attempt })
  }

  /**
   * 增强错误信息
   */
  enhanceError(error, metadata = {}) {
    const errorType = this.classifyError(error)
    const enhancedError = new Error(error.message)
    
    // 复制原始错误属性
    Object.assign(enhancedError, error)
    
    // 添加增强信息
    enhancedError.type = errorType
    enhancedError.metadata = {
      ...metadata,
      timestamp: new Date().toISOString(),
      isOnline: this.isOnline,
      userAgent: navigator.userAgent
    }

    // 添加用户友好的错误消息
    enhancedError.userMessage = this.getUserFriendlyMessage(errorType, error)

    return enhancedError
  }

  /**
   * 获取用户友好的错误消息
   */
  getUserFriendlyMessage(errorType, error) {
    const messages = {
      [ErrorType.NETWORK_ERROR]: '网络连接失败，请检查网络设置',
      [ErrorType.TIMEOUT_ERROR]: '请求超时，请稍后重试',
      [ErrorType.SERVER_ERROR]: '服务器暂时不可用，请稍后重试',
      [ErrorType.AUTHENTICATION_ERROR]: '身份验证失败，请重新登录',
      [ErrorType.AUTHORIZATION_ERROR]: '权限不足，无法访问该资源',
      [ErrorType.VALIDATION_ERROR]: '请求数据格式错误',
      [ErrorType.RATE_LIMIT_ERROR]: '请求过于频繁，请稍后重试',
      [ErrorType.CLIENT_ERROR]: '请求错误',
      [ErrorType.UNKNOWN_ERROR]: '未知错误'
    }

    let message = messages[errorType] || messages[ErrorType.UNKNOWN_ERROR]

    // 尝试从响应中获取更具体的错误信息
    if (error.response?.data?.message) {
      message = error.response.data.message
    } else if (error.response?.data?.error) {
      message = error.response.data.error
    }

    return message
  }

  /**
   * 记录错误统计
   */
  recordError(error, requestId) {
    const errorType = this.classifyError(error)
    const stats = this.errorStats.get(errorType) || { count: 0, lastOccurred: null }
    
    stats.count++
    stats.lastOccurred = Date.now()
    
    this.errorStats.set(errorType, stats)
    console.log(`[Error Stats] ${errorType}: ${stats.count} 次`)
  }

  /**
   * 记录重试成功
   */
  recordRetrySuccess(requestId, attempts) {
    const stats = this.retryStats.get('success') || { count: 0, totalAttempts: 0 }
    stats.count++
    stats.totalAttempts += attempts
    this.retryStats.set('success', stats)
  }

  /**
   * 记录重试失败
   */
  recordRetryFailure(requestId, attempts) {
    const stats = this.retryStats.get('failure') || { count: 0, totalAttempts: 0 }
    stats.count++
    stats.totalAttempts += attempts
    this.retryStats.set('failure', stats)
  }

  /**
   * 获取错误统计
   */
  getErrorStats() {
    return {
      errors: Object.fromEntries(this.errorStats),
      retries: Object.fromEntries(this.retryStats),
      networkStatus: {
        isOnline: this.isOnline,
        lastCheck: Date.now()
      }
    }
  }

  /**
   * 清除统计数据
   */
  clearStats() {
    this.errorStats.clear()
    this.retryStats.clear()
  }

  /**
   * 睡眠函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 全局错误处理器
   */
  handleGlobalError(error, context = '') {
    const errorType = this.classifyError(error)
    
    // 触发全局错误事件
    window.dispatchEvent(new CustomEvent('http:error', {
      detail: {
        error: this.enhanceError(error, { context }),
        type: errorType,
        context
      }
    }))

    // 特殊错误处理
    switch (errorType) {
      case ErrorType.AUTHENTICATION_ERROR:
        this.handleAuthenticationError()
        break
      case ErrorType.AUTHORIZATION_ERROR:
        this.handleAuthorizationError()
        break
      case ErrorType.RATE_LIMIT_ERROR:
        this.handleRateLimitError(error)
        break
    }
  }

  /**
   * 处理认证错误
   */
  handleAuthenticationError() {
    // 清除认证信息
    ['zy_token', 'access_token', 'refresh_token', 'auth_token'].forEach(key => {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    })

    // 触发认证失败事件
    window.dispatchEvent(new CustomEvent('auth:unauthorized'))
  }

  /**
   * 处理授权错误
   */
  handleAuthorizationError() {
    window.dispatchEvent(new CustomEvent('auth:forbidden'))
  }

  /**
   * 处理限流错误
   */
  handleRateLimitError(error) {
    const retryAfter = error.response?.headers['retry-after']
    window.dispatchEvent(new CustomEvent('http:rate-limit', {
      detail: { retryAfter }
    }))
  }
}

// 创建默认错误处理器实例
export const defaultErrorHandler = new ErrorHandler({
  maxRetries: 3,
  retryStrategy: RetryStrategy.EXPONENTIAL_BACKOFF,
  baseDelay: 1000,
  maxDelay: 30000
})
