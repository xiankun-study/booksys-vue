<template>
  <div class="user-dashboard">
    <el-card class="welcome-card" shadow="hover">
      <div class="welcome-content">
        <div>
          <h2>欢迎回来，{{ userInfo?.realName || userInfo?.username }}！</h2>
          <p class="welcome-text">今天是 {{ currentDate }}，您有 {{ currentBorrowCount }} 本图书正在借阅中</p>
        </div>
        <div class="welcome-stats">
          <div class="stat-item">
            <div class="stat-value">{{ currentBorrowCount }}</div>
            <div class="stat-label">当前借阅</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ totalBorrowCount }}</div>
            <div class="stat-label">累计借阅</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ overdueCount }}</div>
            <div class="stat-label">逾期</div>
          </div>
          <div class="stat-item notice-stat-item" @click="showNotifications">
            <div class="notice-icon-wrapper">
              <el-icon :size="26"><Bell /></el-icon>
              <span v-if="unreadCount > 0" class="badge-dot"></span>
            </div>
            
          </div>
        </div>
      </div>
    </el-card>

    <!-- 快捷操作 -->
    <el-row :gutter="20" class="quick-actions">
      <el-col :span="6" v-for="action in quickActions" :key="action.path">
        <el-card class="action-card" shadow="hover" @click="$router.push(action.path)">
          <el-icon class="action-icon">
            <component :is="action.icon" />
          </el-icon>
          <div class="action-title">{{ action.title }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 逾期提醒  -->
    <el-card v-if="overdueBorrows.length > 0" class="section-card overdue-card" shadow="hover">
      <template #header>
        <div class="card-header"><span>逾期提醒</span><el-tag type="danger" size="small">{{ overdueBorrows.length
            }}条</el-tag></div>
      </template>
      <div v-for="item in overdueBorrows" :key="item.borrowId" class="overdue-item">
        <div class="overdue-info">
          <div class="overdue-title">{{ item.bookTitle || '未知图书' }}</div>
          <div class="overdue-date">逾期 {{ getOverdueDays(item.dueDate) }} 天</div>
        </div>
        <el-button type="danger" size="small" @click="returnNow(item)">立即归还</el-button>
      </div>
    </el-card>

    <!-- 热门推荐模块 -->
    <el-card class="section-card" shadow="hover">
      <template #header>
        <div class="card-header"><span>热门推荐⭐</span></div>
      </template>
      <el-row :gutter="20">
        <el-col :span="6" v-for="book in hotBooks" :key="book.bookId || book.book_id">
          <el-card class="recommend-card" :body-style="{ padding: '0px' }" shadow="hover">
            <div class="recommend-info">
              <div class="recommend-title">{{ book.title || '未命名' }}</div>
              <div class="recommend-author">{{ book.author || '未知作者' }}</div>
              <div class="recommend-stock">可借：{{ book.availableCopies || book.available_copies || 0 }}</div>
              <div class="recommend-action">
                <el-button type="primary" size="small" @click="viewBookDetail(book)">查看</el-button>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-empty v-if="hotBooks.length === 0" description="暂无推荐数据" />
      </el-row>
    </el-card>

    <!-- 当前借阅 -->
    <el-card class="section-card" shadow="hover">
      <template #header>
        <div class="card-header"><span>当前借阅</span><el-button type="primary" link
            @click="$router.push('/user/borrows')">查看全部</el-button></div>
      </template>
      <el-table :data="currentBorrows" stripe v-loading="loading.borrows">
        <el-table-column prop="bookTitle" label="书名" min-width="200"><template #default="{ row }">
            <div class="book-info"><span class="book-title">{{ row.bookTitle || '未知图书' }}</span></div>
          </template></el-table-column>
        <el-table-column prop="borrowDate" label="借阅日期" width="120"><template #default="{ row }">{{
          formatDate(row.borrowDate) }}</template></el-table-column>
        <el-table-column prop="dueDate" label="应还日期" width="120"><template #default="{ row }"><span
              :class="{ 'text-danger': isOverdue(row.dueDate) }">{{ formatDate(row.dueDate)
              }}</span></template></el-table-column>
        <el-table-column prop="status" label="状态" width="100"><template #default="{ row }"><el-tag
              :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status)
              }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="150"><template #default="{ row }"><el-button type="primary" link
              @click="renewBook(row)" :disabled="!canRenew(row)">续借</el-button></template></el-table-column>
      </el-table>
      <el-empty v-if="!loading.borrows && currentBorrows.length === 0" description="暂无借阅记录" />
    </el-card>

    <!-- 续借对话框 -->
    <el-dialog v-model="renewDialog.visible" title="续借确认" width="400px">
      <div class="renew-info">
        <p>确认续借《{{ renewDialog.book?.bookTitle }}》？</p>
        <p>续借天数：15 天</p>
        <p class="text-warning">注意：每本书最多可续借 2 次</p>
      </div>
      <template #footer>
        <el-button @click="renewDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmRenew" :loading="renewDialog.loading">确认续借</el-button>
      </template>
    </el-dialog>

    <!-- 通知弹窗 -->
    <el-dialog 
      v-model="notificationDialogVisible" 
      title="消息通知" 
      width="500px"
      append-to-body
      destroy-on-close
    >
      <el-timeline v-if="notifications.length > 0">
        <el-timeline-item 
          v-for="notice in notifications" 
          :key="notice.notificationId"
          :timestamp="formatNoticeTime(notice.createTime)"
          placement="top"
          :type="notice.type === 'overdue' ? 'danger' : 'warning'"
        >
          <el-card shadow="hover" class="notice-card">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <strong>{{ notice.title }}</strong>
              <el-tag v-if="notice.status === 0" type="danger" size="small" effect="dark">新</el-tag>
            </div>
            <p>{{ notice.content }}</p>
            <el-link type="primary" size="small" @click="goToBorrow(notice.borrowId)">查看详情</el-link>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无新通知" />

      <template #footer>
        <el-button @click="markAllAsRead" :loading="markingLoading">全部标为已读</el-button>
        <el-button type="primary" @click="notificationDialogVisible = false">我知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ElMessage, ElNotification } from 'element-plus'
