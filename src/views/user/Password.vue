<template>
  <div class="password-page">
    <el-card class="password-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>修改密码</span>
        </div>
      </template>

      <el-form 
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="100px"
        style="max-width: 500px; margin: 0 auto;"
        v-loading="loading"
      >
        <el-form-item label="当前密码" prop="oldPassword">
          <el-input 
            v-model="passwordForm.oldPassword" 
            type="password" 
            show-password
            placeholder="请输入当前密码"
          />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input 
            v-model="passwordForm.newPassword" 
            type="password" 
            show-password
            placeholder="请输入新密码"
          />
          <div class="password-hint">密码长度3-20位</div>
        </el-form-item>

        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input 
            v-model="passwordForm.confirmPassword" 
            type="password" 
            show-password
            placeholder="请再次输入新密码"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="changePassword" :loading="loading">
            确认修改
          </el-button>
          <el-button @click="$router.back()">返回</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'

export default {
  name: 'UserPassword',
  data() {
    // 自定义确认密码验证器
    const validateConfirmPassword = (rule, value, callback) => {
      if (value !== this.passwordForm.newPassword) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }

    return {
      passwordForm: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      passwordRules: {
        oldPassword: [
          { required: true, message: '请输入当前密码', trigger: 'blur' }
        ],
        newPassword: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { min: 3, max: 20, message: '密码长度在 3 到 20 个字符', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请确认新密码', trigger: 'blur' },
          { validator: validateConfirmPassword, trigger: 'blur' }
        ]
      },
      loading: false
    }
  },
  methods: {
    async changePassword() {
      this.$refs.passwordFormRef.validate(async (valid) => {
        if (!valid) return

        this.loading = true
        try {
          // 调用修改密码接口
          const res = await this.$http.put('/user/password', {
            oldPassword: this.passwordForm.oldPassword,
            newPassword: this.passwordForm.newPassword
          })

          if (res.data.code === 200) {
            ElMessage.success('密码修改成功，请重新登录')
            
            // 清除登录状态
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            localStorage.removeItem('savedUsername')
            localStorage.removeItem('savedPassword')
            
            // 跳转到登录页
            setTimeout(() => {
              this.$router.push('/login')
            }, 1500)
          } else {
            ElMessage.error(res.data.message || '修改失败')
          }
        } catch (error) {
          console.error('修改密码失败:', error)
          if (error.response?.data?.message) {
            ElMessage.error(error.response.data.message)
          } else {
            ElMessage.error('修改失败：' + (error.message || '网络错误'))
          }
        } finally {
          this.loading = false
        }
      })
    }
  }
}
</script>

<style scoped>
.password-page {
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 140px);
}

.password-card {
  width: 100%;
  max-width: 600px;
  border: none;
  border-radius: 10px;
}

.card-header {
  font-weight: 500;
  font-size: 18px;
}

.password-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
</style>