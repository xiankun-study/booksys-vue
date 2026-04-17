<template>
  <div class="admin-layout">
    <el-container>
      <el-aside width="220px" class="sidebar">
        <div class="sidebar-header">
          <div class="logo">📚 智慧图书馆</div>
          <div class="admin-badge">管理员</div>
        </div>
        
        <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          router
          :collapse="false"
          :unique-opened="true"
          @menu-close="handleMenuClose" 
        >
          <el-menu-item index="/admin/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>首页列表</span>
          </el-menu-item>
          
          <el-sub-menu index="1">
            <template #title>
              <el-icon><User /></el-icon>
              <span>用户管理</span>
            </template>
            <el-menu-item index="/admin/users">用户列表</el-menu-item>
          </el-sub-menu>
          
          <el-sub-menu index="2">
            <template #title>
              <el-icon><Reading /></el-icon>
              <span>图书管理</span>
            </template>
            <el-menu-item index="/admin/books">图书列表</el-menu-item>
          </el-sub-menu>
          
          <el-sub-menu index="3">
            <template #title>
              <el-icon><List /></el-icon>
              <span>借阅管理</span>
            </template>
            <el-menu-item index="/admin/borrows">借阅记录</el-menu-item>
            <el-menu-item index="/admin/overdue">逾期管理</el-menu-item>
          </el-sub-menu>
          
          <el-sub-menu index="4">
            <template #title>
              <el-icon><DataLine /></el-icon>
              <span>统计分析</span>
            </template>
            <el-menu-item index="/admin/stats">数据统计</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>

      <el-container>
        <el-header class="admin-header">
          <div class="header-left">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/admin/dashboard' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item>{{ currentRouteName }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          
          <div class="header-right">
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <el-avatar :size="36" :src="userAvatar" />
                <span class="username">{{ userInfo?.realName || userInfo?.username }}</span>
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon>个人资料
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

        <el-main class="admin-main">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Odometer, User, Reading, List, DataLine,
  ArrowDown, Lock, SwitchButton 
} from '@element-plus/icons-vue'

export default {
  name: 'AdminLayout',
  components: {
    Odometer, User, Reading, List, DataLine,
    ArrowDown, Lock, SwitchButton
  },
  data() {
    return {
      userInfo: null,
      userAvatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
    }
  },
  computed: {
    activeMenu() {
      return this.$route.path
    },
    currentRouteName() {
      return this.$route.meta.title || '未知'
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
          this.$router.push('/admin/profile')
          break
        case 'password':
          this.$router.push('/admin/password')
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
.admin-layout {
  height: 100vh;
  background-color: #f5f7fa;

  display: flex;
  flex-direction: column;
}

.el-container {
  height: 100%;
  flex: 1;
  display: flex;
  min-height: 0; /* 重要：防止flex溢出 */
}

.sidebar {
  background-color: #1e2a3a;
  color: #fff;
  height: 100vh;
  overflow-y: auto;
}

.sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 5px;
}

.admin-badge {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.sidebar-menu {
  background-color: transparent;
  border-right: none;
}

.sidebar-menu :deep(.el-menu-item),
.sidebar-menu :deep(.el-sub-menu__title) {
  color: rgba(255, 255, 255, 0.8);
}

.sidebar-menu :deep(.el-menu-item:hover),
.sidebar-menu :deep(.el-sub-menu__title:hover) {
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background-color: #2b5876;
  color: #fff;
}

.sidebar-menu :deep(.el-sub-menu .el-menu-item) {
  background-color: rgba(0, 0, 0, 0.3);
  padding-left: 50px !important;
}

.admin-header {
  background-color: #fff;
  border-bottom: 1px solid #e6e9f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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

.admin-main {
  padding: 20px;
  background-color: #f5f7fa;
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