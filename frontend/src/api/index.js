import axios from 'axios'

// 创建axios实例
export const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 游戏相关API
export const gameAPI = {
  // 生成新游戏
  generateGame(mode) {
    return api.post('/game/generate', { mode })
  },
  
  // 验证答案
  checkAnswer(gameId, solution) {
    return api.post('/game/check', { gameId, solution })
  },
  
  // 提交完成的游戏
  submitGame(gameId, solution, time) {
    return api.post('/game/submit', { gameId, solution, time })
  }
}

// 排行榜相关API
export const leaderboardAPI = {
  // 获取排行榜
  getLeaderboard(mode, limit = 50) {
    return api.get('/leaderboard', { params: { mode, limit } })
  }
}

// 用户相关API
export const userAPI = {
  // 获取用户统计信息
  getUserStats() {
    return api.get('/user/stats')
  }
}