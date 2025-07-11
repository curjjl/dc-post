/**
 * 查询参数使用示例
 * 演示如何在组件中使用查询参数进行后台API调用
 */

import { buildRouteObject, buildApiQueryParams, hasValidQueryParams } from '@/utils/routeParamsHelper.js'

// 示例：在组件中处理查询参数
export function handleQueryParamsExample(props, router) {
  // 构建查询参数对象
  const queryParams = {
    id: props.id,
    name: props.name,
    code: props.code,
    pid: props.pid,
    dir: props.dir
  }

  console.log('当前查询参数:', queryParams)

  // 检查是否有有效参数
  if (hasValidQueryParams(queryParams)) {
    // 构建API查询参数
    const apiParams = buildApiQueryParams(queryParams)
    console.log('API查询参数:', apiParams)

    // 调用后台服务
    fetchBackendData(apiParams)
  }
}

// 示例：页面跳转保持参数
export function navigateWithParams(router, targetPage, currentProps) {
  const queryParams = {
    id: currentProps.id,
    name: currentProps.name,
    code: currentProps.code,
    pid: currentProps.pid,
    dir: currentProps.dir
  }

  const routeObject = buildRouteObject(targetPage, queryParams)
  router.push(routeObject)
}

// 示例：后台API调用
async function fetchBackendData(params) {
  try {
    // 示例API调用 - 获取项目数据
    if (params.pid) {
      const projectResponse = await fetch(`/api/projects/${params.pid}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      const projectData = await projectResponse.json()
      console.log('项目数据:', projectData)
    }

    // 示例API调用 - 获取目录数据
    if (params.dir) {
      const dirResponse = await fetch(`/api/directories/${params.dir}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      const dirData = await dirResponse.json()
      console.log('目录数据:', dirData)
    }

    // 示例API调用 - 获取文档数据
    if (params.id) {
      const docResponse = await fetch(`/api/documents/${params.id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      const docData = await docResponse.json()
      console.log('文档数据:', docData)
    }

    // 示例API调用 - 根据代码获取数据
    if (params.code) {
      const codeResponse = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: params.code })
      })
      const codeData = await codeResponse.json()
      console.log('代码搜索结果:', codeData)
    }

  } catch (error) {
    console.error('API调用失败:', error)
  }
}

// 示例：URL构建
export function buildExampleUrls() {
  const examples = [
    {
      description: '基础工作台',
      url: '/workspace'
    },
    {
      description: '带ID的工作台',
      url: '/workspace?id=198732297964114492'
    },
    {
      description: '带名称的工作台',
      url: '/workspace?id=198732297964114492&name=主页'
    },
    {
      description: '完整参数的工作台',
      url: '/workspace?id=198732297964114492&name=主页&code=-ALGYLwX2tyuRfZu9xu-K&pid=tzascvXx59JIZFj&dir=236010473579141113'
    },
    {
      description: '历史记录页面',
      url: '/history?pid=tzascvXx59JIZFj&dir=236010473579141113'
    }
  ]

  console.log('URL示例:')
  examples.forEach(example => {
    console.log(`${example.description}: ${example.url}`)
  })

  return examples
}

// 示例：参数验证
export function validateQueryParams(params) {
  const validations = {
    id: params.id && /^\d+$/.test(params.id),
    name: params.name && params.name.length > 0,
    code: params.code && params.code.length > 0,
    pid: params.pid && params.pid.length > 0,
    dir: params.dir && /^\d+$/.test(params.dir)
  }

  console.log('参数验证结果:', validations)
  return validations
}

// 示例：参数转换
export function transformParamsForApi(queryParams) {
  const apiParams = {}

  // ID转换为数字
  if (queryParams.id) {
    apiParams.documentId = parseInt(queryParams.id, 10)
  }

  // 名称保持字符串
  if (queryParams.name) {
    apiParams.documentName = queryParams.name
  }

  // 代码保持字符串
  if (queryParams.code) {
    apiParams.accessCode = queryParams.code
  }

  // 项目ID保持字符串
  if (queryParams.pid) {
    apiParams.projectId = queryParams.pid
  }

  // 目录ID转换为数字
  if (queryParams.dir) {
    apiParams.directoryId = parseInt(queryParams.dir, 10)
  }

  return apiParams
}
