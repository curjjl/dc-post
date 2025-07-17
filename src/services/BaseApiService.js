import { GlobalHttpService } from './globalHttpService.js'

/**
 * API服务基类
 * 提供统一的接口调用方式和通用功能
 */
export class BaseApiService {
  constructor(baseURL = '', customConfig = {}) {
    this.http = new GlobalHttpService(customConfig)
    
    if (baseURL) {
      this.http.setBaseURL(baseURL)
    }
    
    // 默认配置
    this.defaultConfig = {
      timeout: 30000,
      retries: 3,
      cacheTime: 5 * 60 * 1000, // 5分钟
      ...customConfig
    }
  }

  /**
   * 设置基础URL
   */
  setBaseURL(baseURL) {
    this.http.setBaseURL(baseURL)
    return this
  }

  /**
   * 设置默认headers
   */
  setHeaders(headers) {
    this.http.setHeaders(headers)
    return this
  }

  /**
   * 设置认证token
   */
  setAuthToken(token, type = 'Bearer') {
    this.http.setHeaders({
      'Authorization': `${type} ${token}`
    })
    return this
  }

  /**
   * 构建完整的URL
   */
  buildUrl(endpoint, params = {}) {
    let url = endpoint
    
    // 替换路径参数 /users/:id -> /users/123
    Object.keys(params).forEach(key => {
      const placeholder = `:${key}`
      if (url.includes(placeholder)) {
        url = url.replace(placeholder, params[key])
        delete params[key]
      }
    })
    
    return url
  }

  /**
   * 处理查询参数
   */
  buildQueryParams(params = {}) {
    const queryParams = {}
    
    Object.keys(params).forEach(key => {
      const value = params[key]
      if (value !== null && value !== undefined && value !== '') {
        queryParams[key] = value
      }
    })
    
    return queryParams
  }

  /**
   * 标准化响应数据
   */
  normalizeResponse(response) {
    const { data, status, statusText, headers, metadata } = response
    
    return {
      data,
      status,
      statusText,
      headers,
      metadata,
      success: status >= 200 && status < 300,
      message: data?.message || statusText
    }
  }

  /**
   * 处理API错误
   */
  handleApiError(error, context = '') {
    const errorInfo = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      context,
      timestamp: new Date().toISOString()
    }

    // 记录错误日志
    console.error(`[API Error] ${context}`, errorInfo)