import { Search, List, Star, User, Bell } from '@element-plus/icons-vue'

export default {
  name: 'UserDashboard',
  components: { Search, List, Star, User, Bell },
  data() {
    return {
      userInfo: null,
      currentDate: '',
      currentBorrowCount: 0,
      totalBorrowCount: 0,
      overdueCount: 0,
      currentBorrows: [],
      overdueBorrows: [],
      hotBooks: [],
      notificationDialogVisible: false,
      notifications: [],
      unreadCount: 0,
      markingLoading: false,
      
      loading: { borrows: false, books: false },
      quickActions: [
        { title: '检索图书', icon: 'Search', path: '/user/books' },
        { title: '我的借阅', icon: 'List', path: '/user/borrows' },
        { title: '阅读统计', icon: 'Star', path: '/user/statistics' },
        { title: '个人中心', icon: 'User', path: '/user/profile' }
      ],
      renewDialog: { visible: false, loading: false, book: null }
    }
  },
  created() {
    this.getUserInfo()
    this.getCurrentDate()
    this.loadData()
    this.loadNotifications()
  },
  methods: {
    getUserInfo() {
      const userStr = localStorage.getItem('user')
      if (userStr) this.userInfo = JSON.parse(userStr)
    },
    getCurrentDate() {
      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
      const weekday = weekdays[date.getDay()]
      this.currentDate = `${year}年${month}月${day}日 ${weekday}`
    },
    async loadData() {
      if (!this.userInfo) return
      this.loading.borrows = true
      try {
        await Promise.all([
          this.loadCurrentBorrows(),
          this.loadBorrowStats(),
          this.loadHotBooks()
        ])
      } catch (error) {
        console.error('加载数据失败:', error)
      } finally {
        this.loading.borrows = false
      }
    },
    async loadCurrentBorrows() {
      try {
        const res = await this.$http.get('/borrow/currentBorrows', { params: { userId: this.userInfo.userId } })
        if (res.data.code === 200) {
          this.currentBorrows = res.data.data || []
          await this.enrichBookInfo(this.currentBorrows)
          this.overdueBorrows = this.currentBorrows.filter(b => b.status === 3 || this.isOverdue(b.dueDate))
          this.overdueCount = this.overdueBorrows.length
          this.currentBorrowCount = this.currentBorrows.length
        }
      } catch (error) { console.error('加载借阅记录失败:', error) }
    },
    async loadBorrowStats() {
      try {
        const res = await this.$http.get('/borrow/userRecords', { params: { userId: this.userInfo.userId } })
        if (res.data.code === 200) {
          this.totalBorrowCount = res.data.count || 0
        }
      } catch (error) { console.error('加载借阅统计失败:', error) }
    },
    async loadHotBooks() {
      try {
        const res = await this.$http.get('/borrow/stats/hotBooks');
        if (res.data.code === 200) {
          this.hotBooks = (res.data.data || []).slice(0, 8);
        } else {
          console.warn("热门图书接口返回异常:", res.data);
        }
      } catch (error) {
        console.error('加载热门图书失败:', error);
        this.hotBooks = [];
      }
    },
    async enrichBookInfo(borrows) {
      for (const borrow of borrows) {
        if (!borrow.bookTitle) {
          try {
            const res = await this.$http.get(`/book/detail/${borrow.bookId}`)
            if (res.data.code === 200) {
              borrow.bookTitle = res.data.data.title
              borrow.bookAuthor = res.data.data.author
            }
          } catch (error) { borrow.bookTitle = `图书 ID: ${borrow.bookId}` }
        }
      }
    },
    formatDate(dateStr) {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    },
    isOverdue(dueDate) { return new Date(dueDate) < new Date() },
    getOverdueDays(dueDate) {
      const now = new Date(); const due = new Date(dueDate)
      return Math.ceil((now - due) / (1000 * 60 * 60 * 24))
    },
    getStatusType(status) {
      return { 1: 'warning', 2: 'success', 3: 'danger' }[status] || 'info'
    },
    getStatusText(status) {
      return { 1: '借阅中', 2: '已归还', 3: '逾期' }[status] || '未知'
    },
    canRenew(borrow) {
      return borrow.status === 1 && borrow.renewCount < 2 && !this.isOverdue(borrow.dueDate)
    },
    renewBook(book) {
      if (!this.canRenew(book)) {
        ElMessage.warning('该图书无法续借')
        return
      }
      this.renewDialog.book = book
      this.renewDialog.visible = true
    },
    async confirmRenew() {
      if (!this.renewDialog.book) return
      this.renewDialog.loading = true
      try {
        const res = await this.$http.post('/borrow/renew', null, {
          params: {
            borrowId: this.renewDialog.book.borrowId,
            renewDays: 15
          }
        })
        if (res.data.code === 200) {
          ElMessage.success('续借成功')
          this.renewDialog.visible = false
          await this.loadCurrentBorrows()
        } else {
          ElMessage.error(res.data.message || '续借失败')
        }
      } catch (error) {
        ElMessage.error('续借失败：' + (error.response?.data?.message || error.message))
      } finally {
        this.renewDialog.loading = false
      }
    },
    returnNow(borrow) { this.$router.push(`/user/borrows?return=${borrow.borrowId}`) },
    viewBookDetail(book) {
      const id = book.bookId || book.book_id
      if (!id) {
        console.error("图书信息缺少 ID:", book);
        ElMessage.error("图书信息不完整，无法查看详情");
        return;
      }
      this.$router.push(`/user/books/detail/${id}`)
    },
    async loadNotifications() {
      if (!this.userInfo) return
      try {
        const countRes = await this.$http.get('/notification/unreadCount', {
          params: { userId: this.userInfo.userId }
        })
        if (countRes.data.code === 200) {
          this.unreadCount = countRes.data.data || 0
        }
        if (this.unreadCount > 0) {
          setTimeout(async () => {
            await this.loadNotificationList()
            const stillUnread = this.notifications.filter(n => n.status === 0).length
            if (stillUnread > 0) {
              ElNotification({
                title: '您有新消息',
                message: `您有 ${stillUnread} 条未读通知`,
                type: 'warning',
                position: 'bottom-right',
                duration: 3000
              })
            }
          }, 1000)
        }
      } catch (error) {
        console.warn('加载通知数量失败:', error)
      }
    },
    async loadNotificationList() {
      try {
        const res = await this.$http.get('/notification/list', {
          params: { page: 0, size: 20 }
        })
        if (res.data.code === 200) {
          this.notifications = res.data.data || []
        }
      } catch (error) {
        console.error('加载通知列表失败:', error)
        this.notifications = []
      }
    },
    showNotifications() {
      this.notificationDialogVisible = true
      this.loadNotificationList()
    },
    formatNoticeTime(timeStr) {
      if (!timeStr) return ''
      const date = new Date(timeStr)
      const now = new Date()
      const diff = Math.floor((now - date) / 60000)
      if (diff < 1) return '刚刚'
      if (diff < 60) return `${diff}分钟前`
      if (diff < 1440) return `${Math.floor(diff / 60)}小时前`
      return timeStr.substring(0, 16)
    },
    async markAllAsRead() {
      if (this.notifications.length === 0) return
      this.markingLoading = true
      try {
        const res = await this.$http.put('/notification/readAll')
        if (res.data.code === 200) {
          ElMessage.success('已全部标为已读')
          this.notifications.forEach(n => n.status = 1)
          this.unreadCount = 0
        } else {
          ElMessage.error(res.data.message || '操作失败')
        }
      } catch (error) {
        console.error('标记已读失败:', error)
        ElMessage.error('操作失败')
      } finally {
        this.markingLoading = false
      }
    },
    goToBorrow(borrowId) {
      if (!borrowId) return
      this.$router.push(`/user/borrows?detail=${borrowId}`)
    }
  }
}
</script>

