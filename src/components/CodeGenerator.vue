<template>
  <a-modal
    :open="visible"
    title="代码生成器"
    width="800px"
    :footer="null"
    @cancel="handleCancel"
  >
    <div class="code-generator">
      <!-- 语言选择 -->
      <div class="language-selector">
        <a-radio-group v-model:value="selectedLanguage" @change="generateCode">
          <a-radio-button value="curl">cURL</a-radio-button>
          <a-radio-button value="javascript">JavaScript</a-radio-button>
          <a-radio-button value="python">Python</a-radio-button>
          <a-radio-button value="java">Java</a-radio-button>
          <a-radio-button value="php">PHP</a-radio-button>
          <a-radio-button value="go">Go</a-radio-button>
        </a-radio-group>
      </div>

      <!-- 代码显示区域 -->
      <div class="code-display">
        <div class="code-header">
          <span class="code-title">{{ getLanguageTitle() }}</span>
          <a-button size="small" @click="copyCode">
            <template #icon><CopyOutlined /></template>
            复制代码
          </a-button>
        </div>
        
        <div ref="codeContainer" class="code-container">
          <pre><code>{{ generatedCode }}</code></pre>
        </div>
      </div>

      <!-- 选项配置 -->
      <div class="options-section">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-checkbox v-model:checked="options.includeHeaders" @change="generateCode">
              包含Headers
            </a-checkbox>
          </a-col>
          <a-col :span="12">
            <a-checkbox v-model:checked="options.includeAuth" @change="generateCode">
              包含认证信息
            </a-checkbox>
          </a-col>
        </a-row>
        <a-row :gutter="16" style="margin-top: 8px">
          <a-col :span="12">
            <a-checkbox v-model:checked="options.prettify" @change="generateCode">
              格式化输出
            </a-checkbox>
          </a-col>
          <a-col :span="12">
            <a-checkbox v-model:checked="options.includeComments" @change="generateCode">
              包含注释
            </a-checkbox>
          </a-col>
        </a-row>
      </div>

      <!-- 操作按钮 -->
      <div class="actions">
        <a-space>
          <a-button @click="handleCancel">关闭</a-button>
          <a-button type="primary" @click="copyCode">
            <template #icon><CopyOutlined /></template>
            复制代码
          </a-button>
        </a-space>
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { CopyOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import envService from '@/services/envService.js'
import { processEnvironmentVariables } from '@/utils/envUtils.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  requestData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:visible'])

// 数据状态
const selectedLanguage = ref('curl')
const generatedCode = ref('')
const codeContainer = ref(null)

// 选项配置
const options = ref({
  includeHeaders: true,
  includeAuth: true,
  prettify: true,
  includeComments: true
})

// 获取语言标题
const getLanguageTitle = () => {
  const titles = {
    curl: 'cURL Command',
    javascript: 'JavaScript (Fetch API)',
    python: 'Python (Requests)',
    java: 'Java (OkHttp)',
    php: 'PHP (cURL)',
    go: 'Go (net/http)'
  }
  return titles[selectedLanguage.value] || 'Code'
}

// 生成代码
const generateCode = () => {
  if (!props.requestData.url) {
    generatedCode.value = '// 请先配置请求信息'
    return
  }

  const generators = {
    curl: generateCurl,
    javascript: generateJavaScript,
    python: generatePython,
    java: generateJava,
    php: generatePHP,
    go: generateGo
  }

  const generator = generators[selectedLanguage.value]
  if (generator) {
    generatedCode.value = generator()
  }
}

