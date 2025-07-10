// 调试环境变量处理逻辑
// 这个文件用于测试当前的环境变量处理实现

// 模拟localStorage
const mockLocalStorage = {
  'api_env_variables': JSON.stringify({
    'baseUrl': 'https://api.example.com',
    'token': 'abc123',
    'userId': '12345',
    'apiKey': 'sk-test-key',
    'version': 'v1'
  })
};

// 模拟processEnvironmentVariables函数
function processEnvironmentVariables(text) {
  if (!text || typeof text !== 'string') return text;

  return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    try {
      const envVars = JSON.parse(mockLocalStorage['api_env_variables'] || '{}');
      return envVars[varName] || match;
    } catch (error) {
      console.error('获取环境变量失败:', error);
      return match;
    }
  });
}

// 模拟RequestConfig.vue中的buildFullUrl（页面显示，不处理环境变量）
function buildFullUrl(url, queryParams) {
  console.log('=== buildFullUrl (页面显示) ===');
  console.log('输入URL:', url);
  
  // 不处理环境变量，保持原始格式
  let baseUrl = url;
  if (!baseUrl || !baseUrl.trim()) {
    return '';
  }

  const enabledParams = queryParams.filter(param =>
    param.enabled && param.key && param.key.trim()
  );

  if (enabledParams.length === 0) {
    console.log('输出URL:', baseUrl);
    return baseUrl;
  }

  // 不进行环境变量替换和编码，保持原始可读性
  const queryString = enabledParams
    .map(param => {
      const key = param.key.trim();
      const value = param.value || '';
      return `${key}=${value}`;
    })
    .join('&');

  const result = baseUrl + (baseUrl.includes('?') ? '&' : '?') + queryString;
  console.log('输出URL:', result);
  return result;
}

// 模拟RequestConfig.vue中的buildRequestUrl（HTTP请求，处理环境变量）
function buildRequestUrl(url, queryParams) {
  console.log('=== buildRequestUrl (HTTP请求) ===');
  console.log('输入URL:', url);
  
  // 处理环境变量替换
  let baseUrl = processEnvironmentVariables(url);
  if (!baseUrl || !baseUrl.trim()) {
    return '';
  }

  const enabledParams = queryParams.filter(param =>
    param.enabled && param.key && param.key.trim()
  );

  if (enabledParams.length === 0) {
    console.log('输出URL:', baseUrl);
    return baseUrl;
  }

  // 对参数键和值都进行环境变量替换
  const queryString = enabledParams
    .map(param => {
      const processedKey = processEnvironmentVariables(param.key.trim());
      const processedValue = processEnvironmentVariables(param.value || '');
      return `${encodeURIComponent(processedKey)}=${encodeURIComponent(processedValue)}`;
    })
    .join('&');

  const result = baseUrl + (baseUrl.includes('?') ? '&' : '?') + queryString;
  console.log('输出URL:', result);
  return result;
}

// 模拟httpService.js中的buildHeaders（HTTP请求，处理环境变量）
function buildHeaders(headers) {
  console.log('=== buildHeaders (HTTP请求) ===');
  console.log('输入Headers:', headers);
  
  const headerObj = {};
  headers.forEach(header => {
    if (header.enabled && header.key) {
      // 处理环境变量替换
      const processedKey = processEnvironmentVariables(header.key);
      const processedValue = processEnvironmentVariables(header.value);
      headerObj[processedKey] = processedValue;
    }
  });
  
  console.log('输出Headers:', headerObj);
  return headerObj;
}

// 模拟httpService.js中的applyAuth（HTTP请求，处理环境变量）
function applyAuth(config, auth) {
  console.log('=== applyAuth (HTTP请求) ===');
  console.log('输入Auth:', auth);
  
  if (!auth || auth.type === 'none') return;

  switch (auth.type) {
    case 'basic':
      if (auth.basic.username || auth.basic.password) {
        const processedUsername = processEnvironmentVariables(auth.basic.username);
        const processedPassword = processEnvironmentVariables(auth.basic.password);
        const credentials = btoa(`${processedUsername}:${processedPassword}`);
        config.headers.Authorization = `Basic ${credentials}`;
      }
      break;
      
    case 'bearer':
      if (auth.bearer.token) {
        const processedToken = processEnvironmentVariables(auth.bearer.token);
        config.headers.Authorization = `Bearer ${processedToken}`;
      }
      break;
      
    case 'oauth2':
      if (auth.oauth2.accessToken) {
        const processedAccessToken = processEnvironmentVariables(auth.oauth2.accessToken);
        config.headers.Authorization = `Bearer ${processedAccessToken}`;
      }
      break;
  }
  
  console.log('输出Config Headers:', config.headers);
}

