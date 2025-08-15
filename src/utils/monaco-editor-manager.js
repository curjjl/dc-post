// Monaco编辑器资源管理器
// 用于统一管理所有编辑器实例，防止内存泄漏

class MonacoEditorManager {
  constructor() {
    // 存储所有活动的编辑器实例
    this.editors = new Map()
    // 存储编辑器创建的Promise
    this.creationPromises = new Map()
    // 自增ID计数器
    this.idCounter = 0
    
    // 监听页面卸载事件，确保清理所有编辑器
    this.bindUnloadEvents()
  }

  // 生成唯一编辑器ID
  generateId() {
    return `monaco-editor-${++this.idCounter}`
  }

  // 注册新的编辑器实例
  register(editorId, editor) {
    if (this.editors.has(editorId)) {
      console.warn(`Editor with ID ${editorId} already exists`)
      return false
    }
    
    this.editors.set(editorId, {
      editor,
      createdAt: Date.now(),
      lastUsed: Date.now()
    })
    
    console.log(`Monaco editor registered: ${editorId} (Total: ${this.editors.size})`)
    return true
  }

  // 获取编辑器实例
  getEditor(editorId) {
    const editorInfo = this.editors.get(editorId)
    if (editorInfo) {
      editorInfo.lastUsed = Date.now()
      return editorInfo.editor
    }
    return null
  }

  // 安全销毁指定编辑器
  dispose(editorId) {
    const editorInfo = this.editors.get(editorId)
    if (!editorInfo) {
      return false
    }

    try {
      editorInfo.editor.dispose()
      console.log(`Monaco editor disposed: ${editorId}`)
    } catch (error) {
      console.warn(`Error disposing Monaco editor ${editorId}:`, error)
    } finally {
      this.editors.delete(editorId)
      this.creationPromises.delete(editorId)
    }
    
    return true
  }

  // 销毁所有编辑器
  disposeAll() {
    const editorIds = Array.from(this.editors.keys())
    let disposed = 0
    
    editorIds.forEach(id => {
      if (this.dispose(id)) {
        disposed++
      }
    })
    
    console.log(`Disposed ${disposed} Monaco editors`)
    return disposed
  }

  // 检查编辑器是否存在
  has(editorId) {
    return this.editors.has(editorId)
  }

  // 获取所有编辑器信息
  getAll() {
    return Array.from(this.editors.entries()).map(([id, info]) => ({
      id,
      createdAt: info.createdAt,
      lastUsed: info.lastUsed,
      age: Date.now() - info.createdAt
    }))
  }

  // 清理长时间未使用的编辑器
  cleanupUnused(maxIdleTime = 10 * 60 * 1000) { // 默认10分钟
    const now = Date.now()
    const toDispose = []
    
    this.editors.forEach((info, id) => {
      if (now - info.lastUsed > maxIdleTime) {
        toDispose.push(id)
      }
    })
    
    let cleaned = 0
    toDispose.forEach(id => {
      if (this.dispose(id)) {
        cleaned++
      }
    })
    
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} unused Monaco editors`)
    }
    
    return cleaned
  }

  // 设置创建Promise以防止重复创建
  setCreationPromise(editorId, promise) {
    this.creationPromises.set(editorId, promise)
  }

  // 获取创建Promise
  getCreationPromise(editorId) {
    return this.creationPromises.get(editorId)
  }

  // 清理创建Promise
  clearCreationPromise(editorId) {
    this.creationPromises.delete(editorId)
  }

  // 绑定页面卸载事件
  bindUnloadEvents() {
    if (typeof window === 'undefined') return

    const cleanup = () => {
      this.disposeAll()
    }

    // 页面卸载时清理
    window.addEventListener('beforeunload', cleanup)
    window.addEventListener('unload', cleanup)
    
    // Vue应用卸载时清理（如果存在Vue实例）
    if (window.__VUE_APP__) {
      window.__VUE_APP__.$on('unmount', cleanup)
    }
  }

  // 获取内存使用统计
  getStats() {
    const editors = this.getAll()
    const now = Date.now()
    
    return {
      total: editors.length,
      averageAge: editors.length > 0 ? 
        editors.reduce((sum, e) => sum + e.age, 0) / editors.length : 0,
      oldestAge: editors.length > 0 ? 
        Math.max(...editors.map(e => e.age)) : 0,
      memoryEstimate: editors.length * 5, // 粗略估计每个编辑器5MB
      creationPromises: this.creationPromises.size
    }
  }

  // 启动定期清理
  startPeriodicCleanup(interval = 5 * 60 * 1000) { // 默认5分钟检查一次
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    
    this.cleanupInterval = setInterval(() => {
      this.cleanupUnused()
    }, interval)
    
    console.log('Monaco Editor periodic cleanup started')
  }

  // 停止定期清理
  stopPeriodicCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
      console.log('Monaco Editor periodic cleanup stopped')
    }
  }
}

// 创建全局单例实例
const monacoEditorManager = new MonacoEditorManager()

// 启动定期清理
monacoEditorManager.startPeriodicCleanup()

export default monacoEditorManager

// 便捷的导出函数
export const {
  register,
  dispose,
  disposeAll,
  getEditor,
  has,
  getAll,
  cleanupUnused,
  getStats,
  generateId
} = monacoEditorManager