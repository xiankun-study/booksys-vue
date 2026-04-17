<template>
  <div class="login-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>

    <!-- 登录卡片 -->
    <div class="login-card">
      <!-- 左侧品牌区 -->
      <div class="login-left">
        <div class="brand-content">
          <div class="logo">
            <span class="logo-icon">LIB</span>
          </div>
          <h1 class="system-title">智慧图书馆</h1>
          <p class="system-subtitle">Smart Library Management System</p>
          
          <div class="features">
            <div class="feature-item">
              <i class="fa fa-check-circle"></i>
              <span>图书借阅</span>
            </div>
            <div class="feature-item">
              <i class="fa fa-check-circle"></i>
              <span>智能检索</span>
            </div>
            <div class="feature-item">
              <i class="fa fa-check-circle"></i>
              <span>阅读统计</span>
            </div>
            <div class="feature-item">
              <i class="fa fa-check-circle"></i>
              <span>个人中心</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧登录表单 -->
      <div class="login-right">
        <div class="login-header">
          <h2>用户登录</h2>
          <p>Welcome Back</p>
        </div>

        <el-form 
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
        >
          <!-- 用户名输入框 -->
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="用户名"
              size="large"
              class="custom-input"
            >
              <template #prepend>
                <i class="fa fa-user-o"></i>
              </template>
            </el-input>
          </el-form-item>

          <!-- 密码输入框 -->
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="密码"
              size="large"
              class="custom-input"
              show-password
              @keyup.enter="handleLogin"
            >
              <template #prepend>
                <i class="fa fa-lock"></i>
              </template>
            </el-input>
          </el-form-item>

          <!-- 身份选择 -->
          <el-form-item prop="userType">
            <el-radio-group v-model="loginForm.userType" class="user-type-group">
              <el-radio :label="1" size="large">
                <i class="fa fa-user"></i> 普通用户
              </el-radio>
              <el-radio :label="2" size="large">
                <i class="fa fa-graduation-cap"></i> 管理员
              </el-radio>
            </el-radio-group>
          </el-form-item>

          <!-- 登录选项 -->
          <div class="login-options">
            <el-checkbox v-model="rememberMe">记住我</el-checkbox>
            <el-button type="text" @click="forgotPassword">忘记密码？</el-button>
          </div>

          <!-- 登录按钮 -->
          <el-form-item>
            <el-button 
              type="primary"
              :loading="loading"
              class="login-button"
              @click="handleLogin"
              size="large"
            >
              <i class="fa" :class="loading ? 'fa-spinner fa-spin' : 'fa-sign-in'"></i>
              {{ loading ? '登录中...' : '登 录' }}
            </el-button>
          </el-form-item>

          <!-- 注册链接 -->
          <div class="register-link">
            还没有账号？
            <el-button type="text" @click="goToRegister">立即注册</el-button>
          </div>

          <!-- 退出成功提示 -->
          <transition name="fade">
            <div v-if="message.show" class="message-popup" :class="message.type">
              <i class="fa" :class="message.icon"></i>
              {{ message.text }}
            </div>
          </transition>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'

export default {
  name: 'Login',
  data() {
    return {
      loginForm: {
        username: '',
        password: '',
        userType: 1
      },
      loginRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
        ],
        userType: [
          { required: true, message: '请选择身份', trigger: 'change' }
        ]
      },
      loading: false,
      rememberMe: false,
      message: {
        show: false,
        text: '',
        type: 'success',
        icon: 'fa-check-circle'
      }
    }
  },
  
  created() {
    const query = this.$route.query
    if (query.logout) {
      this.showMessage('退出登录成功', 'success', 'fa-check-circle')
    } else if (query.expired) {
      this.showMessage('登录已过期，请重新登录', 'warning', 'fa-exclamation-circle')
    } else if (query.registered) {
      this.showMessage('注册成功，请登录', 'success', 'fa-check-circle')
    }

    const savedUsername = localStorage.getItem('savedUsername')
    const savedPassword = localStorage.getItem('savedPassword')
    if (savedUsername && savedPassword) {
      this.loginForm.username = savedUsername
      this.loginForm.password = savedPassword
      this.rememberMe = true
    }
  },
  
  methods: {
    showMessage(text, type = 'success', icon = 'fa-check-circle') {
      this.message = { show: true, text, type, icon }
      setTimeout(() => {
        this.message.show = false
      }, 3000)
    },

    async handleLogin() {
      this.$refs.loginFormRef.validate(async (valid) => {
        if (!valid) return

        this.loading = true
        try {
          const response = await this.$http.post('/user/login', {
            username: this.loginForm.username,
            password: this.loginForm.password,
            userType: this.loginForm.userType
          })
          
          const res = response.data
          if (res.code === 200) {
            // 保存 token 和用户信息
            localStorage.setItem('token', res.token)
            localStorage.setItem('user', JSON.stringify(res.data))

            // 记住密码
            if (this.rememberMe) {
              localStorage.setItem('savedUsername', this.loginForm.username)
            // 移除密码存储
              localStorage.removeItem('savedPassword')
            } else {
              localStorage.removeItem('savedUsername')
              localStorage.removeItem('savedPassword')
            }

            ElMessage.success('登录成功！')

            // 直接跳转，不等待
            const redirect = this.loginForm.userType === 2 ? '/admin/dashboard' : '/user/dashboard'
            this.$router.push(redirect)
          } else {
            ElMessage.error(res.message || '用户名或密码错误')
          }
        } catch (error) {
          console.error('登录错误:', error)
          ElMessage.error('登录失败：' + (error.response?.data?.message || error.message))
        } finally {
          this.loading = false
        }
      })
    },

    goToRegister() {
      this.$router.push('/register')
    },

    forgotPassword() {
      ElMessage.info('请联系管理员重置密码')
    }
  }
}
</script>