// 模拟httpService.js中的applyBody（HTTP请求，处理环境变量）
function applyBody(config, body) {
  console.log('=== applyBody (HTTP请求) ===');
  console.log('输入Body:', body);
  
  if (!body) return;

  switch (body.type) {
    case 'raw':
      config.data = processEnvironmentVariables(body.raw);
      break;
      
    case 'form-data':
      const formData = new FormData();
      body.formData.forEach(item => {
        if (item.enabled && item.key) {
          const processedKey = processEnvironmentVariables(item.key);
          
          if (item.type === 'file' && item.files && item.files.length > 0) {
            // 处理文件上传
            item.files.forEach(fileInfo => {
              if (fileInfo.originFileObj) {
                formData.append(processedKey, fileInfo.originFileObj, fileInfo.name);
              }
            });
          } else {
            const processedValue = processEnvironmentVariables(item.value || '');
            formData.append(processedKey, processedValue);
          }
        }
      });
      config.data = formData;
      break;
      
    case 'x-www-form-urlencoded':
      const urlencoded = new URLSearchParams();
      body.urlencoded.forEach(item => {
        if (item.enabled && item.key) {
          const processedKey = processEnvironmentVariables(item.key);
          const processedValue = processEnvironmentVariables(item.value);
          urlencoded.append(processedKey, processedValue);
        }
      });
      config.data = urlencoded;
      break;
  }
  
  console.log('输出Config Data:', config.data);
}

// 测试数据
const testData = {
  url: '{{baseUrl}}/api/{{version}}/users',
  queryParams: [
    { key: 'user_id', value: '{{userId}}', enabled: true },
    { key: 'api_key', value: '{{apiKey}}', enabled: true }
  ],
  headers: [
    { key: 'Authorization', value: 'Bearer {{token}}', enabled: true },
    { key: 'Content-Type', value: 'application/json', enabled: true }
  ],
  auth: {
    type: 'bearer',
    bearer: { token: '{{token}}' }
  },
  body: {
    type: 'raw',
    raw: '{"user_id": "{{userId}}", "api_key": "{{apiKey}}"}'
  }
};

// 运行测试
console.log('🧪 开始测试环境变量处理逻辑\n');

// 1. 测试页面显示URL（应保持原始格式）
console.log('1. 页面显示URL测试');
const displayUrl = buildFullUrl(testData.url, testData.queryParams);
console.log('期望：包含{{baseUrl}}等原始变量');
console.log('实际：', displayUrl);
console.log('✅ 正确：', displayUrl.includes('{{') ? '是' : '否');
console.log('');

// 2. 测试HTTP请求URL（应替换环境变量）
console.log('2. HTTP请求URL测试');
const requestUrl = buildRequestUrl(testData.url, testData.queryParams);
console.log('期望：替换为实际值');
console.log('实际：', requestUrl);
console.log('✅ 正确：', !requestUrl.includes('{{') ? '是' : '否');
console.log('');

// 3. 测试Headers处理
console.log('3. Headers处理测试');
const headers = buildHeaders(testData.headers);
console.log('期望：Authorization应包含实际token值');
console.log('✅ 正确：', headers.Authorization && headers.Authorization.includes('abc123') ? '是' : '否');
console.log('');

// 4. 测试认证处理
console.log('4. 认证处理测试');
const config = { headers: {} };
applyAuth(config, testData.auth);
console.log('期望：Authorization header应包含实际token值');
console.log('✅ 正确：', config.headers.Authorization && config.headers.Authorization.includes('abc123') ? '是' : '否');
console.log('');

// 5. 测试请求体处理
console.log('5. 请求体处理测试');
const bodyConfig = {};
applyBody(bodyConfig, testData.body);
console.log('期望：请求体应包含实际值而不是{{userId}}');
console.log('✅ 正确：', bodyConfig.data && !bodyConfig.data.includes('{{') ? '是' : '否');
console.log('');

console.log('🎉 测试完成！');
