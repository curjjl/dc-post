import { BaseApiService } from '../services/BaseApiService.js'
import { CacheStrategy } from '../services/CacheManager.js'

/**
 * 认证相关API服务
 * 处理登录、注册、token管理等认证相关功能
 */
export class AuthService extends BaseApiService {
  constructor(baseURL = '/api/auth') {
    super(baseURL, {
      timeout: 15000,
      cacheTime: 0, // 认证相关请求不缓存
      retry: false // 认证请求不重试
    })

    // 监听认证事件
    this.setupAuthEventListeners()
  }

  /**
   * 设置认证事件监听器
   */
  setupAuthEventListeners() {
    // 监听未授权事件
    window.addEventListener('auth:unauthorized', () => {
      this.handleUnauthorized()
    })

    // 监听权限不足事件
    window.addEventListener('auth:forbidden', () => {
      this.handleForbidden()
    })
  }

  /**
   * 用户登录
   * @param {Object} credentials - 登录凭据
   * @param {string} credentials.username - 用户名/邮箱
   * @param {string} credentials.password - 密码
   * @param {boolean} credentials.rememberMe - 记住我
   * @returns {Promise} 登录响应
   */
  async login(credentials) {
    try {
      const response = await this.post('/login', credentials, {
        cacheStrategy: CacheStrategy.NETWORK_ONLY
      })

      if (response.success && response.data.token) {
        this.handleLoginSuccess(response.data, credentials.rememberMe)
      }

      return response
    } catch (error) {
      this.handleLoginError(error)
      throw error
    }
  }

  /**
   * 用户注册
   * @param {Object} userData - 注册数据
   * @returns {Promise} 注册响应
   */
  async register(userData) {
    return this.post('/register', userData, {
      cacheStrategy: CacheStrategy.NETWORK_ONLY
    })
  }

  /**
   * 用户登出
   * @returns {Promise} 登出响应
   */
  async logout() {
    try {
      const response = await this.post('/logout', {}, {
        cacheStrategy: CacheStrategy.NETWORK_ONLY
      })
      
      this.handleLogoutSuccess()
      return response
    } catch (error) {
      // 即使登出失败也要清除本地token
      this.handleLogoutSuccess()
      throw error
    }
  }

  /**
   * 刷新token
   * @returns {Promise} 刷新响应
   */
  async refreshToken() {
    const refreshToken = this.getRefreshToken()
    
    if (!refreshToken) {
      throw new Error('没有可用的刷新token')
    }

    try {
      const response = await this.post('/refresh', {
        refreshToken
      }, {
        cacheStrategy: CacheStrategy.NETWORK_ONLY,
        retry: false
      })

      if (response.success && response.data.token) {
        this.handleTokenRefreshSuccess(response.data)
      }

      return response
    } catch (error) {
      this.handleTokenRefreshError(error)
      throw error
    }
  }

  /**
   * 获取当前用户信息
   * @returns {Promise} 用户信息响应
   */
  async getCurrentUser() {
    return this.get('/me', {}, {
      cacheTime: 5 * 60 * 1000, // 用户信息缓存5分钟
      cacheStrategy: CacheStrategy.CACHE_FIRST
    })
  }

  /**
   * 更新当前用户信息
   * @param {Object} userData - 用户数据
   * @returns {Promise} 更新响应
   */
  async updateCurrentUser(userData) {
    const response = await this.put('/me', userData, {
      cacheStrategy: CacheStrategy.NETWORK_ONLY
    })

    // 清除用户信息缓存
    this.http.clearCacheByKey('GET_/me_{}')
    
    return response
  }

  /**
   * 修改密码
   * @param {Object} passwordData - 密码数据
   * @param {string} passwordData.currentPassword - 当前密码
   * @param {string} passwordData.newPassword - 新密码
   * @returns {Promise} 修改响应
   */
  async changePassword(passwordData) {
    return this.post('/change-password', passwordData, {
      cacheStrategy: CacheStrategy.NETWORK_ONLY
    })
  }

  /**
   * 忘记密码
   * @param {string} email - 邮箱地址
   * @returns {Promise} 响应
   */
  async forgotPassword(email) {
    return this.post('/forgot-password', { email }, {
      cacheStrategy: CacheStrategy.NETWORK_ONLY
    })
  }

  /**
   * 重置密码
   * @param {Object} resetData - 重置数据
   * @param {string} resetData.token - 重置token
   * @param {string} resetData.password - 新密码
   * @returns {Promise} 重置响应
   */
  async resetPassword(resetData) {
    return this.post('/reset-password', resetData, {
      cacheStrategy: CacheStrategy.NETWORK_ONLY
    })
  }

  /**
   * 验证邮箱
   * @param {string} token - 验证token
   * @returns {Promise} 验证响应
   */
  async verifyEmail(token) {
    return this.post('/verify-email', { token }, {
      cacheStrategy: CacheStrategy.NETWORK_ONLY
    })
  }

