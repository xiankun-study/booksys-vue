import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'

// 导入布局组件
import UserLayout from '../layouts/UserLayout.vue'
import AdminLayout from '../layouts/AdminLayout.vue'

// 用户端页面
import UserDashboard from '../views/user/UserDashboard.vue'
import UserBooks from '../views/user/Books.vue'
import UserBookDetail from '../views/user/BookDatil.vue'
import UserBorrows from '../views/user/Borrows.vue'
import UserProfile from '../views/user/Profile.vue'
import UserPassword from '../views/user/Password.vue'

// 管理员端页面
import AdminDashboard from '../views/admin/AdminDashboard.vue'
import AdminUsers from '../views/admin/Users.vue'
import AdminBooks from '../views/admin/Books.vue'
import AdminBorrows from '../views/admin/Borrows.vue'
import AdminOverdue from '../views/admin/Overdue.vue'
import AdminStats from '../views/admin/Stats.vue'
import AdminPassword from '../views/admin/Password.vue'
import AdminProfile from '../views/admin/Profile.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      title: '登录',
      requiresAuth: false
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: {
      title: '注册',
      requiresAuth: false
    }
  },
  // 用户端路由
  {
    path: '/user',
    component: UserLayout,
    meta: { requiresAuth: true, role: 1 },
    children: [
      {
        path: 'dashboard',
        name: 'UserDashboard',
        component: UserDashboard,
        meta: { title: '首页' }
      },
      {
        path: 'books',
        name: 'UserBooks',
        component: UserBooks,
        meta: { title: '图书检索' }
      },
      {
        path: 'books/detail/:id',
        name: 'UserBookDetail',
        component: UserBookDetail,
        meta: { title: '图书详情' }
      },
      {
        path: 'borrows',
        name: 'UserBorrows',
        component: UserBorrows,
        meta: { title: '我的借阅' }
      },
      {
        path: 'profile',
        name: 'UserProfile',
        component: UserProfile,
        meta: { title: '个人中心' }
      },
      {
        path: '/user/statistics',
        name: 'UserStatistics',
        component: () => import('@/views/user/ReadingStatistics.vue')
      },
      {
        path: 'password',
        name: 'UserPassword',
        component: UserPassword,
        meta: { title: '修改密码' }
      }
    ]
  },
  // 管理员端路由
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, role: 2 },
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: AdminDashboard,
        meta: { title: '首页列表' }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: AdminUsers,
        meta: { title: '用户管理' }
      },
      {
        path: 'books',
        name: 'AdminBooks',
        component: AdminBooks,
        meta: { title: '图书管理' }
      },
      {
        path: 'borrows',
        name: 'AdminBorrows',
        component: AdminBorrows,
        meta: { title: '借阅管理' }
      },
      {
        path: 'overdue',
        name: 'AdminOverdue',
        component: AdminOverdue,
        meta: { title: '逾期管理' }
      },
      {
        path: 'stats',
        name: 'AdminStats',
        component: AdminStats,
        meta: { title: '统计分析' }
      },
      {
        path: 'profile',
        name: 'AdminProfile',
        component: AdminProfile,
        meta: { title: '个人资料' }
      },
      {
        path: 'password',
        name: 'AdminPassword',
        component: AdminPassword,
        meta: { title: '修改密码' }
      }
    ]
  },
  {
    path: '/',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory('/'),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 智慧图书馆` : '智慧图书馆'

  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null

  // 需要登录的页面
  if (to.meta.requiresAuth) {
    if (!token || !user) {
      // 未登录，跳转到登录页
      next({ path: '/login', query: { redirect: to.fullPath } })
    } else {
      // 检查角色权限
      if (to.meta.role && user.userType !== to.meta.role) {
        // 权限不足，跳转到对应角色的首页
        if (user.userType === 2) {
          next('/admin/dashboard')
        } else {
          next('/user/dashboard')
        }
      } else {
        next() // 权限验证通过
      }
    }
  } else {
    if ((to.path === '/login' || to.path === '/register') && token) {
      if (user?.userType === 2) {
        next('/admin/dashboard')
      } else {
        next('/user/dashboard')
      }
    } else {
      next()
    }
  }
})

export default router