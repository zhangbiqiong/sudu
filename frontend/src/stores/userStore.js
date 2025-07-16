import { reactive } from 'vue'
import { api } from '../api'

export const userStore = reactive({
  user: null,
  isAuthenticated: false,

  async login(username, password) {
    try {
      const response = await api.post('/auth/login', { username, password })
      this.user = response.data.user
      this.isAuthenticated = true
      localStorage.setItem('token', response.data.token)
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      }
    }
  },

  async register(username, password) {
    try {
      const response = await api.post('/auth/register', { username, password })
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      }
    }
  },

  async changePassword(oldPassword, newPassword) {
    try {
      await api.post('/auth/change-password', { oldPassword, newPassword })
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Password change failed' 
      }
    }
  },

  async checkAuth() {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await api.get('/auth/me')
      this.user = response.data.user
      this.isAuthenticated = true
    } catch (error) {
      this.logout()
    }
  },

  logout() {
    this.user = null
    this.isAuthenticated = false
    localStorage.removeItem('token')
  }
})