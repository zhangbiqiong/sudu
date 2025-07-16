<template>
  <div class="home">
    <div class="hero-section">
      <h2 class="hero-title">{{ $t('game.title') }}</h2>
      <p class="hero-subtitle">{{ $t('app.title') }}</p>
    </div>
    
    <div class="game-modes">
      <h3 class="section-title">{{ $t('game.mode') }}</h3>
      <div class="mode-cards">
        <el-card 
          v-for="mode in gameModes" 
          :key="mode.value"
          class="mode-card"
          @click="startGame(mode.value)"
        >
          <div class="mode-content">
            <div class="mode-icon">
              <el-icon size="48px">
                <Grid />
              </el-icon>
            </div>
            <h4 class="mode-title">{{ $t(`game.${mode.value}`) }}</h4>
            <p class="mode-description">{{ mode.description }}</p>
          </div>
        </el-card>
      </div>
    </div>
    
    <div class="quick-actions">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8">
          <el-card class="action-card" @click="$router.push('/leaderboard')">
            <div class="action-content">
              <el-icon size="32px" color="#409EFF">
                <Trophy />
              </el-icon>
              <h4>{{ $t('leaderboard.title') }}</h4>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="8" v-if="isAuthenticated">
          <el-card class="action-card" @click="$router.push('/profile')">
            <div class="action-content">
              <el-icon size="32px" color="#67C23A">
                <User />
              </el-icon>
              <h4>{{ $t('nav.profile') }}</h4>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="8" v-else>
          <el-card class="action-card" @click="$router.push('/login')">
            <div class="action-content">
              <el-icon size="32px" color="#E6A23C">
                <UserFilled />
              </el-icon>
              <h4>{{ $t('user.login') }}</h4>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { userStore } from '../stores/userStore'
import { Grid, Trophy, User, UserFilled } from '@element-plus/icons-vue'

export default {
  name: 'Home',
  components: {
    Grid,
    Trophy,
    User,
    UserFilled
  },
  setup() {
    const router = useRouter()
    const { t } = useI18n()
    const isAuthenticated = computed(() => userStore.isAuthenticated)
    
    const gameModes = [
      {
        value: '4x4',
        description: t('game.4x4')
      },
      {
        value: '5x5', 
        description: t('game.5x5')
      },
      {
        value: '6x6',
        description: t('game.6x6')
      }
    ]
    
    const startGame = (mode) => {
      router.push(`/game/${mode}`)
    }
    
    return {
      gameModes,
      isAuthenticated,
      startGame
    }
  }
}
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.hero-section {
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem 0;
}

.hero-title {
  font-size: 3rem;
  color: white;
  margin-bottom: 1rem;
  font-weight: 300;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.hero-subtitle {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

.section-title {
  color: white;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 1.8rem;
  font-weight: 300;
}

.mode-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.mode-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.mode-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  border-color: #409EFF;
}

.mode-content {
  text-align: center;
  padding: 1rem;
}

.mode-icon {
  margin-bottom: 1rem;
  color: #409EFF;
}

.mode-title {
  margin: 1rem 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.3rem;
}

.mode-description {
  color: #666;
  margin: 0;
}

.quick-actions {
  margin-top: 3rem;
}

.action-card {
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 1rem;
}

.action-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.action-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
}

.action-content h4 {
  margin: 0.5rem 0 0 0;
  color: #2c3e50;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .mode-cards {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .quick-actions .el-col {
    margin-bottom: 1rem;
  }
}

/* 高分辨率适配 */
@media (min-width: 2560px) {
  .hero-title {
    font-size: 4rem;
  }
  
  .hero-subtitle {
    font-size: 1.5rem;
  }
  
  .section-title {
    font-size: 2.2rem;
  }
  
  .mode-title {
    font-size: 1.6rem;
  }
}

@media (min-width: 3840px) {
  .hero-title {
    font-size: 5rem;
  }
  
  .hero-subtitle {
    font-size: 1.8rem;
  }
  
  .section-title {
    font-size: 2.8rem;
  }
  
  .mode-title {
    font-size: 2rem;
  }
}
</style>