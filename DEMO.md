# Vue API Tester 使用演示

## 🚀 快速开始

### 1. 启动应用

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

应用将在 http://localhost:3001 启动（如果3000端口被占用）

### 2. 启动测试API（可选）

```bash
# 启动测试API服务器
node test-api.js
```

测试API将在 http://localhost:3001 启动

## 📋 功能演示

### 基本请求测试

1. **GET请求测试**
   - URL: `http://localhost:3001/api/test`
   - 方法: GET
   - 添加Query参数: `name=test&version=1.0`
   - 点击"发送"按钮

2. **POST请求测试**
   - URL: `http://localhost:3001/api/test`
   - 方法: POST
   - 切换到"请求体"标签
   - 选择"Raw"类型，语言选择"JSON"
   - 输入JSON数据:
     ```json
     {
       "name": "Vue API Tester",
       "version": "1.0.0",
       "description": "API测试工具"
     }
     ```

### 环境变量使用

1. **设置环境变量**
   - 点击顶部"环境变量"按钮
   - 添加变量:
     - `baseUrl`: `http://localhost:3001`
     - `apiVersion`: `v1`
     - `token`: `your-test-token`

2. **使用环境变量**
   - URL输入: `{{baseUrl}}/api/test`
   - Headers添加: `Authorization: Bearer {{token}}`

### 认证测试

1. **Bearer Token认证**
   - 切换到"认证"标签
   - 选择"Bearer Token"
   - 输入Token: `test-token-123`

2. **Basic Auth认证**
   - 选择"Basic Auth"
   - 用户名: `admin`
   - 密码: `password`

### 历史记录功能

1. **查看历史**
   - 左侧面板显示最近的请求历史
   - 点击任意历史记录可重新加载配置

2. **历史记录管理**
   - 点击顶部"历史记录"进入完整历史页面
   - 支持搜索、删除、清空操作

### 代码生成

1. **生成代码**
   - 配置完请求后，点击"生成代码"按钮
   - 选择目标语言（cURL、JavaScript、Python等）
   - 复制生成的代码到你的项目中

## 🧪 测试场景

### 场景1：API状态检查
```
GET http://localhost:3001/api/test
预期: 200 OK，返回基本信息
```

### 场景2：数据提交
```
POST http://localhost:3001/api/test
Content-Type: application/json
Body: {"message": "Hello World"}
预期: 200 OK，返回提交的数据
```

### 场景3：错误处理
```
GET http://localhost:3001/api/error
预期: 500 Internal Server Error
```

### 场景4：404测试
```
GET http://localhost:3001/api/notfound
预期: 404 Not Found
```

### 场景5：延迟测试
```
GET http://localhost:3001/api/slow?delay=3000
预期: 3秒后返回响应
```

## 💡 使用技巧

### 1. 快捷操作
- `Ctrl+Enter`: 发送请求
- `Ctrl+/`: 格式化JSON
- `Esc`: 关闭对话框

### 2. 环境变量最佳实践
```
开发环境:
- baseUrl: http://localhost:3001
- apiKey: dev-key-123

生产环境:
- baseUrl: https://api.production.com
- apiKey: prod-key-456
```

### 3. Headers预设
常用Headers会自动提示：
- `Content-Type: application/json`
- `Authorization: Bearer token`
- `Accept: application/json`
- `User-Agent: Vue-API-Tester/1.0`

### 4. 响应分析
- 状态码颜色编码（绿色=成功，红色=错误）
- 响应时间监控
- 响应大小统计
- 自动JSON格式化

## 🔧 高级功能

### 1. 批量测试（计划中）
- 导入请求集合
- 顺序执行多个请求
- 结果对比分析

### 2. 脚本支持（计划中）
- 前置脚本（Pre-request Script）
- 后置脚本（Post-response Script）
- 变量提取和设置

### 3. 断言测试（计划中）
- 状态码断言
- 响应体内容断言
- 响应时间断言

## 🐛 故障排除

### 常见问题

1. **CORS错误**
   - 确保API服务器支持CORS
   - 或使用浏览器扩展禁用CORS检查

2. **请求超时**
   - 检查网络连接
   - 确认API服务器正在运行

3. **JSON格式错误**
   - 使用"格式化"按钮检查JSON语法
   - 确保引号和括号匹配

### 调试技巧

1. **查看网络请求**
   - 打开浏览器开发者工具
   - 切换到Network标签
   - 查看实际发送的请求

2. **检查控制台错误**
   - 打开Console标签
   - 查看JavaScript错误信息

## 📞 支持

如果遇到问题或有功能建议，请：
1. 查看README.md文档
2. 检查已知问题列表
3. 提交Issue或Pull Request

---

**享受API测试的乐趣！** 🎉
