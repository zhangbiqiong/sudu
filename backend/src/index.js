const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')
const cors = require('koa-cors')
const json = require('koa-json')
const logger = require('koa-logger')

const config = require('./config')
const redis = require('./redis')

// 导入路由
const authRoutes = require('./routes/auth')
const gameRoutes = require('./routes/game')
const leaderboardRoutes = require('./routes/leaderboard')
const userRoutes = require('./routes/user')

const app = new Koa()
const router = new Router()

// 中间件
app.use(cors())
app.use(json())
app.use(logger())
app.use(bodyParser())

// 错误处理中间件
app.use(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    console.error('Error:', err)
    ctx.status = err.status || 500
    ctx.body = {
      success: false,
      message: err.message || 'Internal server error'
    }
    ctx.app.emit('error', err, ctx)
  }
})

// 健康检查
router.get('/health', async (ctx) => {
  try {
    await redis.ping()
    ctx.body = {
      success: true,
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
      redis: 'connected'
    }
  } catch (error) {
    ctx.status = 500
    ctx.body = {
      success: false,
      message: 'Redis connection failed',
      error: error.message
    }
  }
})

// 注册路由
router.use('/auth', authRoutes.routes())
router.use('/game', gameRoutes.routes())
router.use('/leaderboard', leaderboardRoutes.routes())
router.use('/user', userRoutes.routes())

app.use(router.routes())
app.use(router.allowedMethods())

const PORT = config.port || 3000

app.listen(PORT, () => {
  console.log(`🚀 Sudoku Backend Server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
})

module.exports = app