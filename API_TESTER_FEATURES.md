# Vue API Tester 功能测试指南

## 新增功能概览

### 1. URL查询参数显示优化 ✅
**问题修复**: 解决了URL显示中的过度编码问题

**测试步骤**:
1. 在Query参数列表中添加参数：
   - `filter` = `{"tenant_id":"sdfjksdjf=1212,dfjkdfjdkjf=2324,dfkdfkdjkdjf=455是的萨芬的萨芬的678"}`
   - `sort` = `-order`
   - `pk` = `id`

2. 观察URL显示框，应该显示为：
   ```
   http://192.168.201.129:20831/code_bricks/menu?filter={"tenant_id":"sdfjksdjf=1212,dfjkdfjdkjf=2324,dfkdfkdjkdjf=455是的萨芬的萨芬的678"}&sort=-order&pk=id
   ```

3. 发送请求时，系统会自动对参数进行正确的URL编码

**技术实现**:
- `buildFullUrl()`: 用于友好显示，最小化编码
- `buildRequestUrl()`: 用于实际HTTP请求，完全编码
- 只对必要字符（空格、&符号）进行编码，保持JSON等格式的可读性

### 2. 文件上传功能 ✅
**新增功能**: 支持multipart/form-data文件上传

**测试步骤**:
1. 选择请求方法为 POST/PUT/PATCH
2. 切换到 Body 标签页
3. 选择 "Form Data" 类型
4. 添加参数：
   - 参数名: `file`
   - 类型: 选择 `File`
   - 点击"选择文件"按钮上传文件

5. 可以混合添加文本字段和文件字段：
   - 文本字段: `name` = `test document`
   - 文件字段: `document` = 选择文件

**支持的功能**:
- ✅ 单文件上传
- ✅ 多字段混合（文本+文件）
- ✅ 文件类型自动检测
- ✅ 文件名显示
- ✅ 文件删除功能

### 3. 增强的Form Data编辑器 ✅
**新增功能**: 专门的FormDataTable组件

**特性**:
- **类型选择**: 每个字段可选择 Text 或 File 类型
- **文件上传**: 集成的文件选择器
- **描述字段**: 为每个参数添加描述
- **智能提示**: 常用字段名的自动完成
- **样式优化**: 更好的用户界面

### 4. HTTP请求发送优化 ✅
**改进功能**: 完善的请求处理逻辑

**技术改进**:
- **正确的Content-Type处理**: 文件上传时自动设置multipart/form-data
- **文件对象处理**: 正确处理File对象和FormData
- **编码分离**: 显示URL和请求URL分离处理
- **错误处理**: 更好的错误提示和处理

## 完整测试用例

### 测试用例 1: URL参数解析
```
输入URL: http://api.example.com/users?page=1&filter={"status":"active"}&sort=-created_at
预期结果: 
- page = 1
- filter = {"status":"active"}  
- sort = -created_at
```

### 测试用例 2: 文件上传
```
请求类型: POST
URL: http://localhost:8080/upload
Body类型: Form Data
参数:
- name (Text) = "测试文档"
- category (Text) = "document"
- file (File) = 选择一个文件
- description (Text) = "这是一个测试文件"
```

### 测试用例 3: 混合参数
```
URL: http://api.example.com/submit?action=upload&format=json
Body类型: Form Data
参数:
- title (Text) = "My Document"
- file (File) = document.pdf
- tags (Text) = "important,work"
```

## 与Postman/API Tester对比

### 相似功能
- ✅ 多种请求类型支持 (GET, POST, PUT, DELETE, etc.)
- ✅ Headers管理
- ✅ Query参数管理  
- ✅ 多种Body类型 (Raw, Form Data, URL Encoded)
- ✅ 文件上传支持
- ✅ 请求历史记录
- ✅ 环境变量支持
- ✅ 响应查看器

### 独特优势
- ✅ **友好的URL显示**: 不过度编码，保持可读性
- ✅ **智能参数提示**: 常用参数的自动完成和描述
- ✅ **现代化界面**: 基于Ant Design Vue的美观界面
- ✅ **主题切换**: 支持深色/浅色主题
- ✅ **代码生成**: 自动生成各种语言的请求代码

## 使用建议

### 1. API开发测试
- 使用Raw JSON进行API接口测试
- 利用环境变量管理不同环境的URL
- 使用历史记录快速重复测试

### 2. 文件上传测试
- 选择Form Data类型
- 混合使用文本字段和文件字段
- 注意文件大小限制

### 3. 复杂查询参数
- 直接在URL中输入复杂参数
- 系统会自动解析到参数列表
- 在参数列表中进行精细调整

## 技术架构

### 前端技术栈
- **Vue 3**: Composition API
- **Ant Design Vue**: UI组件库
- **Monaco Editor**: 代码编辑器
- **Axios**: HTTP客户端

### 核心组件
- **RequestConfig**: 请求配置主组件
- **FormDataTable**: 文件上传表单组件
- **ParamsTable**: 通用参数表格组件
- **BodyEditor**: 请求体编辑器
- **ResponsePanel**: 响应显示面板

### 服务层
- **HttpService**: HTTP请求服务
- **EnvService**: 环境变量服务

这个API测试工具现在具备了与Postman和Chrome API Tester扩展相当的功能，同时在用户体验和界面设计上有所创新。
