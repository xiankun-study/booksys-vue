<template>
  <div class="books-page">
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="hover">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词" style="flex: 1;">
          <el-input 
            v-model="searchForm.keyword" 
            placeholder="请输入书名或作者"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="loading">
            <el-icon><Search /></el-icon> 检索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 图书列表 -->
    <el-card class="books-list-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>图书列表</span>
          <span class="total-count">共 {{ total }} 本图书</span>
        </div>
      </template>

      <el-table :data="books" stripe v-loading="loading" style="width: 100%">
        <el-table-column prop="title" label="书名" min-width="200">
          <template #default="{ row }">
            <div class="book-title">
              <span class="title-text">{{ row.title }}</span>
              <el-tag v-if="row.status === 0" size="small" type="info">不可借</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="author" label="作者" width="150" />
        <el-table-column prop="publisher" label="出版社" width="200" />
        <el-table-column prop="totalCopies" label="总数量" width="80" align="center" />
        <el-table-column prop="availableCopies" label="可借数量" width="80" align="center">
          <template #default="{ row }">
            <span :class="{ 'text-success': row.availableCopies > 0, 'text-danger': row.availableCopies === 0 }">
              {{ row.availableCopies }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="馆藏位置" width="150" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              link 
              @click="viewDetail(row)"
            >
              详情
            </el-button>
            <el-button 
              type="success" 
              link 
              @click="borrowBook(row)"
              :disabled="row.availableCopies === 0 || row.status === 0"
            >
              借阅
            </el-button>
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
    </el-card>

    <!-- 借阅对话框 -->
    <el-dialog v-model="borrowDialog.visible" title="确认借阅" width="400px">
      <div class="borrow-info">
        <p>确认借阅《{{ borrowDialog.book?.title }}》？</p>
        <p>默认借阅天数：15天</p>
        <p class="text-warning">注意：每人最多同时借阅5本图书</p>
      </div>
      <template #footer>
        <el-button @click="borrowDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmBorrow" :loading="borrowDialog.loading">
          确认借阅
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

export default {
  name: 'UserBooks',
  components: { Search },
  data() {
    return {
      searchForm: {
        keyword: ''
      },
      books: [],
      total: 0,
      page: 1,
      size: 10,
      loading: false,
      borrowDialog: {
        visible: false,
        loading: false,
        book: null
      }
    }
  },
  created() {
    this.loadBooks()
  },
  methods: {
    async loadBooks() {
      this.loading = true
      try {
        const params = {
          page: this.page - 1,
          size: this.size
        }
        
        let res
        if (this.searchForm.keyword) {
          res = await this.$http.get('/book/search', {
            params: { ...params, keyword: this.searchForm.keyword }
          })
        } else {
          res = await this.$http.get('/book/list', { params })
        }
        
        if (res.data.code === 200) {
          this.books = res.data.data || []
          this.total = res.data.total || 0
        }
      } catch (error) {
        console.error('加载图书失败:', error)
        ElMessage.error('加载图书失败')
      } finally {
        this.loading = false
      }
    },

    handleSearch() {
      this.page = 1
      this.loadBooks()
    },

    resetSearch() {
      this.searchForm.keyword = ''
      this.page = 1
      this.loadBooks()
    },

    handleSizeChange(val) {
      this.size = val
      this.loadBooks()
    },

    handleCurrentChange(val) {
      this.page = val
      this.loadBooks()
    },

    viewDetail(book) {
      this.$router.push(`/user/books/detail/${book.bookId}`)
    },

    borrowBook(book) {
      this.borrowDialog.book = book
      this.borrowDialog.visible = true
    },

    async confirmBorrow() {
      if (!this.borrowDialog.book) return
      
      const userStr = localStorage.getItem('user')
      const user = userStr ? JSON.parse(userStr) : null
      
      if (!user) {
        ElMessage.error('请先登录')
        return
      }
      
      this.borrowDialog.loading = true
      try {
        const res = await this.$http.post('/borrow/borrows', null, {
          params: {
            userId: user.userId,
            bookId: this.borrowDialog.book.bookId,
            borrowDays: 15
          }
        })
        
        if (res.data.code === 200) {
          ElMessage.success('借阅成功')
          this.borrowDialog.visible = false
          this.loadBooks() // 刷新列表
        } else {
          ElMessage.error(res.data.message || '借阅失败')
        }
      } catch (error) {
        ElMessage.error('借阅失败：' + (error.response?.data?.message || error.message))
      } finally {
        this.borrowDialog.loading = false
      }
    }
  }
}
</script>

<style scoped>
.books-page {
  padding: 0;
}

.search-card {
  margin-bottom: 20px;
  border: none;
  border-radius: 10px;
}

.search-form {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.books-list-card {
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

.total-count {
  font-size: 14px;
  color: #999;
  font-weight: normal;
}

.book-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-text {
  font-weight: 500;
  color: #333;
}

.text-success {
  color: #67c23a;
  font-weight: 500;
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

.borrow-info {
  text-align: center;
  padding: 20px;
}

.borrow-info p {
  margin-bottom: 10px;
  font-size: 14px;
}
</style>