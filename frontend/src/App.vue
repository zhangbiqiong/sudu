<template>
  <div id="app">
    <el-container class="app-container">
      <el-header class="app-header">
        <div class="header-content">
          <h1 class="title">{{ $t('app.title') }}</h1>
          <div class="header-actions">
            <!-- 语言切换 -->
            <el-select v-model="currentLanguage" @change="changeLanguage" class="language-selector">
              <el-option label="中文" value="zh"></el-option>
              <el-option label="English" value="en"></el-option>
            </el-select>
            
            <!-- 用户信息 -->
            <div v-if="user" class="user-info">
              <span>{{ $t('user.welcome') }}, {{ user.username }}</span>
              <el-button @click="logout" type="text">{{ $t('user.logout') }}</el-button>
            </div>
            <div v-else class="auth-buttons">
              <el-button @click="$router.push('/login')" type="primary">{{ $t('user.login') }}</el-button>
              <el-button @click="$router.push('/register')">{{ $t('user.register') }}</el-button>
            </div>
          </div>
        </div>
      </el-header>
      
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { userStore } from './stores/userStore'

export default {
  name: 'App',
  setup() {
    const { locale } = useI18n()
    const router = useRouter()
    const currentLanguage = ref(locale.value)
    const user = computed(() => userStore.user)

    const changeLanguage = (lang) => {
      locale.value = lang
      localStorage.setItem('language', lang)
    }

    const logout = () => {
      userStore.logout()
      router.push('/')
    }

    onMounted(() => {
      userStore.checkAuth()
    })

    return {
      currentLanguage,
      user,
      changeLanguage,
      logout
    }
  }
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.app-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.title {
  font-size: 2rem;
  color: #2c3e50;
  margin: 0;
  font-weight: 300;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.language-selector {
  width: 120px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.auth-buttons {
  display: flex;
  gap: 10px;
}

.app-main {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 15px;
    padding: 15px;
  }
  
  .title {
    font-size: 1.5rem;
  }
  
  .header-actions {
    gap: 15px;
  }
}

/* 高分辨率适配 */
@media (min-width: 2560px) {
  .header-content {
    max-width: 1600px;
  }
  
  .title {
    font-size: 2.5rem;
  }
  
  .app-main {
    max-width: 1600px;
  }
}

@media (min-width: 3840px) {
  .header-content {
    max-width: 2400px;
  }
  
  .title {
    font-size: 3rem;
  }
  
  .app-main {
    max-width: 2400px;
  }
}
</style>