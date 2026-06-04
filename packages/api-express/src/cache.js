const { createClient } = require('redis')

const redis = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
})

redis.on('error', (err) => {
  console.error('Redis 连接异常：', err)
})

redis.on('connect', () => {
  console.log('✅ Redis 已连接')
})

async function connect() {
  if (!redis.isOpen) {
    await redis.connect()
  }
}

function buildNearbyKey(lat, lng, radius) {
  const precision = 3
  const latRounded = parseFloat(lat).toFixed(precision)
  const lngRounded = parseFloat(lng).toFixed(precision)
  return `nearby:${latRounded}:${lngRounded}:${radius}`
}

async function getNearby(key) {
  const data = await redis.get(key)
  return data ? JSON.parse(data) : null
}

async function setNearby(key, data, ttlSeconds = 300) {
  await redis.setEx(key, ttlSeconds, JSON.stringify(data))
}

async function clearNearbyCache() {
  const keys = await redis.keys('nearby:*')
  if (keys.length > 0) {
    await redis.del(keys)
  }
  return keys.length
}

module.exports = {
  redis,
  connect,
  buildNearbyKey,
  getNearby,
  setNearby,
  clearNearbyCache,
}
