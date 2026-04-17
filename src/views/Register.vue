<template>
  <div class="register-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>

    <!-- 注册卡片 -->
    <div class="register-card">
      <!-- 左侧品牌区 -->
      <div class="register-left">
        <div class="brand-content">
          <div class="logo">
            <span class="logo-icon">LIB</span>
          </div>
          <h1 class="system-title">智慧图书馆</h1>
          <p class="system-subtitle">Smart Library Management System</p>
          
          <div class="features">
            <div class="feature-item">
              <i class="fa fa-check-circle"></i>
              <span>海量藏书</span>
            </div>
            <div class="feature-item">
              <i class="fa fa-check-circle"></i>
              <span>智能推荐</span>
            </div>
            <div class="feature-item">
              <i class="fa fa-check-circle"></i>
              <span>在线借阅</span>
            </div>
            <div class="feature-item">
              <i class="fa fa-check-circle"></i>
              <span>个人书房</span>
            </div>
          </div>
          
          <div class="login-prompt">
            已有账号？<el-button type="text" @click="goToLogin">立即登录</el-button>
          </div>
        </div>
      </div>

      <!-- 右侧注册表单 -->
      <div class="register-right">
        <div class="register-header">
          <h2>用户注册</h2>
          <p>Create New Account</p>
        </div>

        <el-form 
          ref="registerFormRef"
          :model="registerForm"
          :rules="registerRules"
          class="register-form"
        >
          <!-- 用户名 -->
          <el-form-item prop="username">
            <el-input
              v-model="registerForm.username"
              placeholder="用户名"
              size="large"
              class="custom-input"
            >
              <template #prepend>
                <i class="fa fa-user-o"></i>
              </template>
            </el-input>
          </el-form-item>

          <!-- 密码 -->
          <el-form-item prop="password">
            <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="密码"
              size="large"
              class="custom-input"
              show-password
            >
              <template #prepend>
                <i class="fa fa-lock"></i>
              </template>
            </el-input>
            <div class="password-hint">
              密码必须包含字母和数字，长度3-20位
            </div>
          </el-form-item>

          <!-- 确认密码 -->
          <el-form-item prop="confirmPassword">
            <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="确认密码"
              size="large"
              class="custom-input"
              show-password
            >
              <template #prepend>
                <i class="fa fa-check-circle-o"></i>
              </template>
            </el-input>
          </el-form-item>

          <!-- 邮箱 -->
          <el-form-item prop="email">
            <el-input
              v-model="registerForm.email"
              placeholder="电子邮箱"
              size="large"
              class="custom-input"
            >
              <template #prepend>
                <i class="fa fa-envelope-o"></i>
              </template>
            </el-input>
          </el-form-item>

          <!-- 真实姓名 -->
          <el-form-item prop="realName">
            <el-input
              v-model="registerForm.realName"
              placeholder="真实姓名"
              size="large"
              class="custom-input"
            >
              <template #prepend>
                <i class="fa fa-user"></i>
              </template>
            </el-input>
          </el-form-item>

          <!-- 手机号（可选） -->
          <el-form-item prop="phone">
            <el-input
              v-model="registerForm.phone"
              placeholder="手机号码（选填）"
              size="large"
              class="custom-input"
            >
              <template #prepend>
                <i class="fa fa-phone"></i>
              </template>
            </el-input>
          </el-form-item>

          <!-- 身份选择 -->
          <el-form-item prop="userType">
            <el-radio-group v-model="registerForm.userType" class="user-type-group">
              <el-radio :label="1" size="large">
                <i class="fa fa-user"></i> 普通用户
              </el-radio>
              <el-radio :label="2" size="large" disabled>
                <i class="fa fa-graduation-cap"></i> 管理员（需审核）
              </el-radio>
            </el-radio-group>
          </el-form-item>

          <!-- 注册按钮 -->
          <el-form-item>
            <el-button 
              type="primary"
              :loading="loading"
              class="register-button"
              @click="handleRegister"
              size="large"
            >
              <i class="fa" :class="loading ? 'fa-spinner fa-spin' : 'fa-user-plus'"></i>
              {{ loading ? '注册中...' : '注 册' }}
            </el-button>
          </el-form-item>

          <!-- 返回登录 -->
          <div class="back-to-login">
            <el-button type="text" @click="goToLogin">
              <i class="fa fa-arrow-left"></i> 返回登录
            </el-button>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'