<style scoped>
.user-dashboard {
  padding: 0;
}

.welcome-card {
  margin-bottom: 20px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #2b5876 0%, #4e4376 100%);
  color: #fff;
}

.welcome-card :deep(.el-card__body) {
  padding: 30px;
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-content h2 {
  font-size: 24px;
  font-weight: 500;
  margin-bottom: 10px;
}

.welcome-text {
  font-size: 14px;
  opacity: 0.9;
}

.welcome-stats {
  display: flex;
  gap: 40px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.8;
}

/* 🔑 消息通知统计项样式 */
.notice-stat-item {
  cursor: pointer;
  transition: all 0.3s ease;
}

.notice-stat-item:hover {
  transform: translateY(-3px);
}

/* 🔑 磨砂玻璃容器（图标居中）*/
.notice-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  margin: 10px auto; /* 🔑 水平居中 */
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.notice-stat-item:hover .notice-icon-wrapper {
  background: rgba(255, 255, 255, 0.25);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.notice-icon-wrapper .el-icon {
  color: #fff;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

/* 🔑 红点提醒（无数字，纯圆点）*/
.badge-dot {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  background: linear-gradient(135deg, #f56c6c 0%, #e74c3c 100%);
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 6px rgba(245, 108, 108, 0.6),
              0 0 0 2px rgba(245, 108, 108, 0.2);
  animation: pulse-dot 1.5s infinite ease-in-out;
  z-index: 10;
}

/* 🔑 红点呼吸脉冲动画 */
@keyframes pulse-dot {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
    box-shadow: 0 2px 6px rgba(245, 108, 108, 0.6),
                0 0 0 2px rgba(245, 108, 108, 0.2);
  }
  50% {
    transform: scale(1.2);
    opacity: 0.85;
    box-shadow: 0 3px 8px rgba(245, 108, 108, 0.8),
                0 0 0 3px rgba(245, 108, 108, 0.1);
  }
}

/* 以下 CSS 全部保持不变... */
.quick-actions { margin-bottom: 20px; }
.action-card { text-align: center; cursor: pointer; transition: all 0.3s; border: none; border-radius: 10px; }
.action-card:hover { transform: translateY(-5px); box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1); }
.action-icon { font-size: 32px; color: #2b5876; margin-bottom: 10px; }
.action-title { font-size: 16px; color: #333; }
.section-card { margin-bottom: 20px; border: none; border-radius: 10px; }
.overdue-card { border-left: 4px solid #f56c6c; }
.card-header { display: flex; justify-content: space-between; align-items: center; font-weight: 500; font-size: 16px; }
.book-info { display: flex; align-items: center; gap: 10px; }
.book-title { font-size: 14px; font-weight: 500; color: #333; }
.text-danger { color: #f56c6c; font-weight: 500; }
.text-warning { color: #e6a23c; }
.overdue-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #eee; }
.overdue-item:last-child { border-bottom: none; }
.overdue-info { flex: 1; }
.overdue-title { font-size: 14px; font-weight: 500; color: #333; margin-bottom: 4px; }
.overdue-date { font-size: 12px; color: #f56c6c; }
.recommend-card { border: none; border-radius: 8px; overflow: hidden; }
.recommend-info { padding: 15px; text-align: center; }
.recommend-title { font-size: 14px; font-weight: 500; color: #333; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.recommend-author { font-size: 12px; color: #999; margin-bottom: 8px; }
.recommend-stock { font-size: 12px; color: #67c23a; margin-bottom: 10px; }
.renew-info { text-align: center; padding: 20px; }
.renew-info p { margin-bottom: 10px; font-size: 14px; }

/* 🔑 通知弹窗卡片样式 */
.notice-card {
  margin-bottom: 10px;
  background: #f9fafc;
  border-radius: 8px;
}

.notice-card p {
  margin: 8px 0;
  font-size: 13px;
  line-height: 1.5;
}

.notice-card strong {
  color: #333;
  font-size: 14px;
}
</style>