// 生成cURL代码
const generateCurl = () => {
  const { method, url, headers, queryParams, body, auth } = props.requestData
  let code = `curl -X ${method}`

  // 处理URL和查询参数
  let fullUrl = processEnvironmentVariables(url)
  if (queryParams && queryParams.length > 0) {
    const params = new URLSearchParams()
    queryParams.forEach(param => {
      if (param.enabled && param.key) {
        // 处理环境变量替换
        const processedKey = processEnvironmentVariables(param.key)
        const processedValue = processEnvironmentVariables(param.value)
        params.append(processedKey, processedValue)
      }
    })
    if (params.toString()) {
      fullUrl += '?' + params.toString()
    }
  }
  code += ` "${fullUrl}"`

  // 处理Headers
  if (options.value.includeHeaders && headers) {
    headers.forEach(header => {
      if (header.enabled && header.key) {
        // 处理环境变量替换
        const processedKey = processEnvironmentVariables(header.key)
        const processedValue = processEnvironmentVariables(header.value)
        code += ` \\\n  -H "${processedKey}: ${processedValue}"`
      }
    })
  }

  // 处理认证
  if (options.value.includeAuth && auth && auth.type !== 'none') {
    if (auth.type === 'basic' && auth.basic.username) {
      // 处理环境变量替换
      const processedUsername = processEnvironmentVariables(auth.basic.username)
      const processedPassword = processEnvironmentVariables(auth.basic.password)
      code += ` \\\n  -u "${processedUsername}:${processedPassword}"`
    } else if (auth.type === 'bearer' && auth.bearer.token) {
      // 处理环境变量替换
      const processedToken = processEnvironmentVariables(auth.bearer.token)
      code += ` \\\n  -H "Authorization: Bearer ${processedToken}"`
    }
  }

  // 处理请求体
  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    if (body.type === 'raw' && body.raw) {
      // 处理环境变量替换
      const processedBody = processEnvironmentVariables(body.raw)
      const escapedBody = processedBody.replace(/'/g, "\\'")
      code += ` \\\n  -d '${escapedBody}'`
    } else if (body.type === 'form-data' && body.formData) {
      body.formData.forEach(item => {
        if (item.enabled && item.key) {
          // 处理环境变量替换
          const processedKey = processEnvironmentVariables(item.key)
          const processedValue = processEnvironmentVariables(item.value)
          code += ` \\\n  -F "${processedKey}=${processedValue}"`
        }
      })
    }
  }

  return code
}

// 生成JavaScript代码
const generateJavaScript = () => {
  const { method, url, headers, queryParams, body, auth } = props.requestData
  let code = ''

  if (options.value.includeComments) {
    code += '// 发送HTTP请求\n'
  }

  // 构建URL
  let fullUrl = processEnvironmentVariables(url)
  if (queryParams && queryParams.length > 0) {
    const params = new URLSearchParams()
    queryParams.forEach(param => {
      if (param.enabled && param.key) {
        // 处理环境变量替换
        const processedKey = processEnvironmentVariables(param.key)
        const processedValue = processEnvironmentVariables(param.value)
        params.append(processedKey, processedValue)
      }
    })
    if (params.toString()) {
      fullUrl += '?' + params.toString()
    }
  }

  code += `const response = await fetch('${fullUrl}', {\n`
  code += `  method: '${method}',\n`

  // 处理Headers
  if (options.value.includeHeaders && headers) {
    code += `  headers: {\n`
    headers.forEach(header => {
      if (header.enabled && header.key) {
        // 处理环境变量替换
        const processedKey = processEnvironmentVariables(header.key)
        const processedValue = processEnvironmentVariables(header.value)
        code += `    '${processedKey}': '${processedValue}',\n`
      }
    })

    // 处理认证
    if (options.value.includeAuth && auth && auth.type !== 'none') {
      if (auth.type === 'bearer' && auth.bearer.token) {
        // 处理环境变量替换
        const processedToken = processEnvironmentVariables(auth.bearer.token)
        code += `    'Authorization': 'Bearer ${processedToken}',\n`
      }
    }

    code += `  },\n`
  }

  // 处理请求体
  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    if (body.type === 'raw' && body.raw) {
      // 处理环境变量替换
      const processedBody = processEnvironmentVariables(body.raw)
      code += `  body: ${JSON.stringify(processedBody)},\n`
    }
  }

  code += `});\n\n`
  code += `const data = await response.json();\n`
  code += `console.log(data);`

  return code
}