  /**
   * 重新发送验证邮件
   * @returns {Promise} 发送响应
   */
  async resendVerificationEmail() {
    return this.post('/resend-verification', {}, {
      cacheStrategy: CacheStrategy.NETWORK_ONLY
    })
  }

  /**
   * 检查token有效性
   * @returns {Promise} 验证响应
   */
  async validateToken() {
    return this.get('/validate', {}, {
      cacheStrategy: CacheStrategy.NETWORK_ONLY,
      retry: false
    })
  }

  /**
   * 获取访问token
   */
  getAccessToken() {
    return localStorage.getItem('access_token') || 
           sessionStorage.getItem('access_token') ||
           localStorage.getItem('auth_token') || 
           sessionStorage.getItem('auth_token')
  }

  /**
   * 获取刷新token
   */
  getRefreshToken() {
    return localStorage.getItem('refresh_token') || 
           sessionStorage.getItem('refresh_token')
  }

  /**
   * 检查是否已登录
   */
  isAuthenticated() {
    return !!this.getAccessToken()
  }

  /**
   * 处理登录成功
   */
  handleLoginSuccess(authData, rememberMe = false) {
    const storage = rememberMe ? localStorage : sessionStorage
    
    // 存储token
    if (authData.token) {
      storage.setItem('access_token', authData.token)
      storage.setItem('auth_token', authData.token) // 兼容性
    }
    
    if (authData.refreshToken) {
      storage.setItem('refresh_token', authData.refreshToken)
    }

    // 存储用户信息
    if (authData.user) {
      storage.setItem('user_info', JSON.stringify(authData.user))
    }

    // 设置HTTP服务的认证头
    this.http.setHeaders({
      'Authorization': `Bearer ${authData.token}`
    })

    // 触发登录成功事件
    window.dispatchEvent(new CustomEvent('auth:login-success', {
      detail: authData
    }))

    console.log('[Auth] 登录成功')
  }

  /**
   * 处理登录错误
   */
  handleLoginError(error) {
    console.error('[Auth] 登录失败', error)
    
    // 触发登录失败事件
    window.dispatchEvent(new CustomEvent('auth:login-error', {
      detail: error
    }))
  }

  /**
   * 处理登出成功
   */
  handleLogoutSuccess() {
    // 清除所有认证相关数据
    ['access_token', 'auth_token', 'refresh_token', 'user_info'].forEach(key => {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    })

    // 清除HTTP服务的认证头
    this.http.setHeaders({
      'Authorization': ''
    })

    // 清除所有缓存
    this.http.clearCache()

    // 触发登出成功事件
    window.dispatchEvent(new CustomEvent('auth:logout-success'))

    console.log('[Auth] 登出成功')
  }

  /**
   * 处理token刷新成功
   */
  handleTokenRefreshSuccess(authData) {
    const storage = localStorage.getItem('access_token') ? localStorage : sessionStorage
    
    if (authData.token) {
      storage.setItem('access_token', authData.token)
      storage.setItem('auth_token', authData.token)
    }
    
    if (authData.refreshToken) {
      storage.setItem('refresh_token', authData.refreshToken)
    }

    // 更新HTTP服务的认证头
    this.http.setHeaders({
      'Authorization': `Bearer ${authData.token}`
    })

    console.log('[Auth] Token刷新成功')
  }

  /**
   * 处理token刷新错误
   */
  handleTokenRefreshError(error) {
    console.error('[Auth] Token刷新失败', error)
    
    // 刷新失败，清除认证信息并跳转登录
    this.handleLogoutSuccess()
    
    // 触发需要重新登录事件
    window.dispatchEvent(new CustomEvent('auth:token-expired'))
  }

  /**
   * 处理未授权
   */
  handleUnauthorized() {
    console.warn('[Auth] 未授权访问')
    
    // 尝试刷新token
    if (this.getRefreshToken()) {
      this.refreshToken().catch(() => {
        // 刷新失败，跳转登录
        this.redirectToLogin()
      })
    } else {
      this.redirectToLogin()
    }
  }

  /**
   * 处理权限不足
   */
  handleForbidden() {
    console.warn('[Auth] 权限不足')
    
    // 触发权限不足事件
    window.dispatchEvent(new CustomEvent('auth:access-denied'))
  }

  /**
   * 跳转到登录页
   */
  redirectToLogin() {
    // 这里可以根据路由系统进行跳转
    // 例如使用Vue Router: this.$router.push('/login')
    console.log('[Auth] 需要跳转到登录页')
    
    window.dispatchEvent(new CustomEvent('auth:redirect-login'))
  }
}

// 创建默认认证服务实例
export const authService = new AuthService()

// 导出默认实例
export default authService
