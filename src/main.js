import { createApp } from 'vue'
import App from './App.vue'
import axios from 'axios'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'font-awesome/css/font-awesome.min.css'
import router from './router'
import { ElMessage } from 'element-plus'

axios.defaults.baseURL = "http://localhost:8080"
axios.defaults.timeout = 10000

// 请求拦截器 - 添加token
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      const status = error.response.status
      const data = error.response.data
      
      if (status === 401) {
        // 清除本地存储
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('savedUsername')
        localStorage.removeItem('savedPassword')
        
        // 跳转到登录页
        if (router.currentRoute.value.path !== '/login') {
          router.push('/login?expired=true')
        }
      } else {
        ElMessage.error(data.message || '请求失败')
      }
    }
    return Promise.reject(error)
  }
)

const app = createApp(App)
app.config.globalProperties.$http = axios
app.use(router)
app.use(ElementPlus)
app.mount('#app')