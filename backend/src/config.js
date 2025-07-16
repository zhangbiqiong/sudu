module.exports = {
  port: process.env.PORT || 3000,
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || null,
    db: process.env.REDIS_DB || 0
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'sudoku-game-secret-key-2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  game: {
    maxHints: 3,
    difficulties: {
      '4x4': 0.4,
      '5x5': 0.5,
      '6x6': 0.6
    }
  },
  
  leaderboard: {
    maxEntries: 100
  }
}