    // 根据错误类型返回友好的错误信息
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 400:
          return { ...errorInfo, userMessage: data?.message || '请求参数错误' }
        case 401:
          return { ...errorInfo, userMessage: '未授权，请重新登录' }
        case 403:
          return { ...errorInfo, userMessage: '权限不足' }
        case 404:
          return { ...errorInfo, userMessage: '请求的资源不存在' }
        case 422:
          return { ...errorInfo, userMessage: data?.message || '数据验证失败' }
        case 429:
          return { ...errorInfo, userMessage: '请求过于频繁，请稍后再试' }
        case 500:
          return { ...errorInfo, userMessage: '服务器内部错误' }
        case 502:
          return { ...errorInfo, userMessage: '网关错误' }
        case 503:
          return { ...errorInfo, userMessage: '服务暂时不可用' }
        default:
          return { ...errorInfo, userMessage: data?.message || '请求失败' }
      }
    } else if (error.request) {
      return { ...errorInfo, userMessage: '网络连接失败，请检查网络' }
    } else {
      return { ...errorInfo, userMessage: '请求配置错误' }
    }
  }

  /**
   * GET请求封装
   */
  async get(endpoint, params = {}, config = {}) {
    try {
      const url = this.buildUrl(endpoint, params)
      const queryParams = this.buildQueryParams(params)
      
      const response = await this.http.get(url, {
        params: queryParams,
        ...this.defaultConfig,
        ...config
      })
      
      return this.normalizeResponse(response)
    } catch (error) {
      throw this.handleApiError(error, `GET ${endpoint}`)
    }
  }

  /**
   * POST请求封装
   */
  async post(endpoint, data = {}, config = {}) {
    try {
      const url = this.buildUrl(endpoint)
      
      const response = await this.http.post(url, data, {
        ...this.defaultConfig,
        ...config
      })
      
      return this.normalizeResponse(response)
    } catch (error) {
      throw this.handleApiError(error, `POST ${endpoint}`)
    }
  }

  /**
   * PUT请求封装
   */
  async put(endpoint, data = {}, config = {}) {
    try {
      const url = this.buildUrl(endpoint)
      
      const response = await this.http.put(url, data, {
        ...this.defaultConfig,
        ...config
      })
      
      return this.normalizeResponse(response)
    } catch (error) {
      throw this.handleApiError(error, `PUT ${endpoint}`)
    }
  }

  /**
   * PATCH请求封装
   */
  async patch(endpoint, data = {}, config = {}) {
    try {
      const url = this.buildUrl(endpoint)
      
      const response = await this.http.patch(url, data, {
        ...this.defaultConfig,
        ...config
      })
      
      return this.normalizeResponse(response)
    } catch (error) {
      throw this.handleApiError(error, `PATCH ${endpoint}`)
    }
  }

  /**
   * DELETE请求封装
   */
  async delete(endpoint, params = {}, config = {}) {
    try {
      const url = this.buildUrl(endpoint, params)
      const queryParams = this.buildQueryParams(params)
      
      const response = await this.http.delete(url, {
        params: queryParams,
        ...this.defaultConfig,
        ...config
      })
      
      return this.normalizeResponse(response)
    } catch (error) {
      throw this.handleApiError(error, `DELETE ${endpoint}`)
    }
  }

  /**
   * 文件上传
   */
  async upload(endpoint, file, data = {}, config = {}) {
    try {
      const formData = new FormData()
      
      // 添加文件
      if (file instanceof File) {
        formData.append('file', file)
      } else if (Array.isArray(file)) {
        file.forEach((f, index) => {
          formData.append(`file_${index}`, f)
        })
      }
      
      // 添加其他数据
      Object.keys(data).forEach(key => {
        formData.append(key, data[key])
      })
      
      const response = await this.http.upload(endpoint, formData, {
        ...this.defaultConfig,
        ...config
      })
      
      return this.normalizeResponse(response)
    } catch (error) {
      throw this.handleApiError(error, `UPLOAD ${endpoint}`)
    }
  }

  /**
   * 文件下载
   */
  async download(endpoint, params = {}, config = {}) {
    try {
      const url = this.buildUrl(endpoint, params)
      const queryParams = this.buildQueryParams(params)
      
      const response = await this.http.download(url, {
        params: queryParams,
        ...this.defaultConfig,
        ...config
      })
      
      return response
    } catch (error) {
      throw this.handleApiError(error, `DOWNLOAD ${endpoint}`)
    }
  }

  /**
   * 分页查询
   */
  async paginate(endpoint, params = {}) {
    const { page = 1, pageSize = 20, ...otherParams } = params
    
    return this.get(endpoint, {
      page,
      pageSize,
      ...otherParams
    })
  }

  /**
   * 批量操作
   */
  async batch(operations) {
    try {
      const requests = operations.map(op => {
        const { method, endpoint, data, params, config } = op
        
        switch (method.toLowerCase()) {
          case 'get':
            return () => this.get(endpoint, params, config)
          case 'post':
            return () => this.post(endpoint, data, config)
          case 'put':
            return () => this.put(endpoint, data, config)
          case 'patch':
            return () => this.patch(endpoint, data, config)
          case 'delete':
            return () => this.delete(endpoint, params, config)
          default:
            throw new Error(`不支持的请求方法: ${method}`)
        }
      })
      
      return await this.http.allSettled(requests)
    } catch (error) {
      throw this.handleApiError(error, 'BATCH OPERATIONS')
    }
  }
}
