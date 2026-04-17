<template>
  <div class="profile-page">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="profile-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>个人信息</span>
            </div>
          </template>

          <div class="user-avatar">
            <el-avatar :size="100" :src="userAvatar" />
            <h3>{{ userInfo?.realName || userInfo?.username }}</h3>
            <p class="user-type">{{ userInfo?.userType === 1 ? '普通用户' : '管理员' }}</p>
          </div>

          <div class="user-stats">
            <div class="stat-item">
              <div class="stat-value">{{ borrowStats.current }}</div>
              <div class="stat-label">当前借阅</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ borrowStats.total }}</div>
              <div class="stat-label">累计借阅</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ borrowStats.overdue }}</div>
              <div class="stat-label">逾期</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card class="profile-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>详细资料</span>
              <el-button type="primary" link @click="editProfile">
                <el-icon><Edit /></el-icon> 编辑
              </el-button>
            </div>
          </template>

          <el-form :model="userInfo" label-width="100px" v-loading="loading">
            <el-form-item label="用户名">
              <span>{{ userInfo?.username }}</span>
            </el-form-item>
            <el-form-item label="真实姓名">
              <span>{{ userInfo?.realName || '未设置' }}</span>
            </el-form-item>
            <el-form-item label="电子邮箱">
              <span>{{ userInfo?.email || '未设置' }}</span>
            </el-form-item>
            <el-form-item label="手机号码">
              <span>{{ userInfo?.phone || '未设置' }}</span>
            </el-form-item>
            <el-form-item label="注册时间">
              <span>{{ formatDate(userInfo?.createTime) }}</span>
            </el-form-item>
            <el-form-item label="账号状态">
              <el-tag :type="userInfo?.status === 1 ? 'success' : 'danger'">
                {{ userInfo?.status === 1 ? '正常' : '禁用' }}
              </el-tag>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="profile-card" shadow="hover" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span>安全设置</span>
            </div>
          </template>

          <div class="security-item">
            <div class="security-info">
              <el-icon><Lock /></el-icon>
              <div class="security-text">
                <div class="security-title">登录密码</div>
                <div class="security-desc">定期更换密码可以保护账号安全</div>
              </div>
            </div>
            <el-button type="primary" link @click="$router.push('/admin/password')">修改密码</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 编辑资料对话框 -->
    <el-dialog v-model="editDialog.visible" title="编辑资料" width="500px">
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="100px">
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="editForm.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="电子邮箱" prop="email">
          <el-input v-model="editForm.email" placeholder="请输入电子邮箱" />
        </el-form-item>
        <el-form-item label="手机号码" prop="phone">
          <el-input v-model="editForm.phone" placeholder="请输入手机号码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveProfile" :loading="editDialog.loading">
          保存修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import { Edit, Lock } from '@element-plus/icons-vue'

export default {
  name: 'UserProfile',
  components: { Edit, Lock },
  data() {
    return {
      userInfo: null,
      userAvatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
      loading: false,
      borrowStats: {
        current: 0,
        total: 0,
        overdue: 0
      },
      editDialog: {
        visible: false,
        loading: false
      },
      editForm: {
        realName: '',
        email: '',
        phone: ''
      },
      editRules: {
        email: [
          { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
        ],
        phone: [
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.getUserInfo()
    this.loadBorrowStats()
  },
  methods: {
    getUserInfo() {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        this.userInfo = JSON.parse(userStr)
        this.editForm = {
          realName: this.userInfo.realName || '',
          email: this.userInfo.email || '',
          phone: this.userInfo.phone || ''
        }
      } else {
        this.$router.push('/login')
      }
    },

    async loadBorrowStats() {
      if (!this.userInfo) return

      try {
        // 当前借阅数
        const currentRes = await this.$http.get('/borrow/countBorrowing', {
          params: { userId: this.userInfo.userId }
        })
        if (currentRes.data.code === 200) {
          this.borrowStats.current = currentRes.data.data || 0
        }

        // 总借阅数
        const totalRes = await this.$http.get('/borrow/userRecords', {
          params: { userId: this.userInfo.userId }
        })
        if (totalRes.data.code === 200) {
          this.borrowStats.total = totalRes.data.count || 0
        }

        // 逾期数
        const overdueRes = await this.$http.get('/borrow/overdueBorrows', {
          params: { userId: this.userInfo.userId }
        })
        if (overdueRes.data.code === 200) {
          this.borrowStats.overdue = overdueRes.data.count || 0
        }
      } catch (error) {
        console.error('加载借阅统计失败:', error)
      }
    },

    formatDate(dateStr) {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    },

    editProfile() {
      this.editDialog.visible = true
    },

    async saveProfile() {
      if (!this.userInfo) return

      this.$refs.editFormRef.validate(async (valid) => {
        if (!valid) return

        this.editDialog.loading = true
        try {
          const res = await this.$http.put('/user/update', {
            userId: this.userInfo.userId,
            realName: this.editForm.realName,
            email: this.editForm.email,
            phone: this.editForm.phone
          })

          if (res.data.code === 200) {
            ElMessage.success('资料更新成功')
            this.editDialog.visible = false
            // 更新本地存储
            this.userInfo = { ...this.userInfo, ...this.editForm }
            localStorage.setItem('user', JSON.stringify(this.userInfo))
          } else {
            ElMessage.error(res.data.message || '更新失败')
          }
        } catch (error) {
          ElMessage.error('更新失败：' + (error.response?.data?.message || error.message))
        } finally {
          this.editDialog.loading = false
        }
      })
    }
  }
}
</script>

<style scoped>
.profile-page {
  padding: 0;
}

.profile-card {
  border: none;
  border-radius: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
  font-size: 16px;
}

.user-avatar {
  text-align: center;
  padding: 20px 0;
}

.user-avatar h3 {
  margin-top: 15px;
  font-size: 18px;
  color: #333;
}

.user-type {
  color: #999;
  font-size: 14px;
  margin-top: 5px;
}

.user-stats {
  display: flex;
  justify-content: space-around;
  padding: 20px 0;
  border-top: 1px solid #eee;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #2b5876;
}

.stat-label {
  font-size: 14px;
  color: #999;
  margin-top: 5px;
}

.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #eee;
}

.security-item:last-child {
  border-bottom: none;
}

.security-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.security-info .el-icon {
  font-size: 20px;
  color: #2b5876;
}

.security-text {
  flex: 1;
}

.security-title {
  font-size: 16px;
  color: #333;
  margin-bottom: 5px;
}

.security-desc {
  font-size: 12px;
  color: #999;
}
</style>