<template>
  <div class="book-detail-page">
    <el-card class="detail-card" shadow="hover" v-loading="loading">
      <template #header>
        <div class="card-header">
          <el-button link @click="$router.back()">
            <el-icon><ArrowLeft /></el-icon> 返回
          </el-button>
          <span>图书详情</span>
          <span></span>
        </div>
      </template>

      <div v-if="book" class="book-info">
        <h1 class="book-title">{{ book.title }}</h1>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">作者：</span>
            <span class="value">{{ book.author }}</span>
          </div>
          <div class="info-item">
            <span class="label">出版社：</span>
            <span class="value">{{ book.publisher || '未知' }}</span>
          </div>
          <div class="info-item">
            <span class="label">出版日期：</span>
            <span class="value">{{ formatDate(book.publishDate) }}</span>
          </div>
          <div class="info-item">
            <span class="label">馆藏位置：</span>
            <span class="value">{{ book.location || '未知' }}</span>
          </div>
          <div class="info-item">
            <span class="label">总副本数：</span>
            <span class="value">{{ book.totalCopies || 0 }}</span>
          </div>
          <div class="info-item">
            <span class="label">可借副本：</span>
            <span class="value" :class="{ 'text-success': book.availableCopies > 0, 'text-danger': book.availableCopies === 0 }">
              {{ book.availableCopies || 0 }}
            </span>
          </div>
          <div class="info-item">
            <span class="label">状态：</span>
            <span class="value">
              <el-tag :type="book.status === 1 ? 'success' : 'info'">
                {{ book.status === 1 ? '可借' : '不可借' }}
              </el-tag>
            </span>
          </div>
        </div>

        <div class="action-buttons">
          <el-button 
            type="primary" 
            size="large" 
            @click="borrowBook"
            :disabled="book.availableCopies === 0 || book.status === 0"
            :loading="borrowLoading"
          >
            借阅此书
          </el-button>
          <el-button size="large" @click="$router.back()">返回</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'

export default {
  name: 'BookDetail',
  components: { ArrowLeft },
  data() {
    return {
      book: null,
      loading: false,
      borrowLoading: false
    }
  },
  created() {
    this.loadBookDetail()
  },
  methods: {
    async loadBookDetail() {
      const bookId = this.$route.params.id
      if (!bookId) {
        ElMessage.error('参数错误')
        this.$router.back()
        return
      }

      this.loading = true
      try {
        const res = await this.$http.get(`/book/detail/${bookId}`)
        if (res.data.code === 200) {
          this.book = res.data.data
        } else {
          ElMessage.error(res.data.message || '获取图书详情失败')
          this.$router.back()
        }
      } catch (error) {
        console.error('获取图书详情失败:', error)
        ElMessage.error('获取图书详情失败')
        this.$router.back()
      } finally {
        this.loading = false
      }
    },

    formatDate(dateStr) {
      if (!dateStr) return '未知'
      const date = new Date(dateStr)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    },

    async borrowBook() {
      if (!this.book) return

      const userStr = localStorage.getItem('user')
      const user = userStr ? JSON.parse(userStr) : null

      if (!user) {
        ElMessage.error('请先登录')
        this.$router.push('/login')
        return
      }

      this.borrowLoading = true
      try {
        const res = await this.$http.post('/borrow/borrows', null, {
          params: {
            userId: user.userId,
            bookId: this.book.bookId,
            borrowDays: 15
          }
        })

        if (res.data.code === 200) {
          ElMessage.success('借阅成功')
          this.loadBookDetail()
        } else {
          ElMessage.error(res.data.message || '借阅失败')
        }
      } catch (error) {
        ElMessage.error('借阅失败：' + (error.response?.data?.message || error.message))
      } finally {
        this.borrowLoading = false
      }
    }
  }
}
</script>

<style scoped>
.book-detail-page {
  padding: 0;
}

.detail-card {
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

.book-info {
  padding: 20px 0;
}

.book-title {
  font-size: 28px;
  font-weight: 500;
  color: #333;
  margin-bottom: 30px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.info-item {
  font-size: 15px;
}

.info-item .label {
  color: #999;
  margin-right: 10px;
}

.info-item .value {
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

.action-buttons {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}
</style>