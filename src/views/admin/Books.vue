<template>
  <div class="admin-books-page">
    <!-- 工具栏 -->
    <el-card class="toolbar-card" shadow="hover">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-input 
            v-model="searchForm.keyword" 
            placeholder="请输入书名/作者"
            clearable
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #append>
              <el-button @click="handleSearch">
                <el-icon><Search /></el-icon>
              </el-button>
            </template>
          </el-input>
        </el-col>
        <el-col :span="12" style="text-align: right;">
          <el-button type="primary" @click="openAddDialog">
            <el-icon><Plus /></el-icon> 新增图书
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 图书列表 -->
    <el-card class="list-card" shadow="hover">
      <el-table :data="books" stripe v-loading="loading">
        <el-table-column prop="bookId" label="ID" width="80" />
        <el-table-column prop="title" label="书名" min-width="200" />
        <el-table-column prop="author" label="作者" width="150" />
        <el-table-column prop="publisher" label="出版社" width="200" />
        <el-table-column prop="totalCopies" label="总数量" width="80" align="center" />
        <el-table-column prop="availableCopies" label="可借数量" width="80" align="center" />
        <el-table-column prop="location" label="馆藏位置" width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '可借' : '不可借' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openEditDialog(row)">编辑</el-button>
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
          @size-change="loadBooks"
          @current-change="loadBooks"
        />
      </div>
    </el-card>

    <!-- 图书表单对话框 -->
    <el-dialog 
      v-model="dialog.visible" 
      :title="dialog.isEdit ? '编辑图书' : '新增图书'"
      width="600px"
    >
      <el-form 
        ref="bookFormRef"
        :model="bookForm"
        :rules="bookRules"
        label-width="100px"
      >
        <el-form-item label="书名" prop="title">
          <el-input v-model="bookForm.title" placeholder="请输入书名" />
        </el-form-item>
        
        <el-form-item label="作者" prop="author">
          <el-input v-model="bookForm.author" placeholder="请输入作者" />
        </el-form-item>
        
        <el-form-item label="出版社" prop="publisher">
          <el-input v-model="bookForm.publisher" placeholder="请输入出版社" />
        </el-form-item>
        
        <!-- 新增：图书分类 -->
        <el-form-item label="图书分类" prop="typeId">
          <el-select 
            v-model="bookForm.typeId" 
            placeholder="请选择图书分类"
            style="width: 100%"
          >
            <el-option
              v-for="item in bookTypes"
              :key="item.typeId"
              :label="item.typeName"
              :value="item.typeId"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="出版日期" prop="publishDate">
          <el-date-picker 
            v-model="bookForm.publishDate" 
            type="date" 
            placeholder="选择出版日期"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="总数量" prop="totalCopies">
              <el-input-number 
                v-model="bookForm.totalCopies" 
                :min="1" 
                :max="999"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="可借数量" prop="availableCopies">
              <el-input-number 
                v-model="bookForm.availableCopies" 
                :min="0" 
                :max="bookForm.totalCopies"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="馆藏位置" prop="location">
          <el-input v-model="bookForm.location" placeholder="请输入馆藏位置" />
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="bookForm.status">
            <el-radio :label="1">可借</el-radio>
            <el-radio :label="0">不可借</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveBook" :loading="dialog.loading">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'

