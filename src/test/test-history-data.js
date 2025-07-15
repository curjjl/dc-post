// 生成测试历史记录数据
// 在浏览器控制台中运行此脚本来生成测试数据

function generateTestHistoryData() {
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  const domains = ['api.example.com', 'jsonplaceholder.typicode.com', 'httpbin.org', 'reqres.in'];
  const endpoints = [
    '/users',
    '/posts',
    '/comments',
    '/albums',
    '/photos',
    '/todos',
    '/auth/login',
    '/auth/logout',
    '/profile',
    '/settings',
    '/data/export',
    '/data/import',
    '/search',
    '/upload',
    '/download'
  ];
  
  const statusCodes = [200, 201, 204, 400, 401, 403, 404, 500, 502];
  
  const testData = [];
  
  for (let i = 0; i < 50; i++) {
    const method = methods[Math.floor(Math.random() * methods.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const status = statusCodes[Math.floor(Math.random() * statusCodes.length)];
    
    // 生成随机时间戳（最近30天内）
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const timestamp = thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo);
    
    const item = {
      id: `test_${i}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      method: method,
      url: `https://${domain}${endpoint}`,
      timestamp: timestamp,
      status: status,
      duration: Math.floor(Math.random() * 2000) + 50, // 50-2050ms
      queryParams: [],
      headers: [
        { key: 'Content-Type', value: 'application/json', enabled: true },
        { key: 'Authorization', value: 'Bearer token123', enabled: true }
      ],
      auth: {
        type: 'bearer',
        bearer: { token: 'test-token' }
      },
      body: {
        type: 'raw',
        raw: method === 'POST' || method === 'PUT' || method === 'PATCH' 
          ? JSON.stringify({ id: i, name: `Test Item ${i}` })
          : ''
      }
    };
    
    // 随机添加一些Query参数
    if (Math.random() > 0.5) {
      item.queryParams.push(
        { key: 'page', value: Math.floor(Math.random() * 10) + 1, enabled: true },
        { key: 'limit', value: Math.floor(Math.random() * 50) + 10, enabled: true }
      );
    }
    
    if (Math.random() > 0.7) {
      item.queryParams.push(
        { key: 'search', value: `query${i}`, enabled: true }
      );
    }
    
    // 随机添加一些额外的Headers
    if (Math.random() > 0.6) {
      item.headers.push(
        { key: 'X-API-Key', value: `api-key-${i}`, enabled: true }
      );
    }
    
    testData.push(item);
  }
  
  return testData;
}

// 保存测试数据到localStorage
function saveTestData() {
  const testData = generateTestHistoryData();
  localStorage.setItem('api_request_history', JSON.stringify(testData));
  console.log(`已生成并保存 ${testData.length} 条测试历史记录`);
  console.log('请刷新页面查看效果');
}

// 清空测试数据
function clearTestData() {
  localStorage.removeItem('api_request_history');
  console.log('已清空历史记录');
  console.log('请刷新页面查看效果');
}

// 在控制台中运行以下命令：
console.log('历史记录测试数据生成器');
console.log('运行 saveTestData() 生成测试数据');
console.log('运行 clearTestData() 清空测试数据');

// 自动执行（可选）
// saveTestData();
