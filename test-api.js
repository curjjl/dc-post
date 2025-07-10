// 简单的测试API服务器
const express = require('express')
const cors = require('cors')
const app = express()

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 测试端点
app.get('/api/test', (req, res) => {
  res.json({
    message: 'GET请求成功',
    timestamp: new Date().toISOString(),
    query: req.query,
    headers: req.headers
  })
})

app.post('/api/test', (req, res) => {
  res.json({
    message: 'POST请求成功',
    timestamp: new Date().toISOString(),
    body: req.body,
    headers: req.headers
  })
})

app.put('/api/test/:id', (req, res) => {
  res.json({
    message: 'PUT请求成功',
    id: req.params.id,
    timestamp: new Date().toISOString(),
    body: req.body
  })
})

app.delete('/api/test/:id', (req, res) => {
  res.json({
    message: 'DELETE请求成功',
    id: req.params.id,
    timestamp: new Date().toISOString()
  })
})

// 错误测试端点
app.get('/api/error', (req, res) => {
  res.status(500).json({
    error: '服务器内部错误',
    code: 500
  })
})

app.get('/api/notfound', (req, res) => {
  res.status(404).json({
    error: '资源未找到',
    code: 404
  })
})

// 延迟测试端点
app.get('/api/slow', (req, res) => {
  const delay = parseInt(req.query.delay) || 2000
  setTimeout(() => {
    res.json({
      message: '延迟响应',
      delay: delay,
      timestamp: new Date().toISOString()
    })
  }, delay)
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`测试API服务器运行在 http://localhost:${PORT}`)
  console.log('可用端点:')
  console.log('  GET    /api/test')
  console.log('  POST   /api/test')
  console.log('  PUT    /api/test/:id')
  console.log('  DELETE /api/test/:id')
  console.log('  GET    /api/error (返回500错误)')
  console.log('  GET    /api/notfound (返回404错误)')
  console.log('  GET    /api/slow?delay=2000 (延迟响应)')
})
