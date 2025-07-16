<template>
  <div class="register-container">
    <el-card class="register-card">
      <template #header>
        <h2 class="register-title">{{ $t('user.register') }}</h2>
      </template>
      
      <el-form 
        ref="registerFormRef"
        :model="registerForm" 
        :rules="registerRules"
        label-width="120px"
        @submit.prevent="handleRegister"
      >
        <el-form-item :label="$t('user.username')" prop="username">
          <el-input 
            v-model="registerForm.username"
            :placeholder="$t('user.username')"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item :label="$t('user.password')" prop="password">
          <el-input 
            v-model="registerForm.password"
            type="password"
            :placeholder="$t('user.password')"
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item :label="$t('user.confirmPassword')" prop="confirmPassword">
          <el-input 
            v-model="registerForm.confirmPassword"
            type="password"
            :placeholder="$t('user.confirmPassword')"
            show-password
            @keyup.enter="handleRegister"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleRegister"
            :loading="loading"
            style="width: 100%"
          >
            {{ $t('user.register') }}
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="register-footer">
        <p>
          {{ $t('message.hasAccount') }}
          <el-button type="text" @click="$router.push('/login')">
            {{ $t('user.login') }}
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
  name: 'Register',
  components: {
    User,
    Lock
  },
  setup() {
    const router = useRouter()
    const { t } = useI18n()
    const registerFormRef = ref()
    const loading = ref(false)
    
    const registerForm = reactive({
      username: '',
      password: '',
      confirmPassword: ''
    })
    
    const validateConfirmPassword = (rule, value, callback) => {
      if (value !== registerForm.password) {
        callback(new Error(t('message.passwordMismatch')))
      } else {
        callback()
      }
    }
    
    const registerRules = {
      username: [
        { required: true, message: t('message.usernameRequired'), trigger: 'blur' },
        { min: 3, max: 20, message: t('message.usernameLength'), trigger: 'blur' }
      ],
      password: [
        { required: true, message: t('message.passwordRequired'), trigger: 'blur' },
        { min: 6, message: t('message.passwordLength'), trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, message: t('message.confirmPasswordRequired'), trigger: 'blur' },
        { validator: validateConfirmPassword, trigger: 'blur' }
      ]
    }
    
    const handleRegister = async () => {
      if (!registerFormRef.value) return
      
      try {
        await registerFormRef.value.validate()
        loading.value = true
        
        const result = await userStore.register(registerForm.username, registerForm.password)
        
        if (result.success) {
          ElMessage.success(t('message.registerSuccess'))
          router.push('/login')
        } else {
          ElMessage.error(result.message || t('message.registerFailed'))
        }
      } catch (error) {
        console.log('Form validation failed:', error)
      } finally {
        loading.value = false
      }
    }
    
    return {
      registerForm,
      registerRules,
      registerFormRef,
      loading,
      handleRegister
    }
  }
}
</script>

<style scoped>
.register-container {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.register-card {
  width: 100%;
  max-width: 450px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border-radius: 10px;
  overflow: hidden;
}

.register-title {
  text-align: center;
  color: #2c3e50;
  margin: 0;
  font-weight: 300;
  font-size: 1.8rem;
}

.register-footer {
  text-align: center;
  margin-top: 1rem;
}

.register-footer p {
  color: #666;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .register-container {
    padding: 10px;
  }
  
  .register-card {
    max-width: 100%;
  }
  
  .register-title {
    font-size: 1.5rem;
  }
}

/* 高分辨率适配 */
@media (min-width: 2560px) {
  .register-card {
    max-width: 550px;
  }
  
  .register-title {
    font-size: 2.2rem;
  }
}

@media (min-width: 3840px) {
  .register-card {
    max-width: 650px;
  }
  
  .register-title {
    font-size: 2.8rem;
  }
}
</style>