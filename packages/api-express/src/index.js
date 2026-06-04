const express = require('express')
const app = express()
const port = 3000
const { connect: connectRedis } = require('./cache')

app.use(express.json())

async function start() {
  await connectRedis()

  const devicesRouter = require('./routes/devices')
  app.use('/api/devices', devicesRouter)

  app.get('/api/hello', (req, res) => {
    const name = req.query.name || 'GIS'
    res.json({ message: `Hello ${name} World!` })
  })

  app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`)
  })
}

start()
