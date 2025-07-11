# 环境变量解析功能测试指南

## 功能概述

现在API在线调试功能已经完全支持环境变量解析，包括：
- URL中的环境变量
- Query参数中的环境变量
- Headers中的环境变量
- 认证信息中的环境变量
- 请求体中的环境变量

## 测试准备

### 1. 设置环境变量

首先在环境变量管理界面设置以下测试变量：

```json
{
  "baseUrl": "https://api.example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
  "apiKey": "sk-1234567890abcdef",
  "userId": "12345",
  "tenantId": "tenant-abc-123",
  "version": "v1",
  "contentType": "application/json"
}
```

### 2. 测试场景

## 测试场景1：URL环境变量解析

**测试步骤：**
1. 在URL输入框中输入：`{{baseUrl}}/{{version}}/users/{{userId}}`
2. 观察URL显示框应该显示：`https://api.example.com/v1/users/12345`
3. 发送请求验证环境变量被正确替换

## 测试场景2：Query参数环境变量解析

**测试步骤：**
1. 设置URL：`{{baseUrl}}/{{version}}/data`
2. 在Query参数中添加：
   - `api_key` = `{{apiKey}}`
   - `tenant_id` = `{{tenantId}}`
   - `user_id` = `{{userId}}`
3. 观察完整URL应该显示：
   ```
   https://api.example.com/v1/data?api_key=sk-1234567890abcdef&tenant_id=tenant-abc-123&user_id=12345
   ```

## 测试场景3：Headers环境变量解析

**测试步骤：**
1. 在Headers标签页中添加：
   - `Authorization` = `Bearer {{token}}`
   - `Content-Type` = `{{contentType}}`
   - `X-API-Key` = `{{apiKey}}`
   - `X-Tenant-ID` = `{{tenantId}}`
2. 发送请求，检查实际发送的Headers是否正确替换了环境变量

## 测试场景4：认证信息环境变量解析

### Bearer Token认证测试
**测试步骤：**
1. 切换到认证标签页
2. 选择"Bearer Token"类型
3. 在Token输入框中输入：`{{token}}`
4. 发送请求，验证Authorization header是否正确设置

### Basic Auth认证测试
**测试步骤：**
1. 先设置环境变量：
   ```json
   {
     "username": "testuser",
     "password": "testpass123"
   }
   ```
2. 选择"Basic Auth"类型
3. 用户名输入：`{{username}}`
4. 密码输入：`{{password}}`
5. 发送请求，验证Basic认证是否正确

## 测试场景5：请求体环境变量解析

### Raw JSON请求体测试
**测试步骤：**
1. 选择POST方法
2. 切换到Body标签页，选择"Raw"类型
3. 输入JSON内容：
   ```json
   {
     "user_id": "{{userId}}",
     "tenant_id": "{{tenantId}}",
     "api_key": "{{apiKey}}",
     "data": {
       "token": "{{token}}",
       "version": "{{version}}"
     }
   }
   ```
4. 发送请求，验证请求体中的环境变量是否被正确替换

### Form Data请求体测试
**测试步骤：**
1. 选择POST方法
2. 切换到Body标签页，选择"Form Data"类型
3. 添加表单字段：
   - `user_id` = `{{userId}}`
   - `api_key` = `{{apiKey}}`
   - `tenant_id` = `{{tenantId}}`
4. 发送请求，验证表单数据中的环境变量是否被正确替换

### URL Encoded请求体测试
**测试步骤：**
1. 选择POST方法
2. 切换到Body标签页，选择"URL Encoded"类型
3. 添加字段：
   - `grant_type` = `client_credentials`
   - `client_id` = `{{apiKey}}`
   - `client_secret` = `{{token}}`
4. 发送请求，验证URL编码数据中的环境变量是否被正确替换

## 测试场景6：代码生成器环境变量解析

**测试步骤：**
1. 配置一个包含环境变量的完整请求（URL、Headers、认证、请求体）
2. 点击"生成代码"按钮
3. 选择不同的语言（cURL、JavaScript、Python等）
4. 验证生成的代码中环境变量是否被正确替换

### 预期结果示例（cURL）：
```bash
curl -X POST "https://api.example.com/v1/users/12345" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk-1234567890abcdef" \
  -d '{"user_id":"12345","tenant_id":"tenant-abc-123"}'
```

## 测试场景7：嵌套和复杂环境变量

**测试步骤：**
1. 设置复杂的环境变量：
   ```json
   {
     "baseUrl": "https://api.example.com",
     "endpoint": "{{baseUrl}}/v1/users",
     "authHeader": "Bearer {{token}}"
   }
   ```
2. 在URL中使用：`{{endpoint}}/{{userId}}`
3. 验证嵌套环境变量是否能正确解析

## 验证要点

1. **环境变量格式**：确保`{{variableName}}`格式的变量能被正确识别
2. **未定义变量处理**：未定义的环境变量应该保持原样，不被替换
3. **特殊字符处理**：环境变量值中包含特殊字符时应该正确处理
4. **实时更新**：修改环境变量后，所有使用该变量的地方应该立即更新
5. **代码生成一致性**：生成的代码应该与实际发送的请求保持一致

## 常见问题排查

1. **环境变量不生效**：
   - 检查变量名是否正确（区分大小写）
   - 确认环境变量已保存到localStorage
   - 验证变量格式是否为`{{variableName}}`

2. **部分环境变量不替换**：
   - 检查是否有语法错误（如缺少大括号）
   - 确认变量名中没有特殊字符

3. **请求失败**：
   - 检查替换后的值是否正确
   - 验证API端点和认证信息是否有效
