import axios from 'axios'

/**
 * HTTP请求服务类
 * 封装axios，提供API测试所需的功能
 */
class HttpService {
  constructor() {
    this.cancelTokenSource = null
  }

  /**
   * 发送HTTP请求
   * @param {Object} requestConfig 请求配置
   * @returns {Promise} 请求结果
   */
  async sendRequest(requestConfig) {
    const startTime = Date.now()
    
    try {
      // 取消之前的请求
      this.cancelPreviousRequest()
      
      // 创建新的取消令牌
      this.cancelTokenSource = axios.CancelToken.source()
      
      // 构建axios配置
      const axiosConfig = this.buildAxiosConfig(requestConfig)
      
      // 发送请求
      const response = await axios(axiosConfig)
      
      // 计算请求耗时
      const duration = Date.now() - startTime
      
      // 构建响应对象
      return this.buildResponse(response, duration)
      
    } catch (error) {
      const duration = Date.now() - startTime
      
      if (axios.isCancel(error)) {
        throw new Error('请求已取消')
      }
      
      // 处理错误响应
      return this.buildErrorResponse(error, duration)
    }
  }

  /**
   * 取消当前请求
   */
  cancelRequest() {
    if (this.cancelTokenSource) {
      this.cancelTokenSource.cancel('用户取消请求')
      this.cancelTokenSource = null
    }
  }

  /**
   * 取消之前的请求
   */
  cancelPreviousRequest() {
    if (this.cancelTokenSource) {
      this.cancelTokenSource.cancel('新请求开始')
    }
  }

  /**
   * 构建axios请求配置
   * @param {Object} requestConfig 请求配置
   * @returns {Object} axios配置
   */
  buildAxiosConfig(requestConfig) {
    // 使用requestUrl（已正确编码）或回退到url
    const targetUrl = requestConfig.requestUrl || requestConfig.url

    const config = {
      method: requestConfig.method.toLowerCase(),
      url: this.processUrl(targetUrl),
      timeout: 30000, // 30秒超时
      cancelToken: this.cancelTokenSource.token,
      validateStatus: () => true, // 不要自动抛出错误
      maxRedirects: 5,
      headers: {}
    }

    // 如果使用requestUrl，则不需要再处理Query参数（已包含在URL中）
    // 如果使用原始url，则需要处理Query参数
    if (!requestConfig.requestUrl && requestConfig.queryParams) {
      config.params = this.buildParams(requestConfig.queryParams)
    }

    // 处理Headers
    if (requestConfig.headers) {
      config.headers = this.buildHeaders(requestConfig.headers)
    }

    // 处理认证
    this.applyAuth(config, requestConfig.auth)

    // 处理请求体
    if (this.hasBody(requestConfig.method)) {
      this.applyBody(config, requestConfig.body)
    }

    return config
  }

  /**
   * 处理URL，支持环境变量替换
   * @param {string} url 原始URL
   * @returns {string} 处理后的URL
   */
  processUrl(url) {
    // 替换环境变量 {{variable}}
    return url.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      const envVars = JSON.parse(localStorage.getItem('api_env_variables') || '{}')
      return envVars[varName] || match
    })
  }

  /**
   * 构建查询参数
   * @param {Array} queryParams 参数数组
   * @returns {Object} 参数对象
   */
  buildParams(queryParams) {
    const params = {}
    queryParams.forEach(param => {
      if (param.enabled && param.key) {
        params[param.key] = param.value
      }
    })
    return params
  }

  /**
   * 构建请求头
   * @param {Array} headers 头部数组
   * @returns {Object} 头部对象
   */
  buildHeaders(headers) {
    const headerObj = {}
    headers.forEach(header => {
      if (header.enabled && header.key) {
        headerObj[header.key] = header.value
      }
    })
    return headerObj
  }

  /**
   * 应用认证配置
   * @param {Object} config axios配置
   * @param {Object} auth 认证配置
   */
  applyAuth(config, auth) {
    if (!auth || auth.type === 'none') return

    switch (auth.type) {
      case 'basic':
        if (auth.basic.username || auth.basic.password) {
          const credentials = btoa(`${auth.basic.username}:${auth.basic.password}`)
          config.headers.Authorization = `Basic ${credentials}`
        }
        break
        
      case 'bearer':
        if (auth.bearer.token) {
          config.headers.Authorization = `Bearer ${auth.bearer.token}`
        }
        break
        
      case 'oauth2':
        if (auth.oauth2.accessToken) {
          config.headers.Authorization = `Bearer ${auth.oauth2.accessToken}`
        }
        break
    }
  }

  /**
   * 应用请求体配置
   * @param {Object} config axios配置
   * @param {Object} body 请求体配置
   */
  applyBody(config, body) {
    if (!body) return

    switch (body.type) {
      case 'raw':
        config.data = body.raw
        break
        
      case 'form-data':
        const formData = new FormData()
        body.formData.forEach(item => {
          if (item.enabled && item.key) {
            if (item.type === 'file' && item.files && item.files.length > 0) {
              // 处理文件上传
              item.files.forEach(fileInfo => {
                if (fileInfo.originFileObj) {
                  formData.append(item.key, fileInfo.originFileObj, fileInfo.name)
                }
              })
            } else {
              // 处理普通文本字段
              formData.append(item.key, item.value || '')
            }
          }
        })
        config.data = formData
        // 让浏览器自动设置Content-Type，包含boundary
        delete config.headers['Content-Type']
        break
        
      case 'x-www-form-urlencoded':
        const urlencoded = new URLSearchParams()
        body.urlencoded.forEach(item => {
          if (item.enabled && item.key) {
            urlencoded.append(item.key, item.value)
          }
        })
        config.data = urlencoded
        config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
        break
    }
  }

  /**
   * 判断请求方法是否支持请求体
   * @param {string} method 请求方法
   * @returns {boolean} 是否支持请求体
   */
  hasBody(method) {
    return ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())
  }

  /**
   * 构建成功响应对象
   * @param {Object} response axios响应
   * @param {number} duration 请求耗时
   * @returns {Object} 响应对象
   */
  buildResponse(response, duration) {
    return {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      duration,
      size: this.calculateSize(response.data)
    }
  }

  /**
   * 构建错误响应对象
   * @param {Error} error 错误对象
   * @param {number} duration 请求耗时
   * @returns {Object} 错误响应对象
   */
  buildErrorResponse(error, duration) {
    if (error.response) {
      // 服务器响应了错误状态码
      return this.buildResponse(error.response, duration)
    } else if (error.request) {
      // 请求发出但没有收到响应
      return {
        status: 0,
        statusText: 'Network Error',
        headers: {},
        data: { error: error.message || '网络错误' },
        duration,
        size: '0 B'
      }
    } else {
      // 其他错误
      return {
        status: 0,
        statusText: 'Error',
        headers: {},
        data: { error: error.message || '未知错误' },
        duration,
        size: '0 B'
      }
    }
  }

  /**
   * 计算响应大小
   * @param {*} data 响应数据
   * @returns {string} 格式化的大小
   */
  calculateSize(data) {
    let size = 0
    
    if (typeof data === 'string') {
      size = new Blob([data]).size
    } else if (data) {
      size = new Blob([JSON.stringify(data)]).size
    }
    
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }
}

// 创建单例实例
const httpService = new HttpService()

export default httpService
