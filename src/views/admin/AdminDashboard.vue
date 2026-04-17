<template>
  <div class="admin-dashboard">
    <!-- 第一行：统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6" v-for="stat in stats" :key="stat.title">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" :class="stat.iconClass">
              <el-icon>
                <component :is="stat.icon" />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">{{ stat.title }}</div>
              <div class="stat-value">{{ stat.value }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 第二行：快捷操作 + 待处理事项 + 智能预警 -->
    <el-row :gutter="20" class="middle-row">
      <!-- 快捷操作 -->
      <el-col :span="8">
        <el-card class="action-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>⚡ 快捷操作</span>
            </div>
          </template>

          <div class="action-grid">
            <div class="action-item" @click="$router.push('/admin/borrows?action=add')">
              <div class="action-icon borrow-action">
                <el-icon>
                  <DocumentAdd />
                </el-icon>
              </div>
              <div class="action-text">新增借阅</div>
            </div>

            <div class="action-item" @click="$router.push('/admin/books?action=add')">
              <div class="action-icon book-action">
                <el-icon>
                  <Plus />
                </el-icon>
              </div>
              <div class="action-text">新增图书</div>
            </div>

            <div class="action-item" @click="$router.push('/admin/users?action=add')">
              <div class="action-icon user-action">
                <el-icon>
                  <UserFilled />
                </el-icon>
              </div>
              <div class="action-text">新增用户</div>
            </div>

            <div class="action-item" @click="$router.push('/admin/stats')">
              <div class="action-icon stats-action">
                <el-icon>
                  <DataLine />
                </el-icon>
              </div>
              <div class="action-text">数据报表</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 待处理事项 -->
      <el-col :span="8">
        <el-card class="todo-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>📋 待处理事项</span>
              <el-tag type="danger" size="small" v-if="pendingCount > 0">{{ pendingCount }}</el-tag>
            </div>
          </template>

          <div class="todo-list">
            <div class="todo-item" @click="$router.push('/admin/overdue')">
              <div class="todo-icon overdue-icon">
                <el-icon>
                  <Warning />
                </el-icon>
              </div>
              <div class="todo-content">
                <div class="todo-title">逾期未还</div>
                <div class="todo-count">{{ stats.overdue?.value || 0 }} 条记录</div>
              </div>
              <el-icon class="todo-arrow">
                <ArrowRight />
              </el-icon>
            </div>

            <div class="todo-item" @click="$router.push('/admin/overdue?tab=expiring')">
              <div class="todo-icon warning-icon">
                <el-icon>
                  <Clock />
                </el-icon>
              </div>
              <div class="todo-content">
                <div class="todo-title">即将到期</div>
                <div class="todo-count">{{ expiringCount }} 条记录</div>
              </div>
              <el-icon class="todo-arrow">
                <ArrowRight />
              </el-icon>
            </div>

            <div class="todo-item" @click="$router.push('/admin/borrows?status=1')">
              <div class="todo-icon normal-icon">
                <el-icon>
                  <List />
                </el-icon>
              </div>
              <div class="todo-content">
                <div class="todo-title">借阅中</div>
                <div class="todo-count">{{ stats.borrows?.value || 0 }} 条记录</div>
              </div>
              <el-icon class="todo-arrow">
                <ArrowRight />
              </el-icon>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 智能预警 -->
      <el-col :span="8">
        <el-card class="alert-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>⚠️ 智能预警</span>
              <el-tag :type="alertLevel" size="small">{{ alertLevel === 'success' ? '正常' : '注意' }}</el-tag>
            </div>
          </template>

          <div class="alert-list">
            <div v-for="(alert, index) in alerts" :key="index" class="alert-item">
              <el-icon :class="alert.iconClass">
                <component :is="alert.icon" />
              </el-icon>
              <div class="alert-content">
                <div class="alert-title">{{ alert.title }}</div>
                <div class="alert-desc">{{ alert.desc }}</div>

                <!-- 库存预警特有：点击查看明细 -->
                <div v-if="alert.level === 'warning' && alert.title.includes('库存')" class="alert-action">
                  <el-link type="warning" :underline="false" @click.stop="viewLowStockAlerts">
                    <el-icon>
                      <View />
                    </el-icon> 查看详情
                  </el-link>
                </div>
              </div>
            </div>

            <el-empty v-if="alerts.length === 0" description="暂无预警" :image-size="50" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 第三行：最近借阅记录 -->
    <el-row :gutter="20" class="table-row">
      <el-col :span="24">
        <el-card class="data-table" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>📖 最近借阅记录</span>
              <div class="header-actions">
                <el-button type="primary" link @click="loadData">
                  <el-icon>
                    <Refresh />
                  </el-icon> 刷新
                </el-button>
                <el-button type="primary" link @click="$router.push('/admin/borrows')">
                  查看全部 <el-icon>
                    <ArrowRight />
                  </el-icon>
                </el-button>
              </div>
            </div>
          </template>

          <el-table :data="recentBorrows" stripe v-loading="loading" border style="width: 100%">
            <el-table-column prop="username" label="借阅人" width="120" />
            <el-table-column prop="bookTitle" label="书名" min-width="250" />
            <el-table-column prop="borrowDate" label="借阅日期" width="120">
              <template #default="{ row }">{{ formatDate(row.borrowDate) }}</template>
            </el-table-column>
            <el-table-column prop="dueDate" label="应还日期" width="120">
              <template #default="{ row }">{{ formatDate(row.dueDate) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
                <el-button type="success" link size="small" v-if="row.status === 1"
                  @click="returnBook(row)">归还</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 库存不足详情弹窗 -->
    <el-dialog v-model="lowStockDialogVisible" title="库存不足图书列表" width="750px" :close-on-click-modal="false"
      destroy-on-close>
      <div class="legend">
        <span>共 {{ lowStockBooks.length }} 本库存不足：</span>
        <el-tag size="small" effect="plain">0 = 缺货</el-tag>
        <el-tag size="small" effect="plain" type="warning">1 = 余量紧张</el-tag>
      </div>

      <el-table :data="lowStockBooks" stripe height="400" border style="margin-top: 15px">
        <el-table-column prop="bookId" label="ID" width="60" sortable />
        <el-table-column prop="title" label="书名" min-width="200" />
        <el-table-column prop="author" label="作者" width="120" />
        <el-table-column prop="publisher" label="出版社" width="140" />
        <el-table-column prop="totalCopies" label="总数量" width="80" />
        <el-table-column prop="availableCopies" label="可借数" width="90">
          <template #default="{ row }">
            <el-tag :type="row.availableCopies === 0 ? 'danger' : 'warning'" size="medium">
              {{ row.availableCopies }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="lowStockDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="$router.push('/admin/books')">
            前往补货管理
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import {
  User, Reading, List, Warning, Clock,
  DocumentAdd, Plus, UserFilled, DataLine,
  ArrowRight, Refresh, View
} from '@element-plus/icons-vue'

export default {
  name: 'AdminDashboard',
  components: {
    User, Reading, List, Warning, Clock,
    DocumentAdd, Plus, UserFilled, DataLine,
    ArrowRight, Refresh, View
  },
  data() {
    return {
      stats: {
        users: { title: '总用户数', icon: 'User', iconClass: 'user-icon', value: 0, sub: '活跃用户' },
        books: { title: '总藏书量', icon: 'Reading', iconClass: 'book-icon', value: 0, sub: '可借图书' },
        borrows: { title: '借阅中', icon: 'List', iconClass: 'borrow-icon', value: 0, sub: '今日借出' },
        overdue: { title: '逾期数量', icon: 'Warning', iconClass: 'overdue-icon', value: 0, sub: '即将到期' }
      },
      expiringCount: 0,
      pendingCount: 0,
      recentBorrows: [],
      loading: false,
      alerts: [],
      // 库存弹窗相关
      lowStockDialogVisible: false,
      lowStockBooks: []
    }
  },
  computed: {
    alertLevel() {
      if (this.alerts.length === 0) return 'success'
      if (this.alerts.some(a => a.level === 'error')) return 'danger'
      if (this.alerts.some(a => a.level === 'warning')) return 'warning'
      return 'info'
    }
  },
  created() {
    this.loadData()
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        await Promise.all([
          this.loadUserStats(),
          this.loadBookStats(),
          this.loadBorrowStats(),
          this.loadRecentBorrows(),
          this.checkAlerts()
        ])
        this.pendingCount = (this.stats.overdue?.value || 0) + this.expiringCount
      } catch (error) {
        console.error('加载数据失败:', error)
      } finally {
        this.loading = false
      }
    },

    async loadUserStats() {
      try {
        const res = await this.$http.get('/user/list', { params: { page: 0, size: 1 } })
        if (res.data.code === 200) {
          this.stats.users.value = res.data.total || 0
          this.stats.users.sub = `活跃：${res.data.total || 0}`
        }
      } catch (error) {
        console.error('加载用户统计失败:', error)
      }
    },

    async loadBookStats() {
      try {
        const res = await this.$http.get('/book/list', { params: { page: 0, size: 1 } })
        if (res.data.code === 200) {
          this.stats.books.value = res.data.total || 0
          this.stats.books.sub = `可借：${res.data.total || 0}`
        }
      } catch (error) {
        console.error('加载图书统计失败:', error)
      }
    },

    async loadBorrowStats() {
      try {
        const borrowRes = await this.$http.get('/borrow/list', {
          params: {
            page: 0,
            size: 1,
            status: 1
          }
        })
        if (borrowRes.data.code === 200) {
          this.stats.borrows.value = borrowRes.data.total || 0
        } else {
          this.stats.borrows.value = 0
          console.warn('借阅中统计接口返回异常:', borrowRes.data)
        }

        // 逾期数量
        const overdueRes = await this.$http.get('/user/overdue/list', { params: { page: 0, size: 1 } })
        if (overdueRes.data.code === 200) {
          this.stats.overdue.value = overdueRes.data.total || 0
        } else {
          this.stats.overdue.value = 0
        }

        // 即将到期数量
        const expiringRes = await this.$http.get('/borrow/expiring')
        if (expiringRes.data.code === 200) {
          this.expiringCount = expiringRes.data.count || 0
          this.stats.overdue.sub = `即将到期：${this.expiringCount}`
        } else {
          this.expiringCount = 0
          this.stats.overdue.sub = '即将到期：0'
        }
      } catch (error) {
        console.error('加载借阅统计失败:', error)
        this.stats.borrows.value = 0
        this.stats.overdue.value = 0
        this.expiringCount = 0
        this.stats.overdue.sub = '即将到期：0'
      }
    },
    async loadRecentBorrows() {
      try {
        const res = await this.$http.get('/borrow/list', { params: { page: 0, size: 10 } })
        if (res.data.code === 200) {
          this.recentBorrows = res.data.data || []
          await this.enrichBorrowInfo()
        }
      } catch (error) {
        console.error('加载最近借阅失败:', error)
      }
    },

    async enrichBorrowInfo() {
      for (const borrow of this.recentBorrows) {
        try {
          const userRes = await this.$http.get(`/user/detail/${borrow.userId}`)
          if (userRes.data.code === 200) {
            borrow.username = userRes.data.data.username
          }

          const bookRes = await this.$http.get(`/book/detail/${borrow.bookId}`)
          if (bookRes.data.code === 200) {
            borrow.bookTitle = bookRes.data.data.title
          }
        } catch (error) {
          borrow.username = `用户 ID: ${borrow.userId}`
          borrow.bookTitle = `图书 ID: ${borrow.bookId}`
        }
      }
    },

    async checkAlerts() {
      this.alerts = []

      if (this.stats.overdue.value > 10) {
        this.alerts.push({
          level: 'error',
          icon: 'Warning',
          iconClass: 'alert-icon-error',
          title: '逾期率过高',
          desc: `当前逾期 ${this.stats.overdue.value} 本`
        })
      }

      if (this.expiringCount > 5) {
        this.alerts.push({
          level: 'warning',
          icon: 'Clock',
          iconClass: 'alert-icon-warning',
          title: '集中到期',
          desc: `${this.expiringCount} 本图书 7 天内到期`
        })
      }

      const lowStockCount = await this.checkLowStock()
      if (lowStockCount > 0) {
        this.alerts.push({
          level: 'warning',
          icon: 'Reading',
          iconClass: 'alert-icon-warning',
          title: '库存预警',
          desc: `${lowStockCount} 本图书库存不足`
        })
      }
    },

    // 库存预警点击事件
    async viewLowStockAlerts() {
      await this.loadLowStockBooks()
      this.lowStockDialogVisible = true
    },

    // 加载库存不足的图书列表
    async loadLowStockBooks() {
      try {
        const res = await this.$http.get('/book/list', {
          params: { page: 0, size: 100 } // 限制获取数量以防过多
        })
        if (res.data.code === 200) {
          this.lowStockBooks = res.data.data.filter(
            book => book.availableCopies <= 1
          )
          // 按库存数升序排序（最缺的在前面）
          this.lowStockBooks.sort((a, b) => a.availableCopies - b.availableCopies)
        } else {
          ElMessage.error('获取库存数据失败')
        }
      } catch (error) {
        console.error('加载库存数据失败:', error)
        ElMessage.error('加载失败，请稍后重试')
      }
    },

    async checkLowStock() {
      try {
        const res = await this.$http.get('/book/list', { params: { page: 0, size: 100 } })
        if (res.data.code === 200) {
          return res.data.data.filter(b => b.availableCopies <= 1).length
        }
      } catch (error) {
        return 0
      }
      return 0
    },

    formatDate(dateStr) {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    },

    getStatusType(status) {
      return { 1: 'warning', 2: 'success', 3: 'danger' }[status] || 'info'
    },

    getStatusText(status) {
      return { 1: '借阅中', 2: '已归还', 3: '逾期' }[status] || '未知'
    },

    viewDetail(row) {
      this.$router.push(`/admin/borrows?id=${row.borrowId}`)
    },

    async returnBook(row) {
      try {
        await this.$http.post('/borrow/return', null, { params: { borrowId: row.borrowId } })
        ElMessage.success('归还成功')
        this.loadData()
      } catch (error) {
        ElMessage.error('归还失败')
      }
    }
  }
}
</script>

