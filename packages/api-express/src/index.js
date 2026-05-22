const express = require('express')
const app = express()
const port = 3000

app.use(express.json())

// ========== 路由注册 ==========
const devicesRouter = require('./routes/devices')
app.use('/api/devices', devicesRouter)

// ========== Hello（健康检查） ==========
app.get('/api/hello', (req, res) => {
  const name = req.query.name || 'GIS'
  res.json({ message: `Hello ${name} World!` })
})

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`)
})
