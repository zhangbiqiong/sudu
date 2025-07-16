const Router = require('koa-router')
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')
const redis = require('../redis')
const { generateToken, authMiddleware } = require('../utils/jwt')

const router = new Router()

/**
 * 用户注册
 * POST /auth/register
 */
router.post('/register', async (ctx) => {
  const { username, password } = ctx.request.body
  
  if (!username || !password) {
    ctx.status = 400
    ctx.body = {
      success: false,
      message: 'Username and password are required'
    }
    return
  }
  
  if (username.length < 3 || username.length > 20) {
    ctx.status = 400
    ctx.body = {
      success: false,
      message: 'Username must be between 3 and 20 characters'
    }
    return
  }
  
  if (password.length < 6) {
    ctx.status = 400
    ctx.body = {
      success: false,
      message: 'Password must be at least 6 characters'
    }
    return
  }
  
  try {
    // 检查用户名是否已存在
    const existingUser = await redis.hget('users', username)
    if (existingUser) {
      ctx.status = 409
      ctx.body = {
        success: false,
        message: 'Username already exists'
      }
      return
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // 创建用户
    const userId = uuidv4()
    const user = {
      id: userId,
      username,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    }
    
    // 保存用户
    await redis.hset('users', username, JSON.stringify(user))
    await redis.hset('user_ids', userId, username)
    
    // 初始化用户统计
    const userStats = {
      totalGames: 0,
      bestTime: null,
      totalTime: 0,
      gamesByMode: {
        '4x4': { count: 0, bestTime: null, totalTime: 0 },
        '5x5': { count: 0, bestTime: null, totalTime: 0 },
        '6x6': { count: 0, bestTime: null, totalTime: 0 }
      }
    }
    
    await redis.hset('user_stats', userId, JSON.stringify(userStats))
    
    ctx.body = {
      success: true,
      message: 'User registered successfully'
    }
    
  } catch (error) {
    console.error('Registration error:', error)
    ctx.status = 500
    ctx.body = {
      success: false,
      message: 'Internal server error'
    }
  }
})

/**
 * 用户登录
 * POST /auth/login
 */
router.post('/login', async (ctx) => {
  const { username, password } = ctx.request.body
  
  if (!username || !password) {
    ctx.status = 400
    ctx.body = {
      success: false,
      message: 'Username and password are required'
    }
    return
  }
  
  try {
    // 获取用户
    const userStr = await redis.hget('users', username)
    if (!userStr) {
      ctx.status = 401
      ctx.body = {
        success: false,
        message: 'Invalid username or password'
      }
      return
    }
    
    const user = JSON.parse(userStr)
    
    // 验证密码
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      ctx.status = 401
      ctx.body = {
        success: false,
        message: 'Invalid username or password'
      }
      return
    }
    
    // 生成JWT令牌
    const token = generateToken({
      id: user.id,
      username: user.username
    })
    
    ctx.body = {
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username
      }
    }
    
  } catch (error) {
    console.error('Login error:', error)
    ctx.status = 500
    ctx.body = {
      success: false,
      message: 'Internal server error'
    }
  }
})

/**
 * 获取当前用户信息
 * GET /auth/me
 */
router.get('/me', authMiddleware(), async (ctx) => {
  try {
    const { id, username } = ctx.state.user
    
    ctx.body = {
      success: true,
      user: {
        id,
        username
      }
    }
    
  } catch (error) {
    console.error('Get user info error:', error)
    ctx.status = 500
    ctx.body = {
      success: false,
      message: 'Internal server error'
    }
  }
})

/**
 * 修改密码
 * POST /auth/change-password
 */
router.post('/change-password', authMiddleware(), async (ctx) => {
  const { oldPassword, newPassword } = ctx.request.body
  const { username } = ctx.state.user
  
  if (!oldPassword || !newPassword) {
    ctx.status = 400
    ctx.body = {
      success: false,
      message: 'Old password and new password are required'
    }
    return
  }
  
  if (newPassword.length < 6) {
    ctx.status = 400
    ctx.body = {
      success: false,
      message: 'New password must be at least 6 characters'
    }
    return
  }
  
  try {
    // 获取用户
    const userStr = await redis.hget('users', username)
    if (!userStr) {
      ctx.status = 404
      ctx.body = {
        success: false,
        message: 'User not found'
      }
      return
    }
    
    const user = JSON.parse(userStr)
    
    // 验证旧密码
    const isValid = await bcrypt.compare(oldPassword, user.password)
    if (!isValid) {
      ctx.status = 401
      ctx.body = {
        success: false,
        message: 'Invalid old password'
      }
      return
    }
    
    // 加密新密码
    const hashedNewPassword = await bcrypt.hash(newPassword, 10)
    
    // 更新用户
    user.password = hashedNewPassword
    user.updatedAt = new Date().toISOString()
    
    await redis.hset('users', username, JSON.stringify(user))
    
    ctx.body = {
      success: true,
      message: 'Password changed successfully'
    }
    
  } catch (error) {
    console.error('Change password error:', error)
    ctx.status = 500
    ctx.body = {
      success: false,
      message: 'Internal server error'
    }
  }
})

module.exports = router