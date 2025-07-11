# 查询参数使用说明

## 概述

项目已添加了五个查询参数：`id`、`name`、`code`、`pid`、`dir`，这些参数可以用于后续查询后台服务。

## 路由配置

### 支持的查询参数格式

```url
/workspace
/workspace?id=198732297964114492
/workspace?id=198732297964114492&name=主页
/workspace?id=198732297964114492&name=主页&code=-ALGYLwX2tyuRfZu9xu-K
/workspace?id=198732297964114492&name=主页&code=-ALGYLwX2tyuRfZu9xu-K&pid=tzascvXx59JIZFj&dir=236010473579141113

/history
/history?id=198732297964114492&name=主页&code=-ALGYLwX2tyuRfZu9xu-K&pid=tzascvXx59JIZFj&dir=236010473579141113
```

### 参数说明

- `id`: 项目或文档ID (如: 198732297964114492)
- `name`: 页面或项目名称 (如: 主页)
- `code`: 代码标识符 (如: -ALGYLwX2tyuRfZu9xu-K)
- `pid`: 项目ID (如: tzascvXx59JIZFj)
- `dir`: 目录ID (如: 236010473579141113)

### 示例URL

```url
/workspace?id=198732297964114492&name=主页&code=-ALGYLwX2tyuRfZu9xu-K&pid=tzascvXx59JIZFj&dir=236010473579141113
/history?pid=tzascvXx59JIZFj&dir=236010473579141113
```

## 组件中的使用

### 在 Workspace.vue 中

```vue
<script setup>
// 查询参数会自动作为 props 传入
const props = defineProps({
  id: { type: String, default: null },
  name: { type: String, default: null },
  code: { type: String, default: null },
  pid: { type: String, default: null },
  dir: { type: String, default: null }
})

// 监听参数变化
watch(() => [props.id, props.name, props.code, props.pid, props.dir], (newParams) => {
  console.log('查询参数变化:', {
    id: newParams[0],
    name: newParams[1],
    code: newParams[2],
    pid: newParams[3],
    dir: newParams[4]
  })
  handleQueryParamsChange()
}, { immediate: true })
</script>
```

### 在 History.vue 中

```vue
<script setup>
// 同样的 props 定义和监听逻辑
const props = defineProps({
  id: { type: String, default: null },
  name: { type: String, default: null },
  code: { type: String, default: null },
  pid: { type: String, default: null },
  dir: { type: String, default: null }
})
</script>
```

## 辅助工具函数

### 导入辅助工具

```javascript
import {
  buildRouteObject,
  buildApiQueryParams,
  hasValidQueryParams
} from '@/utils/routeParamsHelper.js'
```

### 使用示例

```javascript
// 检查是否有有效参数
const queryParams = { id: props.id, name: props.name, code: props.code, pid: props.pid, dir: props.dir }
if (hasValidQueryParams(queryParams)) {
  // 构建API查询参数用于API调用
  const apiParams = buildApiQueryParams(queryParams)
  // 调用后台API
  await fetchDataFromBackend(apiParams)
}

// 页面跳转时保持参数
const goToHistory = () => {
  const routeObject = buildRouteObject('History', queryParams)
  router.push(routeObject)
}
```

## 后台API集成

### 查询参数构建

```javascript
const handleQueryParamsChange = () => {
  const queryParams = {
    id: props.id,
    name: props.name,
    code: props.code,
    pid: props.pid,
    dir: props.dir
  }

  if (hasValidQueryParams(queryParams)) {
    const apiParams = buildApiQueryParams(queryParams)

    // 示例：调用后台API
    fetchProjectData(apiParams)
    fetchDirectoryData(apiParams)
    fetchItemData(apiParams)
  }
}

// 示例API调用函数
async function fetchProjectData(params) {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  })
  return response.json()
}
```

## 页面间导航

### 保持参数的导航

所有页面间的导航都会自动保持当前的路由参数：

- 从工作台跳转到历史记录页面
- 从历史记录页面返回工作台
- 从历史记录中选择请求加载到工作台

### 编程式导航

```javascript
// 跳转到工作台并传递查询参数
router.push({
  name: 'Workspace',
  query: {
    id: '198732297964114492',
    name: '主页',
    code: '-ALGYLwX2tyuRfZu9xu-K',
    pid: 'tzascvXx59JIZFj',
    dir: '236010473579141113'
  }
})

// 跳转到历史记录页面并传递查询参数
router.push({
  name: 'History',
  query: { pid: 'tzascvXx59JIZFj', dir: '236010473579141113' }
})
```

## 注意事项

1. 所有查询参数都是可选的
2. 参数会自动作为字符串类型传递给组件
3. 空值参数在导航时会被自动过滤
4. 组件会在参数变化时自动重新执行相关逻辑
5. 参数变化会触发 watch 监听器，可以在此处理后台数据查询
6. 查询参数会显示在URL中，用户可以直接通过URL访问特定状态的页面
7. 中文参数会自动进行URL编码/解码处理