// 生成Python代码
const generatePython = () => {
  const { method, url, headers, queryParams, body, auth } = props.requestData
  let code = ''

  if (options.value.includeComments) {
    code += '# 发送HTTP请求\n'
  }

  code += 'import requests\n\n'

  // 构建URL
  let fullUrl = processEnvironmentVariables(url)
  code += `url = "${fullUrl}"\n`

  // 处理查询参数
  if (queryParams && queryParams.length > 0) {
    code += 'params = {\n'
    queryParams.forEach(param => {
      if (param.enabled && param.key) {
        // 处理环境变量替换
        const processedKey = processEnvironmentVariables(param.key)
        const processedValue = processEnvironmentVariables(param.value)
        code += `    "${processedKey}": "${processedValue}",\n`
      }
    })
    code += '}\n'
  }

  // 处理Headers
  if (options.value.includeHeaders && headers) {
    code += 'headers = {\n'
    headers.forEach(header => {
      if (header.enabled && header.key) {
        // 处理环境变量替换
        const processedKey = processEnvironmentVariables(header.key)
        const processedValue = processEnvironmentVariables(header.value)
        code += `    "${processedKey}": "${processedValue}",\n`
      }
    })

    // 处理认证
    if (options.value.includeAuth && auth && auth.type !== 'none') {
      if (auth.type === 'bearer' && auth.bearer.token) {
        // 处理环境变量替换
        const processedToken = processEnvironmentVariables(auth.bearer.token)
        code += `    "Authorization": "Bearer ${processedToken}",\n`
      }
    }

    code += '}\n'
  }

  // 处理请求体
  if (body && ['POST', 'PUT', 'PATCH'].includes(method) && body.type === 'raw' && body.raw) {
    // 处理环境变量替换
    const processedBody = processEnvironmentVariables(body.raw)
    code += `data = ${JSON.stringify(processedBody)}\n`
  }

  // 构建请求
  code += `\nresponse = requests.${method.toLowerCase()}(url`
  if (queryParams && queryParams.length > 0) code += ', params=params'
  if (options.value.includeHeaders && headers) code += ', headers=headers'
  if (body && ['POST', 'PUT', 'PATCH'].includes(method) && body.type === 'raw' && body.raw) {
    code += ', data=data'
  }
  code += ')\n\n'
  code += 'print(response.json())'

  return code
}

// 生成Java代码
const generateJava = () => {
  const { method, url } = props.requestData
  let code = ''

  if (options.value.includeComments) {
    code += '// 使用OkHttp发送HTTP请求\n'
  }

  code += 'import okhttp3.*;\n\n'
  code += 'OkHttpClient client = new OkHttpClient();\n\n'

  let fullUrl = processEnvironmentVariables(url)
  code += `Request request = new Request.Builder()\n`
  code += `    .url("${fullUrl}")\n`
  code += `    .${method.toLowerCase()}()\n`
  code += `    .build();\n\n`

  code += 'try (Response response = client.newCall(request).execute()) {\n'
  code += '    System.out.println(response.body().string());\n'
  code += '}'

  return code
}

// 生成PHP代码
const generatePHP = () => {
  const { method, url } = props.requestData
  let code = ''

  if (options.value.includeComments) {
    code += '<?php\n// 使用cURL发送HTTP请求\n\n'
  } else {
    code += '<?php\n\n'
  }

  let fullUrl = processEnvironmentVariables(url)
  code += '$ch = curl_init();\n\n'
  code += `curl_setopt($ch, CURLOPT_URL, "${fullUrl}");\n`
  code += 'curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\n'
  code += `curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "${method}");\n\n`

  code += '$response = curl_exec($ch);\n'
  code += 'curl_close($ch);\n\n'
  code += 'echo $response;'

  return code
}

// 生成Go代码
const generateGo = () => {
  const { method, url } = props.requestData
  let code = ''

  if (options.value.includeComments) {
    code += '// 使用net/http发送HTTP请求\n'
  }

  code += 'package main\n\n'
  code += 'import (\n'
  code += '    "fmt"\n'
  code += '    "net/http"\n'
  code += '    "io/ioutil"\n'
  code += ')\n\n'

  code += 'func main() {\n'
  let fullUrl = processEnvironmentVariables(url)
  code += `    req, _ := http.NewRequest("${method}", "${fullUrl}", nil)\n`
  code += '    client := &http.Client{}\n'
  code += '    resp, err := client.Do(req)\n'
  code += '    if err != nil {\n'
  code += '        panic(err)\n'
  code += '    }\n'
  code += '    defer resp.Body.Close()\n\n'
  code += '    body, _ := ioutil.ReadAll(resp.Body)\n'
  code += '    fmt.Println(string(body))\n'
  code += '}'

  return code
}

// 复制代码
const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(generatedCode.value)
    message.success('代码已复制到剪贴板')
  } catch (error) {
    message.error('复制失败')
  }
}

// 取消操作
const handleCancel = () => {
  emit('update:visible', false)
}

// 监听visible变化
watch(() => props.visible, (newVal) => {
  if (newVal) {
    generateCode()
  }
})

// 监听requestData变化
watch(() => props.requestData, () => {
  if (props.visible) {
    generateCode()
  }
}, { deep: true })

onMounted(() => {
  if (props.visible) {
    generateCode()
  }
})
</script>

<style scoped>
.code-generator {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.language-selector {
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.code-display {
  flex: 1;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.code-title {
  font-weight: 500;
  color: #333;
}

.code-container {
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fafafa;
  max-height: 400px;
  overflow: auto;
}

.code-container pre {
  margin: 0;
  padding: 16px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.options-section {
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

/* 滚动条样式 */
.code-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.code-container::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.code-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.code-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
