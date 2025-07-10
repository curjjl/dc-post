/**
 * 环境变量管理服务
 * 提供环境变量的增删改查功能
 */
class EnvService {
  constructor() {
    this.storageKey = 'api_env_variables'
    this.currentEnvKey = 'api_current_env'
  }

  /**
   * 获取所有环境变量
   * @returns {Object} 环境变量对象
   */
  getVariables() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : { ...this.getDefaultVariables() }
    } catch (error) {
      console.error('获取环境变量失败:', error)
      return { ...this.getDefaultVariables() }
    }
  }

  /**
   * 获取默认环境变量
   * @returns {Object} 默认环境变量
   */
  getDefaultVariables() {
    return {
      baseUrl: 'https://api.example.com',
      apiKey: '',
      token: '',
      version: 'v1'
    }
  }

  /**
   * 设置环境变量
   * @param {Object} variables 环境变量对象
   */
  setVariables(variables) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(variables))
      this.notifyChange()
    } catch (error) {
      console.error('保存环境变量失败:', error)
      throw new Error('保存环境变量失败')
    }
  }

  /**
   * 获取单个环境变量
   * @param {string} key 变量名
   * @returns {string} 变量值
   */
  getVariable(key) {
    const variables = this.getVariables()
    return variables[key] || ''
  }

  /**
   * 设置单个环境变量
   * @param {string} key 变量名
   * @param {string} value 变量值
   */
  setVariable(key, value) {
    const variables = this.getVariables()
    variables[key] = value
    this.setVariables(variables)
  }

  /**
   * 删除环境变量
   * @param {string} key 变量名
   */
  deleteVariable(key) {
    const variables = this.getVariables()
    delete variables[key]
    this.setVariables(variables)
  }

  /**
   * 清空所有环境变量
   */
  clearVariables() {
    localStorage.removeItem(this.storageKey)
    this.notifyChange()
  }

  /**
   * 导出环境变量
   * @returns {string} JSON字符串
   */
  exportVariables() {
    const variables = this.getVariables()
    return JSON.stringify(variables, null, 2)
  }

  /**
   * 导入环境变量
   * @param {string} jsonString JSON字符串
   */
  importVariables(jsonString) {
    try {
      const variables = JSON.parse(jsonString)
      if (typeof variables === 'object' && variables !== null) {
        this.setVariables(variables)
        return true
      } else {
        throw new Error('无效的环境变量格式')
      }
    } catch (error) {
      console.error('导入环境变量失败:', error)
      throw new Error('导入环境变量失败: ' + error.message)
    }
  }

  /**
   * 替换字符串中的环境变量
   * @param {string} str 包含变量的字符串
   * @returns {string} 替换后的字符串
   */
  replaceVariables(str) {
    if (typeof str !== 'string') return str
    
    const variables = this.getVariables()
    return str.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName] || match
    })
  }

  /**
   * 获取字符串中的所有变量名
   * @param {string} str 包含变量的字符串
   * @returns {Array} 变量名数组
   */
  extractVariables(str) {
    if (typeof str !== 'string') return []
    
    const matches = str.match(/\{\{(\w+)\}\}/g)
    if (!matches) return []
    
    return matches.map(match => match.replace(/[{}]/g, ''))
  }

  /**
   * 验证变量名是否有效
   * @param {string} name 变量名
   * @returns {boolean} 是否有效
   */
  isValidVariableName(name) {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)
  }

  /**
   * 获取当前环境名称
   * @returns {string} 环境名称
   */
  getCurrentEnvironment() {
    return localStorage.getItem(this.currentEnvKey) || 'default'
  }

  /**
   * 设置当前环境
   * @param {string} envName 环境名称
   */
  setCurrentEnvironment(envName) {
    localStorage.setItem(this.currentEnvKey, envName)
    this.notifyChange()
  }

  /**
   * 获取所有环境配置
   * @returns {Object} 环境配置对象
   */
  getAllEnvironments() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : { default: this.getDefaultVariables()  }
    } catch (error) {
      console.error('获取环境配置失败:', error)
      return { default: this.getDefaultVariables() }
    }
  }

  /**
   * 保存环境配置
   * @param {Object} environments 环境配置对象
   */
  saveEnvironments(environments) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(environments))
      this.notifyChange()
    } catch (error) {
      console.error('保存环境配置失败:', error)
      throw new Error('保存环境配置失败')
    }
  }

  /**
   * 创建新环境
   * @param {string} name 环境名称
   * @param {Object} variables 环境变量
   */
  createEnvironment(name, variables = {}) {
    const environments = this.getAllEnvironments()
    environments[name] = { ...this.getDefaultVariables(), ...variables }
    this.saveEnvironments(environments)
  }

  /**
   * 删除环境
   * @param {string} name 环境名称
   */
  deleteEnvironment(name) {
    if (name === 'default') {
      throw new Error('不能删除默认环境')
    }
    
    const environments = this.getAllEnvironments()
    delete environments[name]
    this.saveEnvironments(environments)
    
    // 如果删除的是当前环境，切换到默认环境
    if (this.getCurrentEnvironment() === name) {
      this.setCurrentEnvironment('default')
    }
  }

  /**
   * 通知环境变量变化
   */
  notifyChange() {
    // 触发自定义事件，通知其他组件环境变量已变化
    window.dispatchEvent(new CustomEvent('env-variables-changed', {
      detail: {
        variables: this.getVariables(),
        currentEnv: this.getCurrentEnvironment()
      }
    }))
  }

  /**
   * 监听环境变量变化
   * @param {Function} callback 回调函数
   * @returns {Function} 取消监听的函数
   */
  onVariablesChange(callback) {
    const handler = (event) => {
      callback(event.detail)
    }
    
    window.addEventListener('env-variables-changed', handler)
    
    // 返回取消监听的函数
    return () => {
      window.removeEventListener('env-variables-changed', handler)
    }
  }
}

// 创建单例实例
const envService = new EnvService()

export default envService
