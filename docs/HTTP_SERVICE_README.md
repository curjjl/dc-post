# 全局HTTP服务封装

基于axios的全局HTTP服务封装，提供统一的请求管理、缓存机制、错误处理和重试逻辑。

## 🚀 特性

- **全局axios实例配置** - 统一的请求拦截器和响应拦截器
- **智能缓存机制** - 支持多种缓存策略，提升性能
- **自动重试逻辑** - 网络错误和服务器错误自动重试
- **错误处理** - 全局错误处理和用户友好的错误消息
- **性能优化** - 请求去重、并发控制、网络状态监控
- **类型安全** - 完整的TypeScript支持（可选）
- **可扩展** - 基于类的设计，易于扩展和自定义

## 📁 文件结构

```
src/
├── services/
│   ├── globalHttpService.js     # 全局HTTP服务
│   ├── BaseApiService.js        # API服务基类
│   ├── CacheManager.js          # 缓存管理器
│   ├── ErrorHandler.js          # 错误处理器
│   └── httpService.js           # 原有的HTTP服务（保留）
├── api/
│   ├── index.js                 # API统一导出
│   ├── UserService.js           # 用户服务示例
│   └── AuthService.js           # 认证服务示例
└── examples/
    └── api-usage-examples.js    # 使用示例
```

## 🛠️ 安装和配置

### 1. 基础配置

```javascript
import api from '@/api'

// 配置API基础信息
api.configure({
  baseURL: 'https://api.example.com',
  timeout: 30000,
  headers: {
    'X-Custom-Header': 'value'
  },
  cache: {
    enabled: true,
    defaultTTL: 5 * 60 * 1000, // 5分钟
    strategy: 'cache-first'
  },
  retry: {
    enabled: true,
    maxRetries: 3,
    strategy: 'exponential-backoff'
  }
})
```

### 2. 设置认证

```javascript
// 设置全局认证token
api.setAuthToken('your-jwt-token')

// 清除认证token
api.clearAuthToken()
```

## 📖 使用方法

### 基础HTTP请求

```javascript
import api from '@/api'

// GET请求
const users = await api.http.get('/users', {
  params: { page: 1, pageSize: 10 }
})

// POST请求
const newUser = await api.http.post('/users', {
  name: '张三',
  email: 'zhangsan@example.com'
})

// PUT请求
const updatedUser = await api.http.put('/users/1', userData)

// DELETE请求
const result = await api.http.delete('/users/1')
```

### 使用业务服务

```javascript
// 用户服务
const userList = await api.user.getUsers({ page: 1, pageSize: 20 })
const userDetail = await api.user.getUserById(1)
const newUser = await api.user.createUser(userData)

// 认证服务
const loginResult = await api.auth.login({ username, password })
const currentUser = await api.auth.getCurrentUser()
await api.auth.logout()
```

### 缓存策略

```javascript
import { CacheStrategy } from '@/services/CacheManager'

// 缓存优先（默认）
const data1 = await api.http.get('/users', {
  cacheStrategy: CacheStrategy.CACHE_FIRST,
  cacheTime: 10 * 60 * 1000 // 缓存10分钟
})

// 网络优先
const data2 = await api.http.get('/users', {
  cacheStrategy: CacheStrategy.NETWORK_FIRST
})

// 仅使用缓存
const data3 = await api.http.get('/users', {
  cacheStrategy: CacheStrategy.CACHE_ONLY
})

// 仅使用网络
const data4 = await api.http.get('/users', {
  cacheStrategy: CacheStrategy.NETWORK_ONLY
})
```

### 重试策略

```javascript
import { RetryStrategy } from '@/services/ErrorHandler'

// 指数退避重试
const data = await api.http.get('/unreliable-endpoint', {
  maxRetries: 3,
  retryStrategy: RetryStrategy.EXPONENTIAL_BACKOFF
})

// 固定延迟重试
const data2 = await api.http.get('/endpoint', {
  maxRetries: 2,
  retryStrategy: RetryStrategy.FIXED_DELAY
})

// 禁用重试
const data3 = await api.http.get('/endpoint', {
  retry: false
})
```

### 文件上传下载

```javascript
// 文件上传
const uploadResult = await api.http.upload('/files/upload', file, {
  category: 'documents'
}, {
  onProgress: (progressEvent) => {
    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
    console.log(`上传进度: ${percent}%`)
  }
})

// 文件下载
const downloadResponse = await api.http.download('/files/download/123', {
  format: 'pdf'
}, {
  onProgress: (progressEvent) => {
    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
    console.log(`下载进度: ${percent}%`)
  }
})
```

