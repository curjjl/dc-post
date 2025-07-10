/**
 * 环境变量处理工具函数
 * 提供统一的环境变量替换逻辑
 */

/**
 * 处理环境变量替换
 * @param {string} text 包含环境变量的文本
 * @returns {string} 替换后的文本
 */
export const processEnvironmentVariables = (text) => {
  if (!text || typeof text !== 'string') return text

  return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    try {
      const envVars = JSON.parse(localStorage.getItem('api_env_variables') || '{}')
      return envVars[varName] || match
    } catch (error) {
      console.error('获取环境变量失败:', error)
      return match
    }
  })
}

/**
 * 批量处理对象中的环境变量
 * @param {Object} obj 包含环境变量的对象
 * @returns {Object} 替换后的对象
 */
export const processObjectEnvironmentVariables = (obj) => {
  if (!obj || typeof obj !== 'object') return obj

  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = processEnvironmentVariables(value)
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => 
        typeof item === 'string' ? processEnvironmentVariables(item) : item
      )
    } else {
      result[key] = value
    }
  }
  return result
}

/**
 * 获取当前环境变量
 * @returns {Object} 环境变量对象
 */
export const getCurrentEnvironmentVariables = () => {
  try {
    return JSON.parse(localStorage.getItem('api_env_variables') || '{}')
  } catch (error) {
    console.error('获取环境变量失败:', error)
    return {}
  }
}

/**
 * 检查文本中是否包含环境变量
 * @param {string} text 要检查的文本
 * @returns {boolean} 是否包含环境变量
 */
export const hasEnvironmentVariables = (text) => {
  if (!text || typeof text !== 'string') return false
  return /\{\{(\w+)\}\}/g.test(text)
}

/**
 * 提取文本中的所有环境变量名
 * @param {string} text 包含环境变量的文本
 * @returns {Array} 环境变量名数组
 */
export const extractEnvironmentVariables = (text) => {
  if (!text || typeof text !== 'string') return []
  
  const matches = text.match(/\{\{(\w+)\}\}/g)
  if (!matches) return []
  
  return [...new Set(matches.map(match => match.replace(/[{}]/g, '')))]
}

/**
 * 验证环境变量是否都有值
 * @param {string} text 包含环境变量的文本
 * @returns {Object} 验证结果 { isValid: boolean, missingVars: string[] }
 */
export const validateEnvironmentVariables = (text) => {
  const variables = extractEnvironmentVariables(text)
  const envVars = getCurrentEnvironmentVariables()
  
  const missingVars = variables.filter(varName => !envVars[varName])
  
  return {
    isValid: missingVars.length === 0,
    missingVars
  }
}
