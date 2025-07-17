import { BaseApiService } from '../services/BaseApiService.js'

/**
 * 通用相关API服务
 * 继承BaseApiService，提供通用管理相关的接口
 */
export class ObjectContService extends BaseApiService {
  constructor(baseURL = '/api/ds/code_bricks/project_object_content') {
    super(baseURL, {
      timeout: 10000,
      cacheTime: 2 * 60 * 1000 // 用户数据缓存2分钟
    })
  }

  /**
   * 获取用户列表
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码
   * @param {number} params.pageSize - 每页数量
   * @returns {Promise} 列表响应
   */
  async getList(params = {}) {
    return this.paginate('', {
      page: 1,
      pagesize: 20,
      ...params
    })
  }

  /**
   * 查询总数
   * @param {Object} params - 查询参数
   * @returns {Promise} 用户详情响应
   */
  async getListTotal(params = {}) {
    return this.get('/_size', { ...params })
  }

  /**
   * 创建或更新
   * @param {Object} objData - 参数
   * @returns {Promise} 创建结果响应
   */
  async upsertObject(objData) {
    return this.post('?wm=upsert&pk=object_id', objData)
  }

  /**
   * 更新用户信息
   * @param {string|number} userId - 用户ID
   * @param {Object} userData - 更新的用户数据
   * @returns {Promise} 更新结果响应
   */
  async updateObject(objId, objData) {
    return this.put('/:id', objData, { id: objId })
  }

  /**
   * 部分更新用户信息
   * @param {string|number} userId - 用户ID
   * @param {Object} userData - 部分用户数据
   * @returns {Promise} 更新结果响应
   */
  async patchUser(userId, userData) {
    return this.patch('/:id', userData, { id: userId })
  }

  /**
   * 删除用户
   * @param {string|number} userId - 用户ID
   * @returns {Promise} 删除结果响应
   */
  async deleteUser(userId) {
    return this.delete('/:id', { id: userId })
  }

  /**
   * 批量删除用户
   * @param {Array} userIds - 用户ID数组
   * @returns {Promise} 批量删除结果响应
   */
  async batchDeleteUsers(userIds) {
    return this.post('/batch-delete', { ids: userIds })
  }

  /**
   * 上传用户头像
   * @param {string|number} userId - 用户ID
   * @param {File} avatarFile - 头像文件
   * @returns {Promise} 上传结果响应
   */
  async uploadAvatar(userId, avatarFile) {
    return this.upload(`/${userId}/avatar`, avatarFile)
  }

  /**
   * 获取用户权限
   * @param {string|number} userId - 用户ID
   * @returns {Promise} 用户权限响应
   */
  async getUserPermissions(userId) {
    return this.get('/:id/permissions', { id: userId })
  }

  /**
   * 更新用户权限
   * @param {string|number} userId - 用户ID
   * @param {Array} permissions - 权限列表
   * @returns {Promise} 更新结果响应
   */
  async updateUserPermissions(userId, permissions) {
    return this.put('/:id/permissions', { permissions }, { id: userId })
  }

  /**
   * 重置用户密码
   * @param {string|number} userId - 用户ID
   * @param {string} newPassword - 新密码
   * @returns {Promise} 重置结果响应
   */
  async resetPassword(userId, newPassword) {
    return this.post('/:id/reset-password', { password: newPassword }, { id: userId })
  }

  /**
   * 启用/禁用用户
   * @param {string|number} userId - 用户ID
   * @param {boolean} enabled - 是否启用
   * @returns {Promise} 操作结果响应
   */
  async toggleUserStatus(userId, enabled) {
    return this.patch('/:id/status', { enabled }, { id: userId })
  }

  /**
   * 搜索用户
   * @param {string} keyword - 搜索关键词
   * @param {Object} filters - 过滤条件
   * @returns {Promise} 搜索结果响应
   */
  async searchUsers(keyword, filters = {}) {
    return this.get('/search', {
      q: keyword,
      ...filters
    })
  }

  /**
   * 获取用户统计信息
   * @param {Object} params - 统计参数
   * @returns {Promise} 统计信息响应
   */
  async getUserStats(params = {}) {
    return this.get('/stats', params)
  }

  /**
   * 导出用户数据
   * @param {Object} filters - 导出过滤条件
   * @param {string} format - 导出格式 (excel, csv, pdf)
   * @returns {Promise} 导出文件响应
   */
  async exportUsers(filters = {}, format = 'excel') {
    return this.download('/export', {
      format,
      ...filters
    }, {
      onProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        console.log(`[Export] 导出进度: ${percentCompleted}%`)
      }
    })
  }

  /**
   * 导入用户数据
   * @param {File} file - 导入文件
   * @param {Object} options - 导入选项
   * @returns {Promise} 导入结果响应
   */
  async importUsers(file, options = {}) {
    return this.upload('/import', file, options, {
      onProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        console.log(`[Import] 上传进度: ${percentCompleted}%`)
      }
    })
  }

  /**
   * 获取用户操作日志
   * @param {string|number} userId - 用户ID
   * @param {Object} params - 查询参数
   * @returns {Promise} 操作日志响应
   */
  async getUserLogs(userId, params = {}) {
    return this.paginate('/:id/logs', {
      id: userId,
      ...params
    })
  }
}

// 创建默认用户服务实例
export const objectContService = new ObjectContService()

// 导出默认实例
export default objectContService
