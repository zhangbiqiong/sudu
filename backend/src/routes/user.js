const Router = require('koa-router')
const redis = require('../redis')
const { authMiddleware } = require('../utils/jwt')

const router = new Router()

/**
 * 获取用户统计信息
 * GET /user/stats
 */
router.get('/stats', authMiddleware(), async (ctx) => {
  const { id: userId } = ctx.state.user
  
  try {
    // 获取用户统计数据
    const userStatsStr = await redis.hget('user_stats', userId)
    
    let userStats
    if (userStatsStr) {
      userStats = JSON.parse(userStatsStr)
    } else {
      // 如果没有统计数据，返回初始数据
      userStats = {
        totalGames: 0,
        bestTime: null,
        totalTime: 0,
        gamesByMode: {
          '4x4': { count: 0, bestTime: null, totalTime: 0 },
          '5x5': { count: 0, bestTime: null, totalTime: 0 },
          '6x6': { count: 0, bestTime: null, totalTime: 0 }
        }
      }
    }
    
    // 计算平均时间
    const averageTime = userStats.totalGames > 0 ? 
      Math.round(userStats.totalTime / userStats.totalGames) : null
    
    // 格式化返回数据
    const overall = {
      totalGames: userStats.totalGames,
      bestTime: userStats.bestTime,
      averageTime,
      totalTime: userStats.totalTime
    }
    
    const byMode = Object.keys(userStats.gamesByMode).map(mode => {
      const modeStats = userStats.gamesByMode[mode]
      return {
        mode,
        gamesPlayed: modeStats.count,
        bestTime: modeStats.bestTime,
        averageTime: modeStats.count > 0 ? 
          Math.round(modeStats.totalTime / modeStats.count) : null,
        totalTime: modeStats.totalTime
      }
    }).filter(mode => mode.gamesPlayed > 0)
    
    ctx.body = {
      success: true,
      overall,
      byMode
    }
    
  } catch (error) {
    console.error('Get user stats error:', error)
    ctx.status = 500
    ctx.body = {
      success: false,
      message: 'Failed to get user statistics'
    }
  }
})

/**
 * 获取用户游戏历史
 * GET /user/games?limit=20&offset=0
 */
router.get('/games', authMiddleware(), async (ctx) => {
  const { id: userId } = ctx.state.user
  const { limit = 20, offset = 0 } = ctx.query
  
  const limitNum = parseInt(limit)
  const offsetNum = parseInt(offset)
  
  if (isNaN(limitNum) || limitNum <= 0 || limitNum > 100) {
    ctx.status = 400
    ctx.body = {
      success: false,
      message: 'Invalid limit. Must be between 1 and 100'
    }
    return
  }
  
  if (isNaN(offsetNum) || offsetNum < 0) {
    ctx.status = 400
    ctx.body = {
      success: false,
      message: 'Invalid offset. Must be >= 0'
    }
    return
  }
  
  try {
    // 获取用户游戏历史
    const gameHistory = await redis.lrange(`user_games:${userId}`, offsetNum, offsetNum + limitNum - 1)
    
    const games = gameHistory.map(gameStr => {
      try {
        return JSON.parse(gameStr)
      } catch (parseError) {
        console.error('Failed to parse game record:', parseError)
        return null
      }
    }).filter(game => game !== null)
    
    // 获取总记录数
    const totalGames = await redis.llen(`user_games:${userId}`)
    
    ctx.body = {
      success: true,
      games,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total: totalGames,
        hasMore: offsetNum + limitNum < totalGames
      }
    }
    
  } catch (error) {
    console.error('Get user games error:', error)
    ctx.status = 500
    ctx.body = {
      success: false,
      message: 'Failed to get user games'
    }
  }
})

/**
 * 获取用户在各模式的最佳成绩
 * GET /user/best-records
 */
router.get('/best-records', authMiddleware(), async (ctx) => {
  const { username } = ctx.state.user
  
  try {
    const modes = ['4x4', '5x5', '6x6']
    const bestRecords = {}
    
    for (const mode of modes) {
      // 从排行榜中找用户的最佳成绩
      const leaderboardData = await redis.zrange(`leaderboard:${mode}`, 0, -1, 'WITHSCORES')
      
      let userBestRecord = null
      let userRank = null
      
      for (let i = 0; i < leaderboardData.length; i += 2) {
        const recordStr = leaderboardData[i]
        const time = parseInt(leaderboardData[i + 1])
        
        try {
          const record = JSON.parse(recordStr)
          if (record.username === username) {
            if (!userBestRecord || time < userBestRecord.time) {
              userBestRecord = {
                ...record,
                time,
                date: record.completedAt
              }
              userRank = Math.floor(i / 2) + 1
            }
          }
        } catch (parseError) {
          console.error('Failed to parse leaderboard record:', parseError)
        }
      }
      
      if (userBestRecord) {
        bestRecords[mode] = {
          ...userBestRecord,
          rank: userRank
        }
      }
    }
    
    ctx.body = {
      success: true,
      bestRecords
    }
    
  } catch (error) {
    console.error('Get user best records error:', error)
    ctx.status = 500
    ctx.body = {
      success: false,
      message: 'Failed to get user best records'
    }
  }
})

/**
 * 删除用户游戏记录（仅用于测试）
 * DELETE /user/games
 */
router.delete('/games', authMiddleware(), async (ctx) => {
  const { id: userId } = ctx.state.user
  
  try {
    // 删除用户游戏历史
    await redis.del(`user_games:${userId}`)
    
    // 重置用户统计
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
      message: 'User game records deleted successfully'
    }
    
  } catch (error) {
    console.error('Delete user games error:', error)
    ctx.status = 500
    ctx.body = {
      success: false,
      message: 'Failed to delete user games'
    }
  }
})

/**
 * 获取用户基本信息
 * GET /user/profile
 */
router.get('/profile', authMiddleware(), async (ctx) => {
  const { id: userId, username } = ctx.state.user
  
  try {
    // 获取用户详细信息
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
    
    // 返回用户信息（不包含密码）
    ctx.body = {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt || user.createdAt
      }
    }
    
  } catch (error) {
    console.error('Get user profile error:', error)
    ctx.status = 500
    ctx.body = {
      success: false,
      message: 'Failed to get user profile'
    }
  }
})

module.exports = router