<style scoped>
.login-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 背景装饰圆圈 */
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.03);
}

.circle-1 {
  width: 600px;
  height: 600px;
  top: -200px;
  right: -200px;
}

.circle-2 {
  width: 400px;
  height: 400px;
  bottom: -100px;
  left: -100px;
}

.circle-3 {
  width: 300px;
  height: 300px;
  bottom: 50px;
  right: 100px;
}

/* 登录卡片 */
.login-card {
  width: 1000px;
  height: 600px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  display: flex;
  overflow: hidden;
  position: relative;
  z-index: 10;
}

/* 左侧品牌区 */
.login-left {
  width: 40%;
  background: linear-gradient(135deg, #2b5876 0%, #4e4376 100%);
  padding: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.brand-content {
  text-align: center;
}

.logo {
  margin-bottom: 30px;
}

.logo-icon {
  font-size: 32px;
  font-weight: bold;
  letter-spacing: 2px;
  background: rgba(255, 255, 255, 0.2);
  padding: 10px 20px;
  border-radius: 5px;
}

.system-title {
  font-size: 28px;
  font-weight: 500;
  margin-bottom: 10px;
  letter-spacing: 1px;
}

.system-subtitle {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 40px;
  letter-spacing: 1px;
}

.features {
  text-align: left;
}

.feature-item {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  font-size: 14px;
}

.feature-item i {
  margin-right: 10px;
  color: #4cd964;
  font-size: 16px;
}

/* 右侧登录表单 */
.login-right {
  width: 60%;
  padding: 50px 40px;
  background: #fff;
  position: relative;
}

.login-header {
  margin-bottom: 30px;
}

.login-header h2 {
  font-size: 26px;
  color: #333;
  margin-bottom: 5px;
  font-weight: 400;
}

.login-header p {
  color: #999;
  font-size: 14px;
}

.login-form {
  width: 100%;
}

/* 自定义输入框样式 */
.custom-input :deep(.el-input-group__prepend) {
  background-color: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-right: none;
  padding: 0 15px;
}

.custom-input :deep(.el-input__wrapper) {
  border: 1px solid #dcdfe6;
  border-left: none;
  padding: 0 15px;
}

.custom-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409EFF inset;
}

/* 身份选择组 */
.user-type-group {
  width: 100%;
  display: flex;
  justify-content: space-between;
  margin: 10px 0;
}

.user-type-group .el-radio {
  flex: 1;
  margin-right: 10px;
}

.user-type-group .el-radio:last-child {
  margin-right: 0;
}

/* 登录选项 */
.login-options {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 登录按钮 */
.login-button {
  width: 100%;
  height: 45px;
  font-size: 16px;
  background: #2b5876;
  border: none;
  border-radius: 5px;
  transition: all 0.3s;
}

.login-button:hover {
  background: #1e3c72;
  box-shadow: 0 5px 15px rgba(43, 88, 118, 0.3);
}

/* 注册链接 */
.register-link {
  text-align: center;
  margin-top: 15px;
  font-size: 14px;
  color: #666;
}

/* 消息弹窗 */
.message-popup {
  position: absolute;
  top: -50px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 25px;
  border-radius: 5px;
  font-size: 14px;
  display: flex;
  align-items: center;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  animation: slideDown 0.3s ease-out;
  white-space: nowrap;
}

.message-popup.success {
  background: #67c23a;
  color: #fff;
}

.message-popup.warning {
  background: #e6a23c;
  color: #fff;
}

.message-popup i {
  margin-right: 8px;
  font-size: 16px;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .login-card {
    width: 90%;
    height: auto;
    flex-direction: column;
  }
  
  .login-left {
    width: 100%;
    padding: 30px;
  }
  
  .login-right {
    width: 100%;
    padding: 30px;
  }
}
</style>