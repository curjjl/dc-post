/**
 * 查询参数辅助工具
 * 用于处理查询参数的获取、设置和传递
 */

/**
 * 构建带查询参数的URL
 * @param {string} basePath - 基础路径 ('/workspace' 或 '/history')
 * @param {Object} params - 查询参数对象
 * @param {string} params.id - ID
 * @param {string} params.name - 名称
 * @param {string} params.code - 代码
 * @param {string} params.pid - 项目ID
 * @param {string} params.dir - 目录ID
 * @returns {string} 完整的URL路径
 */
export function buildQueryUrl(basePath, params = {}) {
  const filteredParams = filterQueryParams(params)

  if (Object.keys(filteredParams).length === 0) {
    return basePath
  }

  const queryString = new URLSearchParams(filteredParams).toString()
  return `${basePath}?${queryString}`
}

/**
 * 从查询参数对象中过滤掉空值
 * @param {Object} params - 查询参数对象
 * @returns {Object} 过滤后的参数对象
 */
export function filterQueryParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value != null && value !== '')
  )
}

/**
 * 构建路由对象（用于 router.push）
 * @param {string} routeName - 路由名称 ('Workspace' 或 'History')
 * @param {Object} params - 查询参数对象
 * @returns {Object} 路由对象
 */
export function buildRouteObject(routeName, params = {}) {
  const filteredParams = filterQueryParams(params)

  if (Object.keys(filteredParams).length > 0) {
    return { name: routeName, query: filteredParams }
  } else {
    return { name: routeName }
  }
}

/**
 * 从查询参数构建API查询对象（用于后台API调用）
 * @param {Object} queryParams - 查询参数对象
 * @returns {Object} API查询参数对象
 */
export function buildApiQueryParams(queryParams) {
  const apiParams = {}

  if (queryParams.id) apiParams.id = queryParams.id
  if (queryParams.name) apiParams.name = queryParams.name
  if (queryParams.code) apiParams.code = queryParams.code
  if (queryParams.pid) apiParams.pid = queryParams.pid
  if (queryParams.dir) apiParams.dir = queryParams.dir

  return apiParams
}

/**
 * 检查是否有有效的查询参数
 * @param {Object} queryParams - 查询参数对象
 * @returns {boolean} 是否有有效参数
 */
export function hasValidQueryParams(queryParams) {
  return !!(queryParams.id || queryParams.name || queryParams.code || queryParams.pid || queryParams.dir)
}
