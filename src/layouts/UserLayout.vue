<template>
  <div class="user-layout">
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <div class="logo">📚 智慧图书馆</div>
          <el-menu
            :default-active="activeMenu"
            mode="horizontal"
            :ellipsis="false"
            class="nav-menu"
            router
          >
            <el-menu-item index="/user/dashboard">首页</el-menu-item>
            <el-menu-item index="/user/books">图书检索</el-menu-item>
            <el-menu-item index="/user/borrows">我的借阅</el-menu-item>
            <el-menu-item index="/user/profile">个人中心</el-menu-item>
          </el-menu>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" :src="userAvatar" />
              <span class="username">{{ userInfo?.realName || userInfo?.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>个人中心
                </el-dropdown-item>
                <el-dropdown-item command="password">
                  <el-icon><Lock /></el-icon>修改密码
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, User, Lock, SwitchButton } from '@element-plus/icons-vue'

export default {
  name: 'UserLayout',
  components: { ArrowDown, User, Lock, SwitchButton },
  data() {
    return {
      userInfo: null,
      userAvatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
    }
  },
  computed: {
    activeMenu() {
      return this.$route.path
    }
  },
  created() {
    this.getUserInfo()
  },
  methods: {
    getUserInfo() {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        this.userInfo = JSON.parse(userStr)
      }
    },
    handleCommand(command) {
      switch (command) {
        case 'profile':
          this.$router.push('/user/profile')
          break
        case 'password':
          this.$router.push('/user/password')
          break
        case 'logout':
          this.logout()
          break
      }
    },
    async logout() {
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'info'
        })
        
        await this.$http.post('/user/logout')
        
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('savedUsername')
        localStorage.removeItem('savedPassword')
        
        this.$router.push('/login?logout=true')
        ElMessage.success('已退出登录')
      } catch (error) {
        if (error !== 'cancel') {
          console.error('退出登录失败:', error)
        }
      }
    }
  }
}
</script>

<style scoped>
.user-layout {
  height: 100vh;
  background-color: #f5f7fa;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e6e9f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 40px;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  color: #2b5876;
}

.nav-menu {
  border-bottom: none;
}

.nav-menu :deep(.el-menu-item) {
  height: 60px;
  line-height: 60px;
  font-size: 15px;
}

.nav-menu :deep(.el-menu-item.is-active) {
  color: #2b5876;
  font-weight: 500;
  border-bottom-color: #2b5876;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 20px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.username {
  font-size: 14px;
  color: #333;
}

.main-content {
  padding: 20px 30px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>