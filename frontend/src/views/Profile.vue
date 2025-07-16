<template>
  <div class="profile-container">
    <el-row :gutter="20">
      <!-- 用户信息卡片 -->
      <el-col :xs="24" :md="12">
        <el-card class="user-info-card">
          <template #header>
            <h3>{{ $t('nav.profile') }}</h3>
          </template>
          
          <div class="user-info">
            <div class="avatar-section">
              <el-avatar :size="80" :icon="UserFilled" />
              <h4>{{ user?.username }}</h4>
            </div>
            
            <div class="user-stats" v-if="userStats">
              <div class="stat-item">
                <span class="stat-number">{{ userStats.totalGames }}</span>
                <span class="stat-label">{{ $t('profile.totalGames') }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ formatTime(userStats.bestTime) }}</span>
                <span class="stat-label">{{ $t('profile.bestTime') }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ userStats.averageTime ? formatTime(userStats.averageTime) : 'N/A' }}</span>
                <span class="stat-label">{{ $t('profile.averageTime') }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 修改密码卡片 -->
      <el-col :xs="24" :md="12">
        <el-card class="change-password-card">
          <template #header>
            <h3>{{ $t('user.changePassword') }}</h3>
          </template>
          
          <el-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            label-width="120px"
            @submit.prevent="handleChangePassword"
          >
            <el-form-item :label="$t('user.oldPassword')" prop="oldPassword">
              <el-input
                v-model="passwordForm.oldPassword"
                type="password"
                :placeholder="$t('user.oldPassword')"
                show-password
              >
                <template #prefix>
                  <el-icon><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            
            <el-form-item :label="$t('user.newPassword')" prop="newPassword">
              <el-input
                v-model="passwordForm.newPassword"
                type="password"
                :placeholder="$t('user.newPassword')"
                show-password
              >
                <template #prefix>
                  <el-icon><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            
            <el-form-item :label="$t('user.confirmPassword')" prop="confirmNewPassword">
              <el-input
                v-model="passwordForm.confirmNewPassword"
                type="password"
                :placeholder="$t('user.confirmPassword')"
                show-password
                @keyup.enter="handleChangePassword"
              >
                <template #prefix>
                  <el-icon><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            
            <el-form-item>
              <el-button
                type="primary"
                @click="handleChangePassword"
                :loading="loading"
                style="width: 100%"
              >
                {{ $t('user.changePassword') }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 游戏统计卡片 -->
    <el-row class="stats-row">
      <el-col :span="24">
        <el-card class="game-stats-card">
          <template #header>
            <h3>{{ $t('profile.gameStats') }}</h3>
          </template>
          
          <div v-if="gameStats.length > 0" class="stats-grid">
            <div v-for="stat in gameStats" :key="stat.mode" class="mode-stat">
              <div class="mode-header">
                <h4>{{ $t(`game.${stat.mode}`) }}</h4>
                <el-tag :type="getModeTagType(stat.mode)">{{ stat.mode }}</el-tag>
              </div>
              
              <div class="mode-stats">
                <div class="mode-stat-item">
                  <span class="stat-value">{{ stat.gamesPlayed }}</span>
                  <span class="stat-label">{{ $t('profile.gamesPlayed') }}</span>
                </div>
                <div class="mode-stat-item">
                  <span class="stat-value">{{ stat.bestTime ? formatTime(stat.bestTime) : 'N/A' }}</span>
                  <span class="stat-label">{{ $t('profile.bestTime') }}</span>
                </div>
                <div class="mode-stat-item">
                  <span class="stat-value">{{ stat.averageTime ? formatTime(stat.averageTime) : 'N/A' }}</span>
                  <span class="stat-label">{{ $t('profile.averageTime') }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="no-stats">
            <el-empty :description="$t('profile.noGamesYet')">
              <el-button type="primary" @click="$router.push('/')">
                {{ $t('game.startGame') }}
              </el-button>
            </el-empty>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { UserFilled, Lock } from '@element-plus/icons-vue'
import { userStore } from '../stores/userStore'
import { userAPI } from '../api'
import { formatTime } from '../utils/sudoku'

export default {
  name: 'Profile',
  components: {
    UserFilled,
    Lock
  },
  setup() {
    const { t } = useI18n()
    const passwordFormRef = ref()
    const loading = ref(false)
    const userStats = ref(null)
    const gameStats = ref([])
    
    const user = computed(() => userStore.user)
    
    const passwordForm = reactive({
      oldPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    })
    
    const validateConfirmPassword = (rule, value, callback) => {
      if (value !== passwordForm.newPassword) {
        callback(new Error(t('message.passwordMismatch')))
      } else {
        callback()
      }
    }
    
    const passwordRules = {
      oldPassword: [
        { required: true, message: t('message.passwordRequired'), trigger: 'blur' }
      ],
      newPassword: [
        { required: true, message: t('message.passwordRequired'), trigger: 'blur' },
        { min: 6, message: t('message.passwordLength'), trigger: 'blur' }
      ],
      confirmNewPassword: [
        { required: true, message: t('message.confirmPasswordRequired'), trigger: 'blur' },
        { validator: validateConfirmPassword, trigger: 'blur' }
      ]
    }
    
    // 获取模式标签类型
    const getModeTagType = (mode) => {
      switch (mode) {
        case '4x4': return 'success'
        case '5x5': return 'warning'
        case '6x6': return 'danger'
        default: return 'info'
      }
    }
    
    // 处理修改密码
    const handleChangePassword = async () => {
      if (!passwordFormRef.value) return
      
      try {
        await passwordFormRef.value.validate()
        loading.value = true
        
        const result = await userStore.changePassword(
          passwordForm.oldPassword,
          passwordForm.newPassword
        )
        
        if (result.success) {
          ElMessage.success(t('message.passwordChanged'))
          // 重置表单
          passwordForm.oldPassword = ''
          passwordForm.newPassword = ''
          passwordForm.confirmNewPassword = ''
          passwordFormRef.value.resetFields()
        } else {
          ElMessage.error(result.message || t('message.passwordChangeFailed'))
        }
      } catch (error) {
        console.log('Form validation failed:', error)
      } finally {
        loading.value = false
      }
    }
    
    // 获取用户统计数据
    const fetchUserStats = async () => {
      try {
        const response = await userAPI.getUserStats()
        userStats.value = response.data.overall
        gameStats.value = response.data.byMode || []
      } catch (error) {
        console.error('Failed to fetch user stats:', error)
      }
    }
    
    onMounted(() => {
      fetchUserStats()
    })
    
    return {
      user,
      userStats,
      gameStats,
      passwordForm,
      passwordRules,
      passwordFormRef,
      loading,
      getModeTagType,
      handleChangePassword,
      formatTime
    }
  }
}
</script>

<style scoped>
.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.user-info-card,
.change-password-card,
.game-stats-card {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  border-radius: 15px;
  overflow: hidden;
  margin-bottom: 20px;
}

.user-info {
  text-align: center;
}

.avatar-section {
  margin-bottom: 30px;
}

.avatar-section h4 {
  margin: 15px 0 0 0;
  color: #2c3e50;
  font-size: 1.3rem;
  font-weight: 300;
}

.user-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 10px;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
}

.stats-row {
  margin-top: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.mode-stat {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 10px;
}

.mode-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.mode-header h4 {
  margin: 0;
  color: #2c3e50;
  font-weight: 300;
}

.mode-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.mode-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  background: white;
  border-radius: 8px;
}

.mode-stat-item .stat-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 5px;
}

.mode-stat-item .stat-label {
  font-size: 0.8rem;
  color: #666;
}

.no-stats {
  text-align: center;
  padding: 40px 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-container {
    padding: 10px;
  }
  
  .user-stats {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .mode-stats {
    grid-template-columns: 1fr;
  }
  
  .stat-number {
    font-size: 1.3rem;
  }
}

/* 高分辨率适配 */
@media (min-width: 2560px) {
  .avatar-section h4 {
    font-size: 1.6rem;
  }
  
  .stat-number {
    font-size: 1.8rem;
  }
  
  .mode-stat-item .stat-value {
    font-size: 1.4rem;
  }
}

@media (min-width: 3840px) {
  .avatar-section h4 {
    font-size: 2rem;
  }
  
  .stat-number {
    font-size: 2.2rem;
  }
  
  .mode-stat-item .stat-value {
    font-size: 1.8rem;
  }
}
</style>