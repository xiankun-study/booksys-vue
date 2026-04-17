<template>
  <div class="overdue-page">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="8">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon overdue-icon">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.overdue }}</div>
              <div class="stat-label">当前逾期数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon expiring-icon">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.expiring }}</div>
              <div class="stat-label">即将到期 (7 天内)</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon normal-icon">
              <el-icon><Check /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.normal }}</div>
              <div class="stat-label">正常借阅</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 标签页 -->
    <el-card class="list-card" shadow="hover">
      <!-- 批量操作工具栏 -->
      <div class="batch-toolbar" v-if="filteredData.length > 0">
        <el-button 
          type="primary" 
          size="small" 
          @click="batchNotify"
          :disabled="selectedRows.length === 0"
        >
          <el-icon><Bell /></el-icon>
          批量提醒 ({{ selectedRows.length }})
        </el-button>
        <el-button 
          type="success" 
          size="small" 
          @click="batchReturn" 
          v-if="activeTab === 'overdue'"
          :disabled="selectedRows.length === 0"
        >
          <el-icon><Download /></el-icon>
          批量归还
        </el-button>
        <el-button 
          type="info" 
          size="small" 
          @click="clearSelection"
        >
          <el-icon><Refresh /></el-icon>
          取消选择
        </el-button>
      </div>

      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        <el-tab-pane label="逾期未还" name="overdue">
          <el-table 
            :data="currentPageData" 
            stripe 
            v-loading="loading"
            ref="overdueTable"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="username" label="借阅人" width="150" />
            <el-table-column prop="bookTitle" label="书名" min-width="200" />
            <el-table-column prop="borrowDate" label="借阅日期" width="120">
              <template #default="{ row }">{{ formatDate(row.borrowDate) }}</template>
            </el-table-column>
            <el-table-column prop="dueDate" label="应还日期" width="120">
              <template #default="{ row }">{{ formatDate(row.dueDate) }}</template>
            </el-table-column>
            <el-table-column label="逾期天数" width="100">
              <template #default="{ row }">
                <el-tag type="danger" size="small">
                  {{ getOverdueDays(row.dueDate) }}天
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="success" link @click="returnBook(row)">归还</el-button>
                <el-button type="primary" link @click="notifyUser(row)">提醒</el-button>
                <el-button type="info" link @click="viewNotificationHistory(row)">记录</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="page"
              v-model:page-size="size"
              :page-sizes="[10, 20, 30, 50]"
              :total="filteredTotal"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="onSizeChange"
              @current-change="onPageChange"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="即将到期" name="expiring">
          <el-table 
            :data="currentPageData" 
            stripe 
            v-loading="loading"
            ref="expiringTable"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="username" label="借阅人" width="150" />
            <el-table-column prop="bookTitle" label="书名" min-width="200" />
            <el-table-column prop="borrowDate" label="借阅日期" width="120">
              <template #default="{ row }">{{ formatDate(row.borrowDate) }}</template>
            </el-table-column>
            <el-table-column prop="dueDate" label="应还日期" width="120">
              <template #default="{ row }">{{ formatDate(row.dueDate) }}</template>
            </el-table-column>
            <el-table-column label="剩余天数" width="100">
              <template #default="{ row }">
                <el-tag :type="getRemainingDaysType(row.dueDate)" size="small">
                  {{ getRemainingDays(row.dueDate) }}天
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="success" link @click="renewBook(row)">续借</el-button>
                <el-button type="primary" link @click="notifyUser(row)">提醒</el-button>
                <el-button type="info" link @click="viewNotificationHistory(row)">记录</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="page"
              v-model:page-size="size"
              :page-sizes="[10, 20, 30, 50]"
              :total="filteredTotal"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="onSizeChange"
              @current-change="onPageChange"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 通知历史对话框 -->
    <el-dialog 
      v-model="historyDialogVisible" 
      title="通知记录" 
      width="600px"
      destroy-on-close
    >
      <div class="history-info" v-if="currentRow">
        <p><strong>借阅人：</strong>{{ currentRow.username }}</p>
        <p><strong>图书：</strong>{{ currentRow.bookTitle }}</p>
        <p><strong>借阅 ID：</strong>{{ currentRow.borrowId }}</p>
      </div>
      
      <el-table :data="notificationHistory" v-loading="historyLoading" style="margin-top: 20px">
        <el-table-column prop="title" label="通知类型" width="150" />
        <el-table-column prop="content" label="通知内容" min-width="250" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'warning' : 'success'" size="small">
              {{ row.status === 0 ? '未读' : '已读' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="发送时间" width="160">
          <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
        </el-table-column>
      </el-table>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="historyDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ElMessage, ElMessageBox } from 'element-plus'
import { Warning, Clock, Check, Bell, Download, Refresh } from '@element-plus/icons-vue'

export default {
  name: 'AdminOverdue',
  components: { Warning, Clock, Check, Bell, Download, Refresh },
  data() {
    return {
      activeTab: 'overdue',
      allBorrows: [],
      total: 0,
      page: 1,
      size: 10,
      loading: false,
      stats: {
        overdue: 0,
        expiring: 0,
        normal: 0
      },
      // 【新增】选中行
      selectedRows: [],
      // 【新增】通知历史对话框
      historyDialogVisible: false,
      historyLoading: false,
      currentRow: null,
      notificationHistory: []
    }
  },
  computed: {
    filteredData() {
      const now = new Date()
      if (this.activeTab === 'overdue') {
        return this.allBorrows.filter(b => {
          return (b.status === 1 || b.status === 3) && new Date(b.dueDate) < now
        })
      } else if (this.activeTab === 'expiring') {
        return this.allBorrows.filter(b => {
          if (b.status !== 1) return false
          const dueDate = new Date(b.dueDate)
          const diffTime = dueDate - now
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          return diffDays > 0 && diffDays <= 7
        })
      }
      return []
    },

    currentPageData() {
      const start = (this.page - 1) * this.size
      const end = start + this.size
      return this.filteredData.slice(start, end)
    },

    filteredTotal() {
      return this.filteredData.length
    }
  },
  created() {
    const tab = this.$route.query.tab
    if (tab === 'expiring') {
      this.activeTab = 'expiring'
    }
    this.loadData()
    this.loadStats()
  },
  methods: {
    // 【新增】处理选择变化
    handleSelectionChange(val) {
      this.selectedRows = val
    },

    // 【新增】清除选择
    clearSelection() {
      const tableRef = this.activeTab === 'overdue' ? this.$refs.overdueTable : this.$refs.expiringTable
      if (tableRef) {
        tableRef.clearSelection()
      }
    },

    async loadData() {
      this.loading = true
      try {
        const params = { page: 0, size: 1000 }
        const res = await this.$http.get('/borrow/list', { params })

        if (res.data.code === 200) {
          this.allBorrows = res.data.data || []
          await this.enrichBorrowInfo()
        } else {
          this.allBorrows = []
          ElMessage.error(res.data.message || '加载数据失败')
        }
      } catch (error) {
        console.error('加载数据失败:', error)
        this.allBorrows = []
        ElMessage.error('加载数据失败')
      } finally {
        this.loading = false
      }
    },

    async loadStats() {
      try {
        await this.loadData()

        const now = new Date()
        this.stats.overdue = this.allBorrows.filter(b => {
          return (b.status === 1 || b.status === 3) && new Date(b.dueDate) < now
        }).length

        this.stats.expiring = this.allBorrows.filter(b => {
          if (b.status !== 1) return false
          const dueDate = new Date(b.dueDate)
          const diffTime = dueDate - now
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          return diffDays > 0 && diffDays <= 7
        }).length

        this.stats.normal = this.allBorrows.filter(b => {
          if (b.status !== 1) return false
          const dueDate = new Date(b.dueDate)
          return dueDate >= now
        }).length
      } catch (error) {
        console.error('加载统计失败:', error)
        ElMessage.error('加载统计失败')
      }
    },

    async enrichBorrowInfo() {
      const requests = []

      for (const borrow of this.allBorrows) {
        if (!borrow.username) {
          requests.push(
            this.$http.get(`/user/detail/${borrow.userId}`)
              .then(userRes => {
                if (userRes.data.code === 200) {
                  borrow.username = userRes.data.data.username
                } else {
                  borrow.username = `用户 ID: ${borrow.userId}`
                }
              })
              .catch(() => {
                borrow.username = `用户 ID: ${borrow.userId}`
              })
          )
        }

        if (!borrow.bookTitle) {
          requests.push(
            this.$http.get(`/book/detail/${borrow.bookId}`)
              .then(bookRes => {
                if (bookRes.data.code === 200) {
                  borrow.bookTitle = bookRes.data.data.title
                } else {
                  borrow.bookTitle = `图书 ID: ${borrow.bookId}`
                }
              })
              .catch(() => {
                borrow.bookTitle = `图书 ID: ${borrow.bookId}`
              })
          )
        }
      }

      await Promise.all(requests)
    },

    formatDate(dateStr) {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    },

    getOverdueDays(dueDate) {
      const now = new Date()
      const due = new Date(dueDate)
      return Math.max(0, Math.ceil((now - due) / (1000 * 60 * 60 * 24)))
    },

    getRemainingDays(dueDate) {
      const now = new Date()
      const due = new Date(dueDate)
      return Math.max(0, Math.ceil((due - now) / (1000 * 60 * 60 * 24)))
    },

    getRemainingDaysType(dueDate) {
      const days = this.getRemainingDays(dueDate)
      if (days <= 3) return 'danger'
      if (days <= 5) return 'warning'
      return 'success'
    },

    handleTabClick() {
      this.page = 1
      this.clearSelection()
    },

    async returnBook(row) {
      try {
        await ElMessageBox.confirm(`确定要归还"${row.bookTitle}"吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'info'
        })

        const res = await this.$http.post('/borrow/return', null, {
          params: { borrowId: row.borrowId }
        })

        if (res.data.code === 200) {
          ElMessage.success('归还成功')
          await this.loadData()
          await this.loadStats()
        } else {
          ElMessage.error(res.data.message || '归还失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('归还失败：' + (error.response?.data?.message || error.message))
        }
      }
    },

    // 【修复】批量归还功能
    async batchReturn() {
      if (this.selectedRows.length === 0) {
        ElMessage.warning('请先选择要归还的记录')
        return
      }

      try {
        await ElMessageBox.confirm(
          `确定要归还选中的 ${this.selectedRows.length} 本图书吗？`,
          '批量归还',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        let successCount = 0
        let failCount = 0
        const failMessages = []

        for (const row of this.selectedRows) {
          try {
            const res = await this.$http.post('/borrow/return', null, {
              params: { borrowId: row.borrowId }
            })

            if (res.data.code === 200) {
              successCount++
            } else {
              failCount++
              failMessages.push(`${row.bookTitle}: ${res.data.message}`)
            }
          } catch (error) {
            failCount++
            failMessages.push(`${row.bookTitle}: ${error.response?.data?.message || '归还失败'}`)
          }
        }

        ElMessage.success(`归还完成：成功 ${successCount} 本，失败 ${failCount} 本`)
        
        if (failMessages.length > 0) {
          console.error('失败详情:', failMessages)
        }

        this.clearSelection()
        await this.loadData()
        await this.loadStats()

      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('批量归还失败')
        }
      }
    },

    async renewBook(row) {
      try {
        await ElMessageBox.prompt('请输入续借天数', '续借图书', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputValue: '15',
          inputPattern: /^\d+$/,
          inputErrorMessage: '请输入有效的天数'
        }).then(async ({ value }) => {
          const res = await this.$http.post('/borrow/renew', null, {
            params: { borrowId: row.borrowId, renewDays: parseInt(value) }
          })

          if (res.data.code === 200) {
            ElMessage.success('续借成功')
            await this.loadData()
            await this.loadStats()
          } else {
            ElMessage.error(res.data.message || '续借失败')
          }
        })
      } catch (error) {
        if (error !== 'cancel' && error.type !== 'cancel') {
          ElMessage.error('续借失败：' + (error.response?.data?.message || error.message))
        }
      }
    },

    async notifyUser(row) {
      try {
        const isOverdue = this.activeTab === 'overdue'
        const overdueDays = isOverdue ? this.getOverdueDays(row.dueDate) : 0
        const remainingDays = !isOverdue ? this.getRemainingDays(row.dueDate) : 0

        const confirmText = isOverdue
          ? `确定要发送逾期提醒给用户 "${row.username}" 吗？`
          : `确定要发送到期提醒给用户 "${row.username}" 吗？`

        await ElMessageBox.confirm(confirmText, '发送提醒', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        const apiUrl = isOverdue ? '/notification/sendOverdue' : '/notification/sendExpiring'
        const params = isOverdue
          ? {
              userId: row.userId,
              borrowId: row.borrowId,
              bookTitle: row.bookTitle,
              overdueDays: overdueDays
            }
          : {
              userId: row.userId,
              borrowId: row.borrowId,
              bookTitle: row.bookTitle,
              remainingDays: remainingDays
            }

        const res = await this.$http.post(apiUrl, null, { params })

        if (res.data.code === 200) {
          ElMessage.success('提醒发送成功')
        } else {
          ElMessage.error(res.data.message || '提醒发送失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('发送失败：' + (error.response?.data?.message || error.message))
        }
      }
    },

    // 【修复】批量提醒功能
    async batchNotify() {
      if (this.selectedRows.length === 0) {
        ElMessage.warning('请先选择要提醒的记录')
        return
      }

      try {
        await ElMessageBox.confirm(
          `确定要向 ${this.selectedRows.length} 位用户发送提醒吗？`,
          '批量提醒',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        let successCount = 0
        let failCount = 0

        for (const row of this.selectedRows) {
          try {
            const isOverdue = this.activeTab === 'overdue'
            const apiUrl = isOverdue ? '/notification/sendOverdue' : '/notification/sendExpiring'
            const params = isOverdue
              ? {
                  userId: row.userId,
                  borrowId: row.borrowId,
                  bookTitle: row.bookTitle,
                  overdueDays: this.getOverdueDays(row.dueDate)
                }
              : {
                  userId: row.userId,
                  borrowId: row.borrowId,
                  bookTitle: row.bookTitle,
                  remainingDays: this.getRemainingDays(row.dueDate)
                }

            const res = await this.$http.post(apiUrl, null, { params })

            if (res.data.code === 200) {
              successCount++
            } else {
              failCount++
            }
          } catch (error) {
            failCount++
          }
        }

        ElMessage.success(`发送完成：成功 ${successCount} 条，失败 ${failCount} 条`)

        this.clearSelection()
        // 不需要重新加载数据，通知是异步的

      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('批量发送失败')
        }
      }
    },

    // 【修复】查看通知记录功能
    async viewNotificationHistory(row) {
      this.currentRow = row
      this.historyDialogVisible = true
      this.historyLoading = true
      this.notificationHistory = []

      try {
        // 调用后端接口获取该借阅记录的通知历史
        const res = await this.$http.get('/notification/history', {
          params: { borrowId: row.borrowId }
        })

        if (res.data.code === 200) {
          this.notificationHistory = res.data.data || []
        } else {
          ElMessage.error(res.data.message || '加载通知记录失败')
        }
      } catch (error) {
        console.error('加载通知记录失败:', error)
        ElMessage.error('加载通知记录失败')
      } finally {
        this.historyLoading = false
      }
    },

    onSizeChange(newSize) {
      this.size = newSize
      this.page = 1
      this.clearSelection()
    },

    onPageChange(newPage) {
      this.page = newPage
      this.clearSelection()
    }
  }
}
</script>

<style scoped>
.overdue-page {
  padding: 0;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border: none;
  border-radius: 10px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
}

.overdue-icon {
  background: linear-gradient(135deg, #f56c6c, #e6a23c);
}

.expiring-icon {
  background: linear-gradient(135deg, #e6a23c, #f5b041);
}

.normal-icon {
  background: linear-gradient(135deg, #67c23a, #95d475);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  line-height: 1.2;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #999;
}

.list-card {
  border: none;
  border-radius: 10px;
}

.batch-toolbar {
  margin-bottom: 15px;
  padding: 10px 0;
  display: flex;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.history-info {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 5px;
}

.history-info p {
  margin: 5px 0;
  color: #606266;
}
</style>
