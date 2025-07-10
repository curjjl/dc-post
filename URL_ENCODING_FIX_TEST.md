# URL编码和环境变量修复测试

## 修复内容

### 1. URL查询参数显示问题
**问题**: Query参数列表中的复杂JSON参数在URL中被过度编码
**修复**: 分离显示URL和请求URL的处理逻辑

### 2. 环境变量替换问题  
**问题**: 环境变量在URL中未被正确替换
**修复**: 在URL构建时优先处理环境变量替换

## 测试用例

### 测试用例 1: 复杂JSON参数显示
**设置Query参数**:
```
filter = {"tenant_id":"sdfjksdjf=1212,dfjkdfjdkjf=2324,dfkdfkdjkdjf=455是的萨芬的萨芬的678"}
sort = -order
pk = id
```

**期望的URL显示**:
```
http://192.168.201.129:20831/code_bricks/menu?filter={"tenant_id":"sdfjksdjf=1212,dfjkdfjdkjf=2324,dfkdfkdjkdjf=455是的萨芬的萨芬的678"}&sort=-order&pk=id
```

**实际HTTP请求URL**（编码后）:
```
http://192.168.201.129:20831/code_bricks/menu?filter=%7B%22tenant_id%22%3A%22sdfjksdjf%3D1212%2Cdfjkdfjdkjf%3D2324%2Cdfkdfkdjkdjf%3D455%E6%98%AF%E7%9A%84%E8%90%A8%E8%8A%AC%E7%9A%84%E8%90%A8%E8%8A%AC%E7%9A%84678%22%7D&sort=-order&pk=id
```

### 测试用例 2: 环境变量替换
**设置环境变量**:
```
baseUrl = https://api.example.com
version = v1
```

**输入URL**:
```
{{baseUrl}}/api/{{version}}/users
```

**期望的URL显示**:
```
https://api.example.com/api/v1/users
```

**实际HTTP请求URL**:
```
https://api.example.com/api/v1/users
```

### 测试用例 3: 混合场景（环境变量 + 复杂参数）
**设置环境变量**:
```
baseUrl = https://api.example.com
version = v1
```

**输入URL**:
```
{{baseUrl}}/api/{{version}}/search
```

**设置Query参数**:
```
q = {"type":"user","status":"active"}
limit = 10
```

**期望的URL显示**:
```
https://api.example.com/api/v1/search?q={"type":"user","status":"active"}&limit=10
```

## 技术实现

### 核心函数

#### 1. buildFullUrl() - 显示用URL
```javascript
// 用于界面显示，保持可读性
// - 处理环境变量替换
// - 不进行URL编码
// - 保持JSON等复杂参数的可读性
```

#### 2. buildRequestUrl() - 请求用URL  
```javascript
// 用于实际HTTP请求
// - 处理环境变量替换
// - 完全URL编码所有参数
// - 确保HTTP请求的正确性
```

#### 3. processEnvironmentVariables() - 环境变量处理
```javascript
// 统一的环境变量替换逻辑
// - 替换 {{variableName}} 格式的变量
// - 从localStorage读取环境变量配置
```

### 处理流程

1. **用户输入/修改参数** → 触发URL更新
2. **buildFullUrl()** → 生成友好显示的URL
3. **用户点击发送** → 调用buildRequestUrl()
4. **buildRequestUrl()** → 生成正确编码的请求URL
5. **httpService** → 使用请求URL发送HTTP请求

## 验证步骤

### 步骤 1: 测试URL显示
1. 打开API测试工具
2. 在Query参数中添加复杂JSON参数
3. 检查URL输入框显示是否友好可读
4. 确认没有过度编码

### 步骤 2: 测试环境变量
1. 打开环境变量管理
2. 设置baseUrl和version变量
3. 在URL中使用{{baseUrl}}和{{version}}
4. 检查URL显示是否正确替换
5. 发送请求，检查Network面板中的实际请求URL

### 步骤 3: 测试实际请求
1. 设置复杂参数和环境变量
2. 发送请求
3. 在浏览器Network面板中检查：
   - 请求URL是否正确
   - 参数是否正确编码
   - 环境变量是否正确替换

## 预期结果

✅ **URL显示友好**: 复杂JSON参数在界面中保持可读性
✅ **环境变量正确替换**: {{variable}}格式正确替换为实际值  
✅ **HTTP请求正确**: 实际请求中参数正确编码
✅ **兼容性**: 与Postman/API Tester行为一致

## 注意事项

1. **显示 vs 请求**: 界面显示的URL和实际请求的URL可能不同
2. **编码时机**: 只在实际发送请求时进行URL编码
3. **环境变量优先级**: 环境变量替换在URL编码之前进行
4. **向后兼容**: 保持与现有功能的兼容性

这个修复确保了API测试工具的URL处理行为与主流工具（Postman、Chrome API Tester）保持一致，同时提供了更好的用户体验。
