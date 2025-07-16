const Router = require('koa-router')
const redis = require('../redis')
const config = require('../config')
const { isValidMode } = require('../utils/sudoku')

const router = new Router()

/**
 * 获取排行榜
 * GET /leaderboard?mode=4x4&limit=50
 */
router.get('/', async (ctx) => {
  const { mode = '4x4', limit = 50 } = ctx.query
  
  if (!isValidMode(mode)) {
    ctx.status = 400
    ctx.body = {
      success: false,
      message: 'Invalid game mode. Supported modes: 4x4, 5x5, 6x6'
    }
    return
  }
  
  const limitNum = parseInt(limit)
  if (isNaN(limitNum) || limitNum <= 0 || limitNum > config.leaderboard.maxEntries) {
    ctx.status = 400
    ctx.body = {
      success: false,
      message: `Invalid limit. Must be between 1 and ${config.leaderboard.maxEntries}`
    }
    return
  }
  
  try {
    // 从排行榜中获取数据（按时间升序，时间越短排名越高）
    const leaderboardData = await redis.zrange(`leaderboard:${mode}`, 0, limitNum - 1, 'WITHSCORES')
    
    const leaderboard = []
    
    // 处理返回的数据
    for (let i = 0; i < leaderboardData.length; i += 2) {
      const recordStr = leaderboardData[i]
      const time = parseInt(leaderboardData[i + 1])
      
      try {
        const record = JSON.parse(recordStr)
        leaderboard.push({
          ...record,
          time,
          date: record.completedAt
        })
      } catch (parseError) {
        console.error('Failed to parse leaderboard record:', parseError)
      }
    }
    
    ctx.body = {
      success: true,
      leaderboard,
      mode,
      total: leaderboard.length
    }
    
  } catch (error) {
    console.error('Get leaderboard error:', error)
    ctx.status = 500
    ctx.body = {
      success: false,
      message: 'Failed to get leaderboard'
    }
  }
})

/**
 * 获取全部模式的排行榜
 * GET /leaderboard/all?limit=10
 */
router.get('/all', async (ctx) => {
  const { limit = 10 } = ctx.query
  
  const limitNum = parseInt(limit)
  if (isNaN(limitNum) || limitNum <= 0 || limitNum > 50) {
    ctx.status = 400
    ctx.body = {
      success: false,
      message: 'Invalid limit. Must be between 1 and 50'
    }
    return
  }
  
  try {
    const modes = ['4x4', '5x5', '6x6']
    const allLeaderboards = {}
    
    for (const mode of modes) {
      const leaderboardData = await redis.zrange(`leaderboard:${mode}`, 0, limitNum - 1, 'WITHSCORES')
      const leaderboard = []
      
      for (let i = 0; i < leaderboardData.length; i += 2) {
        const recordStr = leaderboardData[i]
        const time = parseInt(leaderboardData[i + 1])
        
        try {
          const record = JSON.parse(recordStr)
          leaderboard.push({
            ...record,
            time,
            date: record.completedAt
          })
        } catch (parseError) {
          console.error('Failed to parse leaderboard record:', parseError)
        }
      }
      
      allLeaderboards[mode] = leaderboard
    }
    
    ctx.body = {
      success: true,
      leaderboards: allLeaderboards
    }
    
  } catch (error) {
    console.error('Get all leaderboards error:', error)
    ctx.status = 500
    ctx.body = {
      success: false,
      message: 'Failed to get leaderboards'
    }
  }
})

/**
 * 获取用户在指定模式的排名
 * GET /leaderboard/rank/:username?mode=4x4
 */
router.get('/rank/:username', async (ctx) => {
  const { username } = ctx.params
  const { mode = '4x4' } = ctx.query
  
  if (!isValidMode(mode)) {
    ctx.status = 400
    ctx.body = {
      success: false,
      message: 'Invalid game mode. Supported modes: 4x4, 5x5, 6x6'
    }
    return
  }
  
  try {
    // 获取用户的最佳成绩
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
    
    ctx.body = {
      success: true,
      user: username,
      mode,
      rank: userRank,
      record: userBestRecord
    }
    
  } catch (error) {
    console.error('Get user rank error:', error)
    ctx.status = 500
    ctx.body = {
      success: false,
      message: 'Failed to get user rank'
    }
  }
})

/**
 * 获取排行榜统计信息
 * GET /leaderboard/stats
 */
router.get('/stats', async (ctx) => {
  try {
    const modes = ['4x4', '5x5', '6x6']
    const stats = {}
    
    for (const mode of modes) {
      const totalRecords = await redis.zcard(`leaderboard:${mode}`)
      
      // 获取最快时间
      const fastestData = await redis.zrange(`leaderboard:${mode}`, 0, 0, 'WITHSCORES')
      let fastestTime = null
      let fastestUser = null
      
      if (fastestData.length >= 2) {
        try {
          const record = JSON.parse(fastestData[0])
          fastestTime = parseInt(fastestData[1])
          fastestUser = record.username
        } catch (parseError) {
          console.error('Failed to parse fastest record:', parseError)
        }
      }
      
      stats[mode] = {
        totalRecords,
        fastestTime,
        fastestUser
      }
    }
    
    ctx.body = {
      success: true,
      stats
    }
    
  } catch (error) {
    console.error('Get leaderboard stats error:', error)
    ctx.status = 500
    ctx.body = {
      success: false,
      message: 'Failed to get leaderboard stats'
    }
  }
})

module.exports = router