<template>
  <div class="admin-borrows-page">
    <!-- 筛选工具栏 -->
    <el-card class="toolbar-card" shadow="hover">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-select v-model="filter.status" placeholder="借阅状态" clearable @change="loadBorrows">
            <el-option label="全部" :value="null" />
            <el-option label="借阅中" :value="1" />
            <el-option label="已归还" :value="2" />
            <el-option label="逾期" :value="3" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-input 
            v-model="filter.keyword" 
            placeholder="请输入用户名/书名" 
            clearable 
            @keyup.enter="loadBorrows"
          >
            <template #append>
              <el-button @click="loadBorrows">
                <el-icon><Search /></el-icon>
              </el-button>
            </template>
          </el-input>
        </el-col>
        <el-col :span="12" style="text-align: right;">
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon> 新增借阅记录
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 借阅列表 -->
    <el-card class="list-card" shadow="hover">
      <el-table :data="borrows" stripe v-loading="loading">
        <el-table-column prop="borrowId" label="ID" width="80" />
        <!-- 后端现在直接返回 username 和 bookTitle -->
        <el-table-column prop="username" label="借阅人" width="150" />
        <el-table-column prop="bookTitle" label="书名" min-width="200" />
        <el-table-column prop="borrowDate" label="借阅日期" width="120">
          <template #default="{ row }">{{ formatDate(row.borrowDate) }}</template>
        </el-table-column>
        <el-table-column prop="dueDate" label="应还日期" width="120">
          <template #default="{ row }">{{ formatDate(row.dueDate) }}</template>
        </el-table-column>
        <el-table-column prop="returnDate" label="归还日期" width="120">
          <template #default="{ row }">{{ formatDate(row.returnDate) || '-' }}</template>
        </el-table-column>
        <el-table-column prop="renewCount" label="续借次数" width="80" align="center">
          <template #default="{ row }">{{ row.renewCount || 0 }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="row.status === 1 || row.status === 3"
              type="success" 
              link 
              @click="returnBook(row)"
            >
              归还
            </el-button>
            <el-button type="primary" link @click="showRenewDialog(row)">续借</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
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
          @size-change="onSizeChange"
          @current-change="onPageChange"
        />
      </div>
    </el-card>

    <!-- 新增借阅记录对话框 -->
    <el-dialog v-model="addDialogVisible" title="新增借阅记录" width="500px" destroy-on-close>
      <el-form :model="addForm" :rules="addRules" ref="addFormRef" label-width="100px">
        <el-form-item label="借阅人" prop="userId">
          <el-select 
            v-model="addForm.userId" 
            placeholder="请选择借阅人"
            filterable
            remote
            :remote-method="searchUsers"
            :loading="userLoading"
            style="width: 100%"
          >
            <el-option
              v-for="user in userOptions"
              :key="user.userId"
              :label="user.username"
              :value="user.userId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="图书" prop="bookId">
          <el-select 
            v-model="addForm.bookId" 
            placeholder="请选择图书"
            filterable
            remote
            :remote-method="searchBooks"
            :loading="bookLoading"
            style="width: 100%"
          >
            <el-option
              v-for="book in bookOptions"
              :key="book.bookId"
              :label="`${book.title} (${book.author})`"
              :value="book.bookId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="借阅天数" prop="borrowDays">
          <el-input-number v-model="addForm.borrowDays" :min="1" :max="365" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAddForm" :loading="addLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 续借对话框 -->
    <el-dialog v-model="renewDialogVisible" title="续借图书" width="400px" destroy-on-close>
      <el-form :model="renewForm" label-width="100px">
        <el-form-item label="续借天数">
          <el-input-number v-model="renewForm.renewDays" :min="1" :max="365" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="renewDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitRenewForm" :loading="renewLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'

export default {
  name: 'AdminBorrows',
  components: { Search, Plus },
  data() {
    return {
      borrows: [],
      total: 0,
      page: 1,
      size: 10,
      loading: false,
      addDialogVisible: false,
      renewDialogVisible: false,
      addLoading: false,
      renewLoading: false,
      userLoading: false,
      bookLoading: false,
      filter: { status: null, keyword: '' },
      addForm: { userId: null, bookId: null, borrowDays: 30 },
      renewForm: { borrowId: null, renewDays: 15 },
      userOptions: [],
      bookOptions: [],
      addRules: {
        userId: [{ required: true, message: '请选择借阅人', trigger: 'change' }],
        bookId: [{ required: true, message: '请选择图书', trigger: 'change' }]
      },
      searchTimer: null
    }
  },
  created() {
    this.loadBorrows()
  },
  methods: {
    async loadBorrows() {
      this.loading = true
      try {
        // 参数与后端 Controller 对应
        const params = { 
          page: this.page - 1, 
          size: this.size, 
          status: this.filter.status, 
          keyword: this.filter.keyword 
        }
        
        // 清理空值
        Object.keys(params).forEach(key => {
          if (params[key] === null || params[key] === '') {
            delete params[key]
          }
        })

        const res = await this.$http.get('/borrow/list', { params })
        if (res.data.code === 200) {
          this.borrows = res.data.data || []
          this.total = res.data.total || 0
        } else {
          this.borrows = []
          this.total = 0
          ElMessage.error(res.data.message || '加载数据失败')
        }
      } catch (error) {
        console.error('加载借阅记录失败:', error)
        ElMessage.error('加载借阅记录失败')
      } finally {
        this.loading = false
      }
    },
    formatDate(dateStr) {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    },
    getStatusType(status) {
      return { 1: 'warning', 2: 'success', 3: 'danger' }[status] || 'info'
    },
    getStatusText(status) {
      return { 1: '借阅中', 2: '已归还', 3: '逾期' }[status] || '未知'
    },
    showAddDialog() {
      this.addDialogVisible = true
      this.resetAddForm()
    },
    resetAddForm() {
      this.addForm = { userId: null, bookId: null, borrowDays: 30 }
      this.userOptions = []
      this.bookOptions = []
      if (this.$refs.addFormRef) {
        this.$refs.addFormRef.clearValidate()
      }
    },
    async searchUsers(query) {
      if (!query) { this.userOptions = []; return }
      this.userLoading = true
      try {
        const res = await this.$http.get('/user/list', { params: { keyword: query, page: 0, size: 10 } })
        if (res.data.code === 200) this.userOptions = res.data.data || []
      } catch (error) { console.error(error) } finally { this.userLoading = false }
    },
    async searchBooks(query) {
      if (!query) { this.bookOptions = []; return }
      this.bookLoading = true
      try {
        const res = await this.$http.get('/book/search', { params: { keyword: query, page: 0, size: 10 } })
        if (res.data.code === 200) this.bookOptions = res.data.data || []
      } catch (error) { console.error(error) } finally { this.bookLoading = false }
    },
    async submitAddForm() {
      // 表单验证
      if (!this.addForm.userId || !this.addForm.bookId) {
        ElMessage.error('请选择借阅人和图书')
        return
      }
      
      this.addLoading = true
      try {
        // 提交包含 borrowDays 的数据
        const res = await this.$http.post('/borrow/add', {
          userId: this.addForm.userId,
          bookId: this.addForm.bookId,
          borrowDays: this.addForm.borrowDays
        })
        
        if (res.data.code === 200) {
          ElMessage.success('借阅记录添加成功')
          this.addDialogVisible = false
          this.loadBorrows()
        } else {
          ElMessage.error(res.data.message || '添加借阅记录失败')
        }
      } catch (error) {
        console.error('添加借阅记录失败:', error)
        ElMessage.error('添加借阅记录失败')
      } finally {
        this.addLoading = false
      }
    },
    showRenewDialog(row) {
      this.renewForm.borrowId = row.borrowId
      this.renewForm.renewDays = 15
      this.renewDialogVisible = true
    },
    async submitRenewForm() {
      this.renewLoading = true
      try {
        const res = await this.$http.post('/borrow/renew', null, { 
          params: { borrowId: this.renewForm.borrowId, renewDays: this.renewForm.renewDays } 
        })
        if (res.data.code === 200) {
          ElMessage.success('续借成功')
          this.renewDialogVisible = false
          this.loadBorrows()
        } else {
          ElMessage.error(res.data.message || '续借失败')
        }
      } catch (error) {
        ElMessage.error('续借失败')
      } finally {
        this.renewLoading = false
      }
    },
    async returnBook(row) {
      try {
        await ElMessageBox.confirm(`确定要归还"${row.bookTitle}"吗？`, '提示', { type: 'info' })
        const res = await this.$http.post('/borrow/return', null, { params: { borrowId: row.borrowId } })
        if (res.data.code === 200) {
          ElMessage.success('归还成功')
          this.loadBorrows()
        } else {
          ElMessage.error(res.data.message || '归还失败')
        }
      } catch (error) {
        if (error !== 'cancel') ElMessage.error('归还失败')
      }
    },
    async handleDelete(row) {
      try {
        await ElMessageBox.confirm(`确定要删除这条借阅记录吗？`, '提示', { type: 'warning' })
        const res = await this.$http.delete(`/borrow/delete/${row.borrowId}`)
        if (res.data.code === 200) {
          ElMessage.success('删除成功')
          this.loadBorrows()
        } else {
          ElMessage.error(res.data.message || '删除失败')
        }
      } catch (error) {
        if (error !== 'cancel') ElMessage.error('删除失败')
      }
    },
    onSizeChange(newSize) {
      this.size = newSize
      this.page = 1
      this.loadBorrows()
    },
    onPageChange(newPage) {
      this.page = newPage
      this.loadBorrows()
    }
  },
  watch: {
    'filter.status'() {
      this.page = 1
      this.loadBorrows()
    },
    'filter.keyword'(newVal) {
      clearTimeout(this.searchTimer)
      this.searchTimer = setTimeout(() => {
        this.page = 1
        this.loadBorrows()
      }, 500)
    }
  }
}
</script>

<style scoped>
.admin-borrows-page {
  padding: 0;
}

.toolbar-card {
  margin-bottom: 20px;
  border: none;
  border-radius: 10px;
}

.list-card {
  border: none;
  border-radius: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>


