<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <h2 class="login-title">{{ $t('user.login') }}</h2>
      </template>
      
      <el-form 
        ref="loginFormRef"
        :model="loginForm" 
        :rules="loginRules"
        label-width="100px"
        @submit.prevent="handleLogin"
      >
        <el-form-item :label="$t('user.username')" prop="username">
          <el-input 
            v-model="loginForm.username"
            :placeholder="$t('user.username')"
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item :label="$t('user.password')" prop="password">
          <el-input 
            v-model="loginForm.password"
            type="password"
            :placeholder="$t('user.password')"
            show-password
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleLogin"
            :loading="loading"
            style="width: 100%"
          >
            {{ $t('user.login') }}
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <p>
          {{ $t('message.noAccount') }}
          <el-button type="text" @click="$router.push('/register')">
            {{ $t('user.register') }}
          </el-button>
        </p>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { userStore } from '../stores/userStore'

export default {
  name: 'Login',
  components: {
    User,
    Lock
  },
  setup() {
    const router = useRouter()
    const { t } = useI18n()
    const loginFormRef = ref()
    const loading = ref(false)
    
    const loginForm = reactive({
      username: '',
      password: ''
    })
    
    const loginRules = {
      username: [
        { required: true, message: t('message.usernameRequired'), trigger: 'blur' },
        { min: 3, max: 20, message: t('message.usernameLength'), trigger: 'blur' }
      ],
      password: [
        { required: true, message: t('message.passwordRequired'), trigger: 'blur' },
        { min: 6, message: t('message.passwordLength'), trigger: 'blur' }
      ]
    }
    
    const handleLogin = async () => {
      if (!loginFormRef.value) return
      
      try {
        await loginFormRef.value.validate()
        loading.value = true
        
        const result = await userStore.login(loginForm.username, loginForm.password)
        
        if (result.success) {
          ElMessage.success(t('message.loginSuccess'))
          router.push('/')
        } else {
          ElMessage.error(result.message || t('message.loginFailed'))
        }
      } catch (error) {
        console.log('Form validation failed:', error)
      } finally {
        loading.value = false
      }
    }
    
    return {
      loginForm,
      loginRules,
      loginFormRef,
      loading,
      handleLogin
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border-radius: 10px;
  overflow: hidden;
}

.login-title {
  text-align: center;
  color: #2c3e50;
  margin: 0;
  font-weight: 300;
  font-size: 1.8rem;
}

.login-footer {
  text-align: center;
  margin-top: 1rem;
}

.login-footer p {
  color: #666;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-container {
    padding: 10px;
  }
  
  .login-card {
    max-width: 100%;
  }
  
  .login-title {
    font-size: 1.5rem;
  }
}

/* 高分辨率适配 */
@media (min-width: 2560px) {
  .login-card {
    max-width: 500px;
  }
  
  .login-title {
    font-size: 2.2rem;
  }
}

@media (min-width: 3840px) {
  .login-card {
    max-width: 600px;
  }
  
  .login-title {
    font-size: 2.8rem;
  }
}
</style>