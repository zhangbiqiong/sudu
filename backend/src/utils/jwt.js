const jwt = require('jsonwebtoken')
const config = require('../config')

/**
 * 生成JWT令牌
 * @param {Object} payload - 载荷数据
 * @returns {string} JWT令牌
 */
function generateToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  })
}

/**
 * 验证JWT令牌
 * @param {string} token - JWT令牌
 * @returns {Object} 解码后的载荷
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret)
  } catch (error) {
    throw new Error('Invalid token')
  }
}

/**
 * 从请求头中提取JWT令牌
 * @param {Object} ctx - Koa上下文
 * @returns {string|null} JWT令牌
 */
function extractTokenFromRequest(ctx) {
  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    return null
  }
  
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }
  
  return parts[1]
}

/**
 * JWT中间件
 */
function authMiddleware() {
  return async (ctx, next) => {
    const token = extractTokenFromRequest(ctx)
    
    if (!token) {
      ctx.status = 401
      ctx.body = {
        success: false,
        message: 'No token provided'
      }
      return
    }
    
    try {
      const decoded = verifyToken(token)
      ctx.state.user = decoded
      await next()
    } catch (error) {
      ctx.status = 401
      ctx.body = {
        success: false,
        message: 'Invalid token'
      }
    }
  }
}

module.exports = {
  generateToken,
  verifyToken,
  extractTokenFromRequest,
  authMiddleware
}