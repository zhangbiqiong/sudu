<template>
  <div class="leaderboard-container">
    <el-card class="leaderboard-card">
      <template #header>
        <div class="leaderboard-header">
          <h2 class="leaderboard-title">{{ $t('leaderboard.title') }}</h2>
          <el-select v-model="selectedMode" @change="fetchLeaderboard" class="mode-selector">
            <el-option 
              v-for="mode in gameModes" 
              :key="mode.value"
              :label="$t(`game.${mode.value}`)"
              :value="mode.value"
            />
          </el-select>
        </div>
      </template>
      
      <div class="leaderboard-content">
        <el-table 
          :data="leaderboardData" 
          v-loading="loading"
          class="leaderboard-table"
          empty-text="暂无数据"
        >
          <el-table-column 
            prop="rank" 
            :label="$t('leaderboard.rank')" 
            width="80"
            align="center"
          >
            <template #default="{ row }">
              <div class="rank-cell" :class="`rank-${row.rank}`">
                <el-icon v-if="row.rank <= 3" size="20px">
                  <Trophy />
                </el-icon>
                <span>{{ row.rank }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column 
            prop="username" 
            :label="$t('leaderboard.username')"
            min-width="120"
          >
            <template #default="{ row }">
              <div class="username-cell">
                <el-icon><User /></el-icon>
                <span>{{ row.username }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column 
            prop="mode" 
            :label="$t('leaderboard.mode')" 
            width="100"
            align="center"
          >
            <template #default="{ row }">
              <el-tag :type="getModeTagType(row.mode)">
                {{ $t(`game.${row.mode}`) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column 
            prop="time" 
            :label="$t('leaderboard.time')" 
            width="120"
            align="center"
          >
            <template #default="{ row }">
              <div class="time-cell">
                <el-icon><Timer /></el-icon>
                <span>{{ formatTime(row.time) }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column 
            prop="date" 
            :label="$t('leaderboard.date')" 
            width="150"
            align="center"
          >
            <template #default="{ row }">
              <span>{{ formatDate(row.date) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 个人最佳成绩 -->
      <div v-if="isAuthenticated && personalBest" class="personal-best">
        <h3>{{ $t('leaderboard.personalBest') }}</h3>
        <div class="best-stats">
          <div class="stat-item">
            <span class="stat-label">{{ $t(`game.${selectedMode}`) }}</span>
            <span class="stat-value">{{ formatTime(personalBest.time) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">{{ $t('leaderboard.rank') }}</span>
            <span class="stat-value">#{{ personalBest.rank || 'N/A' }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">{{ $t('leaderboard.date') }}</span>
            <span class="stat-value">{{ formatDate(personalBest.date) }}</span>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Trophy, User, Timer } from '@element-plus/icons-vue'
import { userStore } from '../stores/userStore'
import { leaderboardAPI } from '../api'
import { formatTime } from '../utils/sudoku'

export default {
  name: 'Leaderboard',
  components: {
    Trophy,
    User,
    Timer
  },
  setup() {
    const { t } = useI18n()
    const loading = ref(false)
    const selectedMode = ref('4x4')
    const leaderboardData = ref([])
    const personalBest = ref(null)
    
    const isAuthenticated = computed(() => userStore.isAuthenticated)
    
    const gameModes = [
      { value: '4x4', label: '4x4' },
      { value: '5x5', label: '5x5' },
      { value: '6x6', label: '6x6' }
    ]
    
    // 获取模式标签类型
    const getModeTagType = (mode) => {
      switch (mode) {
        case '4x4': return 'success'
        case '5x5': return 'warning'
        case '6x6': return 'danger'
        default: return 'info'
      }
    }
    
    // 格式化日期
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString()
    }
    
    // 获取排行榜数据
    const fetchLeaderboard = async () => {
      loading.value = true
      try {
        const response = await leaderboardAPI.getLeaderboard(selectedMode.value, 50)
        leaderboardData.value = response.data.leaderboard.map((item, index) => ({
          ...item,
          rank: index + 1
        }))
        
        // 获取个人最佳成绩
        if (isAuthenticated.value) {
          const userRecord = response.data.leaderboard.find(
            item => item.username === userStore.user?.username
          )
          if (userRecord) {
            personalBest.value = {
              ...userRecord,
              rank: response.data.leaderboard.indexOf(userRecord) + 1
            }
          } else {
            personalBest.value = null
          }
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error)
        ElMessage.error(t('message.networkError'))
      } finally {
        loading.value = false
      }
    }
    
    onMounted(() => {
      fetchLeaderboard()
    })
    
    return {
      loading,
      selectedMode,
      leaderboardData,
      personalBest,
      gameModes,
      isAuthenticated,
      getModeTagType,
      formatDate,
      formatTime,
      fetchLeaderboard
    }
  }
}
</script>

<style scoped>
.leaderboard-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.leaderboard-card {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  border-radius: 15px;
  overflow: hidden;
}

.leaderboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.leaderboard-title {
  color: #2c3e50;
  margin: 0;
  font-weight: 300;
  font-size: 1.8rem;
}

.mode-selector {
  width: 150px;
}

.leaderboard-content {
  margin: 20px 0;
}

.leaderboard-table {
  width: 100%;
}

.rank-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-weight: bold;
}

.rank-1 {
  color: #FFD700;
}

.rank-2 {
  color: #C0C0C0;
}

.rank-3 {
  color: #CD7F32;
}

.username-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-weight: bold;
  color: #409EFF;
}

.personal-best {
  margin-top: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 10px;
}

.personal-best h3 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-weight: 300;
}

.best-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #2c3e50;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .leaderboard-container {
    padding: 10px;
  }
  
  .leaderboard-header {
    flex-direction: column;
    text-align: center;
  }
  
  .leaderboard-title {
    font-size: 1.5rem;
  }
  
  .mode-selector {
    width: 100%;
    max-width: 200px;
  }
  
  .best-stats {
    grid-template-columns: 1fr;
  }
  
  /* 隐藏部分列在小屏幕上 */
  .leaderboard-table :deep(.el-table__cell:nth-child(5)) {
    display: none;
  }
}

/* 高分辨率适配 */
@media (min-width: 2560px) {
  .leaderboard-title {
    font-size: 2.2rem;
  }
  
  .personal-best h3 {
    font-size: 1.4rem;
  }
  
  .stat-value {
    font-size: 1.4rem;
  }
}

@media (min-width: 3840px) {
  .leaderboard-title {
    font-size: 2.8rem;
  }
  
  .personal-best h3 {
    font-size: 1.8rem;
  }
  
  .stat-value {
    font-size: 1.8rem;
  }
}
</style>