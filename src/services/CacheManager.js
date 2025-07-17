/**
 * 智能缓存管理器
 * 提供多种缓存策略和性能优化
 */
export class CacheManager {
  constructor(options = {}) {
    this.cache = new Map()
    this.maxSize = options.maxSize || 100 // 最大缓存条目数
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000 // 默认5分钟
    this.cleanupInterval = options.cleanupInterval || 60 * 1000 // 清理间隔1分钟
    this.accessTimes = new Map() // 记录访问时间，用于LRU
    
    // 启动定期清理
    this.startCleanup()
  }

  /**
   * 生成缓存键
   */
  generateKey(method, url, params = {}, data = {}) {
    const keyData = {
      method: method.toUpperCase(),
      url,
      params: this.sortObject(params),
      data: method.toUpperCase() === 'GET' ? {} : this.sortObject(data)
    }
    
    return this.hashObject(keyData)
  }

  /**
   * 对象排序（确保相同内容生成相同key）
   */
  sortObject(obj) {
    if (obj === null || typeof obj !== 'object') return obj
    if (Array.isArray(obj)) return obj.map(item => this.sortObject(item))
    
    const sorted = {}
    Object.keys(obj).sort().forEach(key => {
      sorted[key] = this.sortObject(obj[key])
    })
    return sorted
  }

  /**
   * 简单哈希函数
   */
  hashObject(obj) {
    const str = JSON.stringify(obj)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return `cache_${Math.abs(hash)}`
  }

  /**
   * 设置缓存
   */
  set(key, value, ttl = this.defaultTTL) {
    // 检查缓存大小，如果超过限制则清理最少使用的
    if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }

    const now = Date.now()
    const cacheItem = {
      value,
      timestamp: now,
      ttl,
      expireTime: now + ttl,
      accessCount: 1,
      lastAccess: now
    }

    this.cache.set(key, cacheItem)
    this.accessTimes.set(key, now)
    
    console.log(`[Cache] 设置缓存 ${key} (TTL: ${ttl}ms)`)
  }

  /**
   * 获取缓存
   */
  get(key) {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    const now = Date.now()
    
    // 检查是否过期
    if (now > item.expireTime) {
      this.delete(key)
      console.log(`[Cache] 缓存过期 ${key}`)
      return null
    }

    // 更新访问信息
    item.accessCount++
    item.lastAccess = now
    this.accessTimes.set(key, now)
    
    console.log(`[Cache] 命中缓存 ${key} (访问次数: ${item.accessCount})`)
    return item.value
  }

  /**
   * 删除缓存
   */
  delete(key) {
    this.cache.delete(key)
    this.accessTimes.delete(key)
    console.log(`[Cache] 删除缓存 ${key}`)
  }

  /**
   * 清空所有缓存
   */
  clear() {
    const size = this.cache.size
    this.cache.clear()
    this.accessTimes.clear()
    console.log(`[Cache] 清空所有缓存 (${size} 项)`)
  }

  /**
   * LRU淘汰策略
   */
  evictLRU() {
    let oldestKey = null
    let oldestTime = Date.now()

    for (const [key, time] of this.accessTimes) {
      if (time < oldestTime) {
        oldestTime = time
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.delete(oldestKey)
      console.log(`[Cache] LRU淘汰 ${oldestKey}`)
    }
  }

  /**
   * 清理过期缓存
   */
  cleanup() {
    const now = Date.now()
    const expiredKeys = []

    for (const [key, item] of this.cache) {
      if (now > item.expireTime) {
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach(key => this.delete(key))
    
    if (expiredKeys.length > 0) {
      console.log(`[Cache] 清理过期缓存 ${expiredKeys.length} 项`)
    }
  }

  /**
   * 启动定期清理
   */
  startCleanup() {
    setInterval(() => {
      this.cleanup()
    }, this.cleanupInterval)
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    const now = Date.now()
    let totalSize = 0
    let expiredCount = 0
    const accessCounts = []

    for (const [key, item] of this.cache) {
      totalSize += this.estimateSize(item.value)
      
      if (now > item.expireTime) {
        expiredCount++
      }
      
      accessCounts.push(item.accessCount)
    }

    return {
      totalItems: this.cache.size,
      maxSize: this.maxSize,
      expiredItems: expiredCount,
      estimatedSize: this.formatBytes(totalSize),
      averageAccessCount: accessCounts.length > 0 
        ? Math.round(accessCounts.reduce((a, b) => a + b, 0) / accessCounts.length) 
        : 0,
      hitRate: this.calculateHitRate()
    }
  }

  /**
   * 估算对象大小
   */
  estimateSize(obj) {
    try {
      return new Blob([JSON.stringify(obj)]).size
    } catch {
      return 0
    }
  }

  /**
   * 格式化字节数
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * 计算缓存命中率（简化版）
   */
  calculateHitRate() {
    // 这里可以实现更复杂的命中率计算
    // 目前返回一个基于访问次数的估算值
    const accessCounts = Array.from(this.cache.values()).map(item => item.accessCount)
    const totalAccess = accessCounts.reduce((a, b) => a + b, 0)
    const uniqueRequests = accessCounts.length
    
    if (uniqueRequests === 0) return 0
    return Math.round(((totalAccess - uniqueRequests) / totalAccess) * 100) || 0
  }

  /**
   * 预热缓存
   */
  async warmup(requests) {
    console.log(`[Cache] 开始预热缓存 ${requests.length} 个请求`)
    
    const results = await Promise.allSettled(
      requests.map(async (request) => {
        try {
          const { key, fetcher, ttl } = request
          const data = await fetcher()
          this.set(key, data, ttl)
          return { key, success: true }
        } catch (error) {
          console.error(`[Cache] 预热失败 ${request.key}`, error)
          return { key: request.key, success: false, error }
        }
      })
    )

    const successful = results.filter(r => r.value?.success).length
    console.log(`[Cache] 预热完成 ${successful}/${requests.length}`)
    
    return results
  }

  /**
   * 缓存装饰器
   */
  cached(ttl = this.defaultTTL) {
    return (target, propertyKey, descriptor) => {
      const originalMethod = descriptor.value

      descriptor.value = async function(...args) {
        const cacheKey = `${target.constructor.name}_${propertyKey}_${JSON.stringify(args)}`
        
        // 尝试从缓存获取
        const cached = this.cacheManager?.get(cacheKey)
        if (cached) {
          return cached
        }

        // 执行原方法
        const result = await originalMethod.apply(this, args)
        
        // 缓存结果
        if (this.cacheManager) {
          this.cacheManager.set(cacheKey, result, ttl)
        }

        return result
      }

      return descriptor
    }
  }
}

// 创建默认缓存管理器实例
export const defaultCacheManager = new CacheManager({
  maxSize: 200,
  defaultTTL: 5 * 60 * 1000, // 5分钟
  cleanupInterval: 2 * 60 * 1000 // 2分钟清理一次
})

// 缓存策略枚举
export const CacheStrategy = {
  NO_CACHE: 'no-cache',
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  CACHE_ONLY: 'cache-only',
  NETWORK_ONLY: 'network-only'
}
