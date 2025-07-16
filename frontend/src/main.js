import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import routes from './router'
import { zh, en } from './locales'

// 创建i18n实例
const i18n = createI18n({
  locale: localStorage.getItem('language') || 'zh',
  fallbackLocale: 'zh',
  messages: {
    zh,
    en
  }
})

// 创建路由
const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)

// 注册ElementPlus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus)
app.use(router)
app.use(i18n)

app.mount('#app')