export default {
  name: 'Register',
  data() {
    // 自定义确认密码验证器
    const validateConfirmPassword = (rule, value, callback) => {
      if (value !== this.registerForm.password) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }

    // 自定义手机号验证器
    const validatePhone = (rule, value, callback) => {
      if (value && !/^1[3-9]\d{9}$/.test(value)) {
        callback(new Error('请输入正确的手机号码'))
      } else {
        callback()
      }
    }

    return {
      registerForm: {
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        realName: '',
        phone: '',
        userType: 1,  // 默认普通用户
        agreement: false
      },
      
      registerRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 3, max: 20, message: '密码长度不能小于3位', trigger: 'blur' },
          { pattern: /^(?=.*[a-zA-Z])(?=.*\d)/, message: '密码必须包含字母和数字', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请确认密码', trigger: 'blur' },
          { validator: validateConfirmPassword, trigger: 'blur' }
        ],
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
        ],
        realName: [
          { required: true, message: '请输入真实姓名', trigger: 'blur' },
          { min: 2, max: 10, message: '长度在 2 到 10 个字符', trigger: 'blur' }
        ],
        phone: [
          { validator: validatePhone, trigger: 'blur' }
        ],
        userType: [
          { required: true, message: '请选择身份', trigger: 'change' }
        ],
      },
      
      loading: false
    }
  },
  
  methods: {
    // 处理注册
    async handleRegister() {
      this.$refs.registerFormRef.validate(async (valid) => {
        if (!valid) return

        this.loading = true
        try {
          const response = await this.$http.post('/user/register', {
            username: this.registerForm.username,
            password: this.registerForm.password,
            email: this.registerForm.email,
            realName: this.registerForm.realName,
            phone: this.registerForm.phone || null,
            userType: this.registerForm.userType,
            status: 1  // 默认启用
          })
          const res = response.data
          if (res.code === 200) {
            ElMessage.success('注册成功！请登录')
            // 跳转到登录页，并传入注册成功参数
            this.$router.push('/login?registered=true')
          } else {
            ElMessage.error(res.message || '注册失败，请稍后重试')
          }
        } catch (error) {
          ElMessage.error('注册失败：' + (error.response?.data?.message || error.message || '网络错误'))
        } finally {
          this.loading = false
        }
      })
    },

    // 跳转到登录页
    goToLogin() {
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.register-container {
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

/* 注册卡片 */
.register-card {
  width: 1100px;
  height: 700px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  display: flex;
  overflow: hidden;
  position: relative;
  z-index: 10;
}

/* 左侧品牌区 */
.register-left {
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
  height: 100%;
  display: flex;
  flex-direction: column;
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
  margin-bottom: auto;
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

.login-prompt {
  margin-top: 30px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  font-size: 14px;
}

.login-prompt .el-button {
  color: #ffd04b;
  font-weight: bold;
}

/* 右侧注册表单 */
.register-right {
  width: 60%;
  padding: 30px 40px;
  background: #fff;
  overflow-y: auto;
}

.register-header {
  margin-bottom: 20px;
}

.register-header h2 {
  font-size: 26px;
  color: #141414;
  margin-bottom: 5px;
  font-weight: 400;
}

.register-header p {
  color: #999;
  font-size: 14px;
}

.register-form {
  width: 100%;
}

/* 自定义输入框样式 */
.custom-input :deep(.el-input-group__prepend) {
  background-color: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-right: none;
  padding: 0 15px;
  width: 15px;
}

.custom-input :deep(.el-input__wrapper) {
  border: 1px solid #dcdfe6; 
  border-left: none;
  /* box-shadow: none; */
  padding: 0 15px;
}

.custom-input :deep(.el-input__wrapper:hover) {
  border-color: #c0c4cc;
}

.custom-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #1b1c1d inset;
}

/* 密码提示 */
.password-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  line-height: 1.5;
}

/* 身份选择组 */
.user-type-group {
  width: 100%;
  display: flex;
  gap: 20px;
  margin: 0px 0;
}

.user-type-group .el-radio {
  flex: 1;
}

/* 注册按钮 */
.register-button {
  width: 100%;
  height: 45px;
  font-size: 16px;
  background: #2b5876;
  border: none;
  border-radius: 5px;
  transition: all 0.3s;
}

.register-button:hover {
  background: #1e3c72;
  box-shadow: 0 5px 5px rgba(43, 88, 118, 0.3);
}

/* 返回登录 */
.back-to-login {
  text-align: center;
  margin-top: 10px;
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .register-card {
    width: 90%;
    height: auto;
    flex-direction: column;
  }
  
  .register-left {
    width: 100%;
    padding: 30px;
  }
  
  .register-right {
    width: 100%;
    padding: 30px;
  }
}
</style>