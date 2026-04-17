<template>
  <div class="borrows-page">
    <!-- 状态标签 -->
    <el-card class="tabs-card" shadow="hover">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="借阅中" name="borrowing" />
        <el-tab-pane label="已归还" name="returned" />
        <el-tab-pane label="逾期" name="overdue" />
      </el-tabs>
    </el-card>

    <!-- 借阅列表 -->
    <el-card class="borrows-list-card" shadow="hover">
      <el-table :data="borrows" stripe v-loading="loading">
        <el-table-column prop="bookTitle" label="书名" min-width="200">
          <template #default="{ row }">
            <div class="book-info">
              <span class="book-title">{{ row.bookTitle || '未知图书' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="borrowDate" label="借阅日期" width="120">
          <template #default="{ row }">{{ formatDate(row.borrowDate) }}</template>
        </el-table-column>
        <el-table-column prop="dueDate" label="应还日期" width="120">
          <template #default="{ row }">
            <span :class="{ 'text-danger': isOverdue(row) }">
              {{ formatDate(row.dueDate) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="returnDate" label="归还日期" width="120">
          <template #default="{ row }">{{ formatDate(row.returnDate) }}</template>
        </el-table-column>
        <el-table-column prop="renewCount" label="续借次数" width="80" align="center">
          <template #default="{ row }">{{ row.renewCount || 0 }}/2</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row)" size="small">
              {{ getStatusText(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              link 
              @click="renewBook(row)"
              :disabled="!canRenew(row)"
            >
              续借
            </el-button>
            <el-button 
              v-if="row.status === 1 || row.status === 3"
              type="success" 
              link 
              @click="returnBook(row)"
            >
              归还
            </el-button>
            <el-button type="info" link @click="viewBook(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="size"
          :page-sizes="[10, 20, 30, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>

      <el-empty v-if="!loading && borrows.length === 0" description="暂无借阅记录" />
    </el-card>

    <!-- 续借对话框 -->
    <el-dialog v-model="renewDialog.visible" title="续借确认" width="400px">
      <div class="renew-info">
        <p>确认续借《{{ renewDialog.book?.bookTitle }}》？</p>
        <p>续借天数：15天</p>
        <p class="text-warning">注意：每本书最多可续借2次</p>
      </div>
      <template #footer>
        <el-button @click="renewDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmRenew" :loading="renewDialog.loading">
          确认续借
        </el-button>
      </template>
    </el-dialog>

    <!-- 归还对话框 -->
    <el-dialog v-model="returnDialog.visible" title="确认归还" width="400px">
      <div class="return-info">
        <p>确认归还《{{ returnDialog.book?.bookTitle }}》？</p>
      </div>
      <template #footer>
        <el-button @click="returnDialog.visible = false">取消</el-button>
        <el-button type="success" @click="confirmReturn" :loading="returnDialog.loading">
          确认归还
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'

export default {
  name: 'UserBorrows',
  data() {
    return {
      activeTab: 'all',
      borrows: [],
      total: 0,
      page: 1,
      size: 10,
      loading: false,
      userInfo: null,
      renewDialog: {
        visible: false,
        loading: false,
        book: null
      },
      returnDialog: {
        visible: false,
        loading: false,
        book: null
      }
    }
  },
  created() {
    this.getUserInfo()
    this.loadBorrows()
  },
  methods: {
    getUserInfo() {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        this.userInfo = JSON.parse(userStr)
      } else {
        this.$router.push('/login')
      }
    },

    async loadBorrows() {
      if (!this.userInfo) return

      this.loading = true
      try {
        let url = '/borrow/userRecords'
        const params = { userId: this.userInfo.userId }

        const res = await this.$http.get(url, { params })
        if (res.data.code === 200) {
          let allBorrows = res.data.data || []
          
          // 根据标签过滤
          switch (this.activeTab) {
            case 'borrowing':
              allBorrows = allBorrows.filter(b => b.status === 1)
              break
            case 'returned':
              allBorrows = allBorrows.filter(b => b.status === 2)
              break
            case 'overdue':
              allBorrows = allBorrows.filter(b => b.status === 3 || this.isOverdue(b))
              break
          }

          this.total = allBorrows.length
          
          // 分页
          const start = (this.page - 1) * this.size
          const end = start + this.size
          this.borrows = allBorrows.slice(start, end)

          // 获取图书信息
          await this.enrichBookInfo()
        }
      } catch (error) {
        console.error('加载借阅记录失败:', error)
        ElMessage.error('加载借阅记录失败')
      } finally {
        this.loading = false
      }
    },

    async enrichBookInfo() {
      for (const borrow of this.borrows) {
        if (!borrow.bookTitle) {
          try {
            const res = await this.$http.get(`/book/detail/${borrow.bookId}`)
            if (res.data.code === 200) {
              borrow.bookTitle = res.data.data.title
              borrow.bookAuthor = res.data.data.author
            }
          } catch (error) {
            borrow.bookTitle = `图书ID: ${borrow.bookId}`
          }
        }
      }
    },

    handleTabClick() {
      this.page = 1
      this.loadBorrows()
    },

    handleSizeChange(val) {
      this.size = val
      this.loadBorrows()
    },

    handleCurrentChange(val) {
      this.page = val
      this.loadBorrows()
    },

    formatDate(dateStr) {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    },

    isOverdue(borrow) {
      return borrow.status === 1 && new Date(borrow.dueDate) < new Date()
    },

    getStatusType(borrow) {
      if (borrow.status === 2) return 'success'
      if (borrow.status === 3 || this.isOverdue(borrow)) return 'danger'
      if (borrow.status === 1) return 'warning'
      return 'info'
    },

    getStatusText(borrow) {
      if (borrow.status === 2) return '已归还'
      if (borrow.status === 3 || this.isOverdue(borrow)) return '逾期'
      if (borrow.status === 1) return '借阅中'
      return '未知'
    },

    canRenew(borrow) {
      return borrow.status === 1 && 
             borrow.renewCount < 2 && 
             !this.isOverdue(borrow)
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
          this.loadBorrows()
        } else {
          ElMessage.error(res.data.message || '续借失败')
        }
      } catch (error) {
        ElMessage.error('续借失败：' + (error.response?.data?.message || error.message))
      } finally {
        this.renewDialog.loading = false
      }
    },

    returnBook(book) {
      this.returnDialog.book = book
      this.returnDialog.visible = true
    },

    async confirmReturn() {
      if (!this.returnDialog.book) return

      this.returnDialog.loading = true
      try {
        const res = await this.$http.post('/borrow/return', null, {
          params: {
            borrowId: this.returnDialog.book.borrowId
          }
        })

        if (res.data.code === 200) {
          ElMessage.success('归还成功')
          this.returnDialog.visible = false
          this.loadBorrows()
        } else {
          ElMessage.error(res.data.message || '归还失败')
        }
      } catch (error) {
        ElMessage.error('归还失败：' + (error.response?.data?.message || error.message))
      } finally {
        this.returnDialog.loading = false
      }
    },

    viewBook(borrow) {
      this.$router.push(`/user/books/detail/${borrow.bookId}`)
    }
  }
}
</script>

<style scoped>
.borrows-page {
  padding: 0;
}

.tabs-card {
  margin-bottom: 20px;
  border: none;
  border-radius: 10px;
}

.borrows-list-card {
  border: none;
  border-radius: 10px;
}

.book-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.book-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.text-danger {
  color: #f56c6c;
  font-weight: 500;
}

.text-warning {
  color: #e6a23c;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.renew-info,
.return-info {
  text-align: center;
  padding: 20px;
}

.renew-info p,
.return-info p {
  margin-bottom: 10px;
  font-size: 14px;
}
</style>