### 批量请求

```javascript
// 并行请求
const results = await api.http.all([
  api.user.getUsers({ page: 1 }),
  api.user.getUserStats(),
  api.auth.getCurrentUser()
])

// 并发控制的批量请求
const batchOperations = [
  { method: 'GET', endpoint: '/users', params: { page: 1 } },
  { method: 'POST', endpoint: '/users', data: { name: 'Test' } }
]
const batchResults = await api.user.batch(batchOperations)
```

## 🎯 高级功能

### 自定义API服务

```javascript
import { BaseApiService } from '@/services/BaseApiService'

class ProductService extends BaseApiService {
  constructor() {
    super('/api/products', {
      timeout: 15000,
      cacheTime: 3 * 60 * 1000
    })
  }

  async getProducts(params = {}) {
    return this.paginate('', params)
  }

  async getProductById(id) {
    return this.get('/:id', { id })
  }

  async createProduct(data) {
    return this.post('', data)
  }
}

// 注册到工厂
api.factory.registerService('product', new ProductService())
```

### 错误处理

```javascript
// 监听全局错误事件
window.addEventListener('http:error', (event) => {
  const { error, type, context } = event.detail
  console.error(`API错误 [${type}] ${context}:`, error.userMessage)
})

// 监听认证事件
window.addEventListener('auth:unauthorized', () => {
  // 跳转到登录页
  router.push('/login')
})

window.addEventListener('auth:forbidden', () => {
  // 显示权限不足提示
  message.error('权限不足')
})
```

### 性能监控

```javascript
// 获取缓存统计
const cacheStats = api.http.getCacheStats()
console.log('缓存统计:', cacheStats)

// 获取错误统计
const errorStats = api.http.getErrorStats()
console.log('错误统计:', errorStats)

// 获取所有服务统计
const allStats = api.getStats()
console.log('所有服务统计:', allStats)
```

## 🔧 配置选项

### 全局配置

```javascript
const config = {
  // 基础配置
  baseURL: '/api',
  timeout: 30000,
  headers: {},
  
  // 缓存配置
  cache: {
    enabled: true,
    defaultTTL: 5 * 60 * 1000,
    maxSize: 200,
    strategy: 'cache-first'
  },
  
  // 重试配置
  retry: {
    enabled: true,
    maxRetries: 3,
    strategy: 'exponential-backoff',
    baseDelay: 1000,
    maxDelay: 30000
  }
}
```

### 请求级配置

```javascript
const response = await api.http.get('/endpoint', {
  // 缓存配置
  cacheStrategy: 'cache-first',
  cacheTime: 10 * 60 * 1000,
  
  // 重试配置
  maxRetries: 2,
  retryStrategy: 'fixed-delay',
  retry: true,
  
  // 其他axios配置
  timeout: 5000,
  headers: { 'X-Custom': 'value' }
})
```

## 🚨 错误类型

- `network_error` - 网络连接错误
- `timeout_error` - 请求超时
- `server_error` - 服务器错误 (5xx)
- `client_error` - 客户端错误 (4xx)
- `authentication_error` - 认证失败 (401)
- `authorization_error` - 权限不足 (403)
- `validation_error` - 数据验证错误 (422)
- `rate_limit_error` - 请求频率限制 (429)

## 📊 性能优化

1. **请求缓存** - 减少重复请求
2. **请求去重** - 防止并发相同请求
3. **智能重试** - 网络错误自动重试
4. **并发控制** - 限制同时请求数量
5. **网络状态监控** - 离线时暂停请求

## 🔍 调试

开启详细日志：

```javascript
// 在浏览器控制台中查看请求日志
// [HTTP Request] req_xxx GET /api/users
// [HTTP Response] req_xxx 200 150ms
// [HTTP Cache] GET /api/users [cached]
```

## 📝 最佳实践

1. **使用业务服务** - 优先使用封装好的业务服务而不是直接调用HTTP方法
2. **合理设置缓存** - 根据数据更新频率设置合适的缓存时间
3. **错误处理** - 监听全局错误事件，提供用户友好的错误提示
4. **性能监控** - 定期检查缓存命中率和错误统计
5. **批量操作** - 对于多个相关请求，使用批量请求提升性能

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个HTTP服务封装。
