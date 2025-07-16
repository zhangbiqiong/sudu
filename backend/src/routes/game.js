const Router = require('koa-router')
const { v4: uuidv4 } = require('uuid')
const redis = require('../redis')
const config = require('../config')
const { authMiddleware } = require('../utils/jwt')
const { 
  generateSudoku, 
  createPuzzle, 
  isSudokuComplete,
  getSizeFromMode,
  isValidMode,
  deepCopy
} = require('../utils/sudoku')

const router = new Router()

/**
 * 生成新游戏
 * POST /game/generate
 */
router.post('/generate', async (ctx) => {
  const { mode } = ctx.request.body
  
  if (!mode || !isValidMode(mode)) {
    ctx.status = 400
    ctx.body = {
      success: false,
      message: 'Invalid game mode. Supported modes: 4x4, 5x5, 6x6'
    }
    return
  }
  
  try {
    const size = getSizeFromMode(mode)
    const difficulty = config.game.difficulties[mode] || 0.5
    
    // 生成完整解答
    const solution = generateSudoku(size)
    
    // 创建谜题
    const puzzle = createPuzzle(solution, difficulty)
    
    // 生成游戏ID
    const gameId = uuidv4()
    
    // 保存游戏状态
    const gameData = {
      id: gameId,
      mode,
      size,
      puzzle,
      solution,
      createdAt: new Date().toISOString(),
      isCompleted: false
    }
    
    await redis.setex(`game:${gameId}`, 3600, JSON.stringify(gameData)) // 1小时过期
    
    ctx.body = {
      success: true,
      game: {
        id: gameId,
        mode,
        puzzle
      }
    }
    
  } catch (error) {
    console.error('Generate game error:', error)
    ctx.status = 500
    ctx.body = {
      success: false,
      message: 'Failed to generate game'
    }
  }
})

/**
 * 检查答案
 * POST /game/check
 */
router.post('/check', async (ctx) => {
  const { gameId, solution } = ctx.request.body
  
  if (!gameId || !solution) {
    ctx.status = 400
    ctx.body = {
      success: false,
      message: 'Game ID and solution are required'
    }
    return
  }
  
  try {
    // 获取游戏数据
    const gameDataStr = await redis.get(`game:${gameId}`)
    if (!gameDataStr) {
      ctx.status = 404
      ctx.body = {
        success: false,
        message: 'Game not found or expired'
      }
      return
    }
    
    const gameData = JSON.parse(gameDataStr)
    
    // 检查解答是否正确
    const isComplete = isSudokuComplete(solution)
    const isCorrect = JSON.stringify(solution) === JSON.stringify(gameData.solution)
    
    ctx.body = {
      success: true,
      isComplete,
      isCorrect
    }
    
  } catch (error) {
    console.error('Check answer error:', error)
    ctx.status = 500
    ctx.body = {
      success: false,
      message: 'Failed to check answer'
    }
  }
})

/**
 * 提交完成的游戏
 * POST /game/submit
 */
router.post('/submit', authMiddleware(), async (ctx) => {
  const { gameId, solution, time } = ctx.request.body
  const { id: userId, username } = ctx.state.user
  
  if (!gameId || !solution || !time) {
    ctx.status = 400
    ctx.body = {
      success: false,
      message: 'Game ID, solution, and time are required'
    }
    return
  }
  
  if (time <= 0) {
    ctx.status = 400
    ctx.body = {
      success: false,
      message: 'Invalid time'
    }
    return
  }
  
  try {
    // 获取游戏数据
    const gameDataStr = await redis.get(`game:${gameId}`)
    if (!gameDataStr) {
      ctx.status = 404
      ctx.body = {
        success: false,
        message: 'Game not found or expired'
      }
      return
    }
    
    const gameData = JSON.parse(gameDataStr)
    
    // 检查游戏是否已完成
    if (gameData.isCompleted) {
      ctx.status = 409
      ctx.body = {
        success: false,
        message: 'Game already completed'
      }
      return
    }
    
    // 验证解答
    const isComplete = isSudokuComplete(solution)
    const isCorrect = JSON.stringify(solution) === JSON.stringify(gameData.solution)
    
    if (!isComplete || !isCorrect) {
      ctx.status = 400
      ctx.body = {
        success: false,
        message: 'Solution is not correct or complete'
      }
      return
    }
    
    const { mode } = gameData
    const submissionId = uuidv4()
    const submissionTime = new Date().toISOString()
    
    // 创建游戏记录
    const gameRecord = {
      id: submissionId,
      userId,
      username,
      gameId,
      mode,
      time,
      completedAt: submissionTime
    }
    
    // 保存到排行榜
    await redis.zadd(`leaderboard:${mode}`, time, JSON.stringify(gameRecord))
    
    // 保存到用户游戏历史
    await redis.lpush(`user_games:${userId}`, JSON.stringify(gameRecord))
    
    // 更新用户统计
    await updateUserStats(userId, mode, time)
    
    // 标记游戏为已完成
    gameData.isCompleted = true
    gameData.completedBy = userId
    gameData.completedAt = submissionTime
    gameData.completionTime = time
    
    await redis.setex(`game:${gameId}`, 3600, JSON.stringify(gameData))
    
    ctx.body = {
      success: true,
      message: 'Game completed successfully',
      record: {
        id: submissionId,
        mode,
        time,
        completedAt: submissionTime
      }
    }
    
  } catch (error) {
    console.error('Submit game error:', error)
    ctx.status = 500
    ctx.body = {
      success: false,
      message: 'Failed to submit game'
    }
  }
})

/**
 * 获取游戏状态
 * GET /game/:gameId
 */
router.get('/:gameId', async (ctx) => {
  const { gameId } = ctx.params
  
  try {
    const gameDataStr = await redis.get(`game:${gameId}`)
    if (!gameDataStr) {
      ctx.status = 404
      ctx.body = {
        success: false,
        message: 'Game not found or expired'
      }
      return
    }
    
    const gameData = JSON.parse(gameDataStr)
    
    // 不返回解答，只返回谜题
    ctx.body = {
      success: true,
      game: {
        id: gameData.id,
        mode: gameData.mode,
        puzzle: gameData.puzzle,
        isCompleted: gameData.isCompleted,
        createdAt: gameData.createdAt
      }
    }
    
  } catch (error) {
    console.error('Get game error:', error)
    ctx.status = 500
    ctx.body = {
      success: false,
      message: 'Failed to get game'
    }
  }
})

/**
 * 更新用户统计
 */
async function updateUserStats(userId, mode, time) {
  try {
    const userStatsStr = await redis.hget('user_stats', userId)
    let userStats
    
    if (userStatsStr) {
      userStats = JSON.parse(userStatsStr)
    } else {
      // 如果不存在统计数据，初始化
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
    
    // 更新总体统计
    userStats.totalGames++
    userStats.totalTime += time
    if (!userStats.bestTime || time < userStats.bestTime) {
      userStats.bestTime = time
    }
    
    // 更新模式统计
    if (!userStats.gamesByMode[mode]) {
      userStats.gamesByMode[mode] = { count: 0, bestTime: null, totalTime: 0 }
    }
    
    userStats.gamesByMode[mode].count++
    userStats.gamesByMode[mode].totalTime += time
    if (!userStats.gamesByMode[mode].bestTime || time < userStats.gamesByMode[mode].bestTime) {
      userStats.gamesByMode[mode].bestTime = time
    }
    
    await redis.hset('user_stats', userId, JSON.stringify(userStats))
    
  } catch (error) {
    console.error('Update user stats error:', error)
  }
}

module.exports = router