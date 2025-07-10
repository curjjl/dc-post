# Vue API Tester

一个基于Vue 3的网页版API调试工具，类似Postman或Talend API Tester。

## 技术栈

- **Vue 3** - 使用组合式API
- **Ant Design Vue v4.x** - UI组件库
- **Vue Router 4** - 路由管理
- **Axios** - HTTP请求库
- **Monaco Editor** - 代码编辑器（语法高亮）
- **Vite** - 构建工具

## 核心功能

### 1. 主界面布局
- **左侧面板**: 请求历史记录（可折叠）
- **中部工作区**: API调试主要操作区域
- **右侧面板**: 响应结果展示

### 2. 请求配置
- **请求方法**: 支持GET/POST/PUT/DELETE/PATCH/HEAD/OPTIONS
- **URL输入**: 支持环境变量替换（如 `{{baseUrl}}/endpoint`）
- **参数管理**: 
  - Query参数：动态键值对表格
  - Headers：预设常用Content-Type
- **认证支持**: Basic Auth/Bearer Token/OAuth 2.0

### 3. 请求体编辑器
- **Monaco Editor集成**: 
  - 语法高亮（JSON/XML/HTML/TEXT）
  - JSON格式校验和自动格式化
- **多种Body类型**: raw/form-data/x-www-form-urlencoded

### 4. 响应展示
- **状态信息**: 响应状态码、耗时、大小统计
- **三栏式展示**: 
  - Body（语法高亮+格式化）
  - Headers（键值表格）
  - Cookies（列表展示）

### 5. 历史记录
- **本地存储**: 使用localStorage保存请求记录
- **历史管理**: 点击历史记录自动填充请求配置
- **搜索功能**: 支持URL和方法搜索

### 6. 环境变量管理
- **多环境支持**: 创建和切换不同环境
- **变量替换**: 在URL、Headers中使用`{{variable}}`语法
- **导入导出**: JSON格式配置文件

### 7. 代码生成器
- **多语言支持**: 
  - cURL命令
  - JavaScript (Fetch API)
  - Python (Requests)
  - Java (OkHttp)
  - PHP (cURL)
  - Go (net/http)
- **自定义选项**: 包含Headers、认证、注释等

### 8. 附加功能
- **主题切换**: 支持明暗主题
- **响应式设计**: 使用Ant Design栅格系统
- **错误处理**: 完善的错误提示和状态反馈

## 项目结构

```
src/
├── components/          # 组件目录
│   ├── RequestConfig.vue    # 请求配置组件
│   ├── ResponsePanel.vue    # 响应展示组件
│   ├── HistoryPanel.vue     # 历史记录组件
│   ├── ParamsTable.vue      # 参数表格组件
│   ├── AuthConfig.vue       # 认证配置组件
│   ├── BodyEditor.vue       # 请求体编辑器
│   ├── EnvManager.vue       # 环境变量管理
│   └── CodeGenerator.vue    # 代码生成器
├── services/            # 服务目录
│   ├── httpService.js       # HTTP请求服务
│   └── envService.js        # 环境变量服务
├── views/              # 页面目录
│   ├── Workspace.vue        # 主工作台
│   └── History.vue          # 历史记录页面
├── router/             # 路由配置
│   └── index.js
├── App.vue             # 根组件
└── main.js             # 入口文件
```

## 安装和运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 快速开始

1. **启动应用**
   ```bash
   npm run dev
   ```
   应用将在 http://localhost:3000 启动

2. **测试API（可选）**

   为了方便测试，项目包含了一个简单的测试API服务器：
   ```bash
   # 安装express和cors（如果需要）
   npm install express cors

   # 启动测试API服务器
   node test-api.js
   ```
   测试API将在 http://localhost:3001 启动

3. **开始使用**
   - 在URL输入框中输入：`http://localhost:3001/api/test`
   - 选择请求方法（GET/POST等）
   - 点击"发送"按钮
   - 查看右侧的响应结果

## 测试端点

如果启动了测试API服务器，可以使用以下端点进行测试：

- `GET http://localhost:3001/api/test` - 基本GET请求
- `POST http://localhost:3001/api/test` - 基本POST请求
- `PUT http://localhost:3001/api/test/123` - PUT请求（带参数）
- `DELETE http://localhost:3001/api/test/123` - DELETE请求
- `GET http://localhost:3001/api/error` - 返回500错误
- `GET http://localhost:3001/api/notfound` - 返回404错误
- `GET http://localhost:3001/api/slow?delay=2000` - 延迟响应（2秒）

## 使用说明

### 基本工作流程

1. **配置请求**: 选择HTTP方法，输入URL，设置参数和Headers
2. **设置认证**: 根据需要选择认证方式
3. **编辑请求体**: 对于POST/PUT/PATCH请求，编辑请求体内容
4. **发送请求**: 点击发送按钮执行请求
5. **查看响应**: 在右侧面板查看响应结果
6. **保存历史**: 请求自动保存到历史记录

### 环境变量使用

1. 点击顶部"环境变量"按钮打开管理界面
2. 创建或选择环境，添加变量（如：`baseUrl: https://api.example.com`）
3. 在URL或Headers中使用`{{baseUrl}}`语法引用变量

### 代码生成

1. 配置完请求后，点击"生成代码"按钮
2. 选择目标语言和选项
3. 复制生成的代码到你的项目中

## 特性亮点

- **现代化UI**: 基于Ant Design Vue的美观界面
- **实时预览**: Monaco编辑器提供实时语法检查
- **智能提示**: Headers和参数的自动完成
- **批量操作**: 支持参数的批量添加和删除
- **响应式布局**: 适配不同屏幕尺寸
- **数据持久化**: 本地存储历史记录和环境配置

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 项目状态

✅ **已完成功能**
- [x] 主界面布局（三栏式设计）
- [x] 请求配置（方法、URL、参数、Headers、认证）
- [x] Monaco编辑器集成（语法高亮、格式化）
- [x] 响应展示（状态、Body、Headers、Cookies）
- [x] 历史记录管理（本地存储、搜索、重用）
- [x] 环境变量管理（多环境、导入导出）
- [x] 代码生成器（6种语言支持）
- [x] 主题切换（明暗模式）
- [x] 响应式设计

⚠️ **已知问题**
- 编译时有一个defineExpose警告（不影响功能）
- 部分组件有v-model警告（已修复大部分）

## 开发计划

- [ ] 批量测试功能
- [ ] 请求集合管理
- [ ] 测试脚本支持
- [ ] 响应断言
- [ ] 性能测试
- [ ] 团队协作功能
- [ ] WebSocket支持
- [ ] GraphQL支持

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

MIT License