<style scoped>
.admin-dashboard {
  padding: 20px;
  background-color: #f5f7fa;
  overflow: visible;
}

/* 第一行：统计卡片 */
.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border: none;
  border-radius: 10px;
  transition: transform 0.3s, box-shadow 0.3s;
  display: flex;
  align-items: center;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
  width: 100%;
}

.stat-icon {
  width: 55px;
  height: 55px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  color: #fff;
  flex-shrink: 0;
}

.user-icon {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.book-icon {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}

.borrow-icon {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}

.overdue-icon {
  background: linear-gradient(135deg, #f43b47, #453a94);
}

.stat-info {
  flex: 1;
  overflow: hidden;
}

.stat-title {
  font-size: 14px;
  color: #999;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  line-height: 1.2;
}

.stat-sub {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

/* 第二行：三个卡片统一高度 */
.middle-row {
  margin-bottom: 20px;
}

.action-card,
.todo-card,
.alert-card {
  border: none;
  border-radius: 10px;
  height: auto;
  min-height: 260px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 15px;
  color: #333;
  padding-bottom: 0;
}

/* 快捷操作 */
.action-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  padding: 15px;
  overflow: visible;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 15px;
  background: #f8f9fa;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.action-item:hover {
  background: #e9ecef;
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
}

.action-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  font-size: 24px;
  color: #fff;
}

.borrow-action {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}

.book-action {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}

.user-action {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.stats-action {
  background: linear-gradient(135deg, #11998e, #38ef7d);
}

.action-text {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

/* 待处理事项 */
.todo-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 15px;
  overflow: visible;
}

.todo-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.todo-item:hover {
  background-color: #e9ecef;
  transform: translateX(5px);
}

.todo-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 20px;
  color: #fff;
  flex-shrink: 0;
}

.todo-icon.overdue-icon {
  background: linear-gradient(135deg, #f56c6c, #e6a23c);
}

.todo-icon.warning-icon {
  background: linear-gradient(135deg, #e6a23c, #f5b041);
}

.todo-icon.normal-icon {
  background: linear-gradient(135deg, #67c23a, #95d475);
}

.todo-content {
  flex: 1;
}

.todo-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.todo-count {
  font-size: 12px;
  color: #999;
}

.todo-arrow {
  color: #999;
  font-size: 16px;
}

/* 智能预警 */
.alert-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 15px;
  overflow: visible;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 15px;
  background: #fef0f0;
  border-radius: 10px;
  border-left: 4px solid #f56c6c;
  transition: background 0.2s;
}

.alert-item:hover {
  background: #fff0f0;
}

.alert-icon-error {
  color: #f56c6c;
  font-size: 22px;
  flex-shrink: 0;
}

.alert-icon-warning {
  color: #e6a23c;
  font-size: 22px;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.alert-desc {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

/* 库存预警详情链接 */
.alert-action {
  margin-top: 5px;
}

/* 第三行：表格 */
.table-row {
  margin-bottom: 20px;
}

.data-table {
  border: none;
  border-radius: 10px;
  padding: 0;
}

.header-actions {
  display: flex;
  gap: 15px;
}

/* 弹窗内容样式 */
.legend {
  font-size: 14px;
  color: #606266;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .middle-row {
    flex-wrap: wrap;
  }

  .action-card,
  .todo-card,
  .alert-card {
    margin-bottom: 20px;
    min-height: auto;
  }
}
</style>
