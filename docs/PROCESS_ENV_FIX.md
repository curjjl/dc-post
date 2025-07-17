# Process.env 错误修复方案

## 问题描述

项目运行时出现错误：
```
index.js:21 Uncaught ReferenceError: process is not defined
    at index.js:21:12
```

## 问题原因

在 Vite 构建的 Vue 3 项目中，`process.env` 对象在浏览器环境中是未定义的。这是因为：

1. `process` 是 Node.js 的全局对象，在浏览器中不存在
2. Vite 使用 `import.meta.env` 来访问环境变量，而不是 `process.env`
3. 只有以 `VITE_` 开头的环境变量才会暴露给客户端代码

## 修复方案

### 1. 修改 API 配置文件

**文件**: `src/api/index.js`

**修改前**:
```javascript
export const apiConfig = {
  baseURL: process.env.VUE_APP_API_BASE_URL || '/api',
  // ...
}
```

**修改后**:
```javascript
export const apiConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  // ...
}
```

### 2. 更新环境变量文件

**文件**: `.env.development` 和 `.env.production`

**修改前**:
```bash
VUE_APP_API_BASE_URL="http://192.168.201.129:21930"
```

**修改后**:
```bash
VITE_API_BASE_URL="http://192.168.201.129:21930"
```

### 3. 更新 Vite 配置

**文件**: `vite.config.js`

添加 `process.env` 兼容性支持：
```javascript
export default defineConfig({
  // ...
  define: {
    global: 'globalThis',
    // 为了兼容性，定义 process.env（虽然推荐使用 import.meta.env）
    'process.env': {}
  }
})
```

### 4. 创建基础环境变量文件

**文件**: `.env`
```bash
# API配置
VITE_API_BASE_URL=/api

# 应用配置
VITE_APP_TITLE=Vue API Tester
VITE_APP_VERSION=1.0.0

# 其他配置
VITE_ENABLE_MOCK=false
VITE_ENABLE_DEBUG=true
```

## 环境变量命名规则

### Vite 项目
- 客户端可访问：`VITE_*`
- 服务端专用：任意名称（不以 VITE_ 开头）

### Vue CLI 项目（旧）
- 客户端可访问：`VUE_APP_*`
- 服务端专用：任意名称

## 验证修复

1. 启动开发服务器：
```bash
npm run dev
```

2. 检查控制台是否还有 "process is not defined" 错误

3. 使用测试页面验证：`http://localhost:3000/src/test/test-env-fix.html`

## 最佳实践

1. **使用 import.meta.env**：在 Vite 项目中始终使用 `import.meta.env` 而不是 `process.env`

2. **环境变量命名**：客户端环境变量必须以 `VITE_` 开头

3. **类型安全**：考虑创建环境变量类型定义：
```typescript
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_TITLE: string
  // ...
}
```

4. **默认值**：始终为环境变量提供合理的默认值

## 相关文件

- `src/api/index.js` - API 配置文件
- `.env` - 基础环境变量
- `.env.development` - 开发环境变量
- `.env.production` - 生产环境变量
- `vite.config.js` - Vite 配置文件
- `src/test/test-env-fix.html` - 修复验证测试页面

## 注意事项

1. 重启开发服务器以使环境变量更改生效
2. 生产构建时确保所有必要的环境变量都已设置
3. 不要在客户端代码中暴露敏感信息（API 密钥等）
