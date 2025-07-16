const Redis = require('ioredis')
const config = require('./config')

// 创建Redis连接
const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true
})

redis.on('connect', () => {
  console.log('✅ Redis connected successfully')
})

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err)
})

redis.on('ready', () => {
  console.log('🔄 Redis ready to use')
})

redis.on('close', () => {
  console.log('🔒 Redis connection closed')
})

module.exports = redis