export default {
  name: 'AdminBooks',
  components: { Search, Plus },
  data() {
    return {
      books: [],
      total: 0,
      page: 1,
      size: 10,
      loading: false,
      searchForm: {
        keyword: ''
      },
      dialog: {
        visible: false,
        isEdit: false,
        loading: false
      },
      // 新增：图书分类列表
      bookTypes: [],
      bookForm: {
        bookId: null,
        title: '',
        author: '',
        publisher: '',
        typeId: null,  // 新增：图书分类 ID
        publishDate: null,
        totalCopies: 1,
        availableCopies: 1,
        location: '',
        status: 1
      },
      bookRules: {
        title: [
          { required: true, message: '请输入书名', trigger: 'blur' }
        ],
        author: [
          { required: true, message: '请输入作者', trigger: 'blur' }
        ],
        // 新增：图书分类验证
        typeId: [
          { required: true, message: '请选择图书分类', trigger: 'change' }
        ]
      }
    }
  },
  created() {
    this.loadBooks()
    this.loadBookTypes()  // 新增：加载图书分类
  },
  methods: {
    // 格式化日期为 yyyy-MM-dd HH:mm:ss
    formatDate(date) {
      if (!date) return ''
      const d = new Date(date)
      const Y = d.getFullYear()
      const M = String(d.getMonth() + 1).padStart(2, '0')
      const D = String(d.getDate()).padStart(2, '0')
      const h = String(d.getHours()).padStart(2, '0')
      const m = String(d.getMinutes()).padStart(2, '0')
      const s = String(d.getSeconds()).padStart(2, '0')
      return `${Y}-${M}-${D} ${h}:${m}:${s}`
    },
    
    // 新增：加载图书分类列表
    async loadBookTypes() {
      try {
        const res = await this.$http.get('/bookType/list')
        if (res.data.code === 200) {
          this.bookTypes = res.data.data || []
          // 如果有分类，默认选中第一个
          if (this.bookTypes.length > 0 && !this.bookForm.typeId) {
            this.bookForm.typeId = this.bookTypes[0].typeId
          }
        }
      } catch (error) {
        console.error('加载图书分类失败:', error)
        // 如果接口失败，给个默认值避免提交报错
        this.bookTypes = [{ typeId: 1, typeName: '默认分类' }]
        this.bookForm.typeId = 1
      }
    },

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
        console.error('加载图书列表失败:', error)
        ElMessage.error('加载图书列表失败')
      } finally {
        this.loading = false
      }
    },

    handleSearch() {
      this.page = 1
      this.loadBooks()
    },

    openAddDialog() {
      this.dialog.isEdit = false
      this.bookForm = {
        bookId: null,
        title: '',
        author: '',
        publisher: '',
        typeId: this.bookTypes.length > 0 ? this.bookTypes[0].typeId : 1,
        publishDate: null,
        totalCopies: 1,
        availableCopies: 1,
        location: '',
        status: 1
      }
      this.dialog.visible = true
    },

    openEditDialog(row) {
      this.dialog.isEdit = true
      this.bookForm = { 
        ...row,
        typeId: row.typeId || 1
      }
      this.dialog.visible = true
    },

    async saveBook() {
      this.$refs.bookFormRef.validate(async (valid) => {
        if (!valid) return

        this.dialog.loading = true
        try {
          // 1. 复制表单数据，避免直接修改表单导致显示异常
          const submitData = { ...this.bookForm }
          
          // 2. 格式化日期，匹配后端要求的 yyyy-MM-dd HH:mm:ss
          if (submitData.publishDate) {
            submitData.publishDate = this.formatDate(submitData.publishDate)
          } else {
            submitData.publishDate = null 
          }

          let res
          if (this.dialog.isEdit) {
            res = await this.$http.put('/book/update', submitData)
          } else {
            res = await this.$http.post('/book/add', submitData)
          }

          if (res.data.code === 200) {
            ElMessage.success(this.dialog.isEdit ? '修改成功' : '添加成功')
            this.dialog.visible = false
            this.loadBooks()
          } else {
            ElMessage.error(res.data.message || '操作失败')
          }
        } catch (error) {
          ElMessage.error('操作失败：' + (error.response?.data?.message || error.message))
        } finally {
          this.dialog.loading = false
        }
      })
    },

    async handleDelete(row) {
      try {
        await ElMessageBox.confirm(`确定要删除图书"${row.title}"吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        const res = await this.$http.delete(`/book/delete/${row.bookId}`)
        if (res.data.code === 200) {
          ElMessage.success('删除成功')
          this.loadBooks()
        } else {
          ElMessage.error(res.data.message || '删除失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('删除失败：' + (error.response?.data?.message || error.message))
        }
      }
    }
  }
}
</script>

<style scoped>
.admin-books-page {
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
</style>
