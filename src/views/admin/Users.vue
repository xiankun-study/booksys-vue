<template>
  <div class="users-page">
    <!-- 工具栏 -->
    <el-card class="toolbar-card" shadow="hover">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-input 
            v-model="searchForm.keyword" 
            placeholder="请输入用户名/真实姓名"
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
            <el-icon><Plus /></el-icon> 新增用户
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 用户列表 -->
    <el-card class="list-card" shadow="hover">
      <el-table :data="users" stripe v-loading="loading">
        <el-table-column prop="userId" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="realName" label="真实姓名" width="150" />
        <el-table-column prop="email" label="邮箱" min-width="200" />
        <el-table-column prop="phone" label="手机号" width="150" />
        <el-table-column prop="userType" label="用户类型" width="100">
          <template #default="{ row }">
            {{ row.userType === 2 ? '管理员' : '普通用户' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(row)"
              :disabled="row.userId === currentUser?.userId"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="注册时间" width="180">
          <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openEditDialog(row)">编辑</el-button>
            <el-button 
              type="danger" 
              link 
              @click="handleDelete(row)"
              :disabled="row.userId === currentUser?.userId"
            >
              删除
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
          @size-change="loadUsers"
          @current-change="loadUsers"
        />
      </div>
    </el-card>

    <!-- 用户表单对话框 -->
    <el-dialog 
      v-model="dialog.visible" 
      :title="dialog.isEdit ? '编辑用户' : '新增用户'"
      width="500px"
    >
      <el-form 
        ref="userFormRef"
        :model="userForm"
        :rules="userRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="userForm.username" 
            :disabled="dialog.isEdit"
            placeholder="请输入用户名"
          />
        </el-form-item>
        
        <el-form-item v-if="!dialog.isEdit" label="密码" prop="password">
          <el-input 
            v-model="userForm.password" 
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="userForm.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        
        <el-form-item label="电子邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入电子邮箱" />
        </el-form-item>
        
        <el-form-item label="手机号码" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号码" />
        </el-form-item>
        
        <el-form-item label="用户类型" prop="userType">
          <el-radio-group v-model="userForm.userType">
            <el-radio :label="1">普通用户</el-radio>
            <el-radio :label="2">管理员</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item v-if="dialog.isEdit" label="状态" prop="status">
          <el-radio-group v-model="userForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveUser" :loading="dialog.loading">
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
  name: 'AdminUsers',
  components: { Search, Plus },
  data() {
    return {
      users: [],
      total: 0,
      page: 1,
      size: 10,
      loading: false,
      currentUser: null,
      searchForm: {
        keyword: ''
      },
      dialog: {
        visible: false,
        isEdit: false,
        loading: false
      },
      userForm: {
        userId: null,
        username: '',
        password: '',
        realName: '',
        email: '',
        phone: '',
        userType: 1,
        status: 1
      },
      userRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
        ],
        email: [
          { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
        ],
        phone: [
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.getCurrentUser()
    this.loadUsers()
  },
  methods: {
    getCurrentUser() {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        this.currentUser = JSON.parse(userStr)
      }
    },

    async loadUsers() {
      this.loading = true
      try {
        const params = {
          page: this.page - 1,
          size: this.size,
          keyword: this.searchForm.keyword || undefined
        }
        
        const res = await this.$http.get('/user/list', { params })
        if (res.data.code === 200) {
          this.users = res.data.data || []
          this.total = res.data.total || 0
        }
      } catch (error) {
        console.error('加载用户列表失败:', error)
        ElMessage.error('加载用户列表失败')
      } finally {
        this.loading = false
      }
    },

    handleSearch() {
      this.page = 1
      this.loadUsers()
    },

    formatDate(dateStr) {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    },

    openAddDialog() {
      this.dialog.isEdit = false
      this.userForm = {
        userId: null,
        username: '',
        password: '',
        realName: '',
        email: '',
        phone: '',
        userType: 1,
        status: 1
      }
      this.dialog.visible = true
    },

    openEditDialog(row) {
      this.dialog.isEdit = true
      this.userForm = { ...row }
      this.userForm.password = '' // 不显示密码
      this.dialog.visible = true
    },

   async saveUser() {
  this.$refs.userFormRef.validate(async (valid) => {
    if (!valid) return

    this.dialog.loading = true
    try {
      let res
      
      if (this.dialog.isEdit) {
        // 编辑用户 - 只提交需要更新的字段
        const updateData = {
          userId: this.userForm.userId,
          realName: this.userForm.realName,
          email: this.userForm.email,
          phone: this.userForm.phone,
          userType: this.userForm.userType,
          status: this.userForm.status
        }
        // 注意：不包含 username 和 password
        res = await this.$http.put('/user/update', updateData)
      } else {
        // 新增用户 - 提交所有必要字段
        res = await this.$http.post('/user/register', {
          username: this.userForm.username,
          password: this.userForm.password,
          realName: this.userForm.realName,
          email: this.userForm.email,
          phone: this.userForm.phone,
          userType: this.userForm.userType
        })
      }

      if (res.data.code === 200) {
        ElMessage.success(this.dialog.isEdit ? '修改成功' : '添加成功')
        this.dialog.visible = false
        this.loadUsers()
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

    async handleStatusChange(row) {
      try {
        const res = await this.$http.put('/user/update', {
          userId: row.userId,
          status: row.status
        })
        if (res.data.code === 200) {
          ElMessage.success('状态更新成功')
        } else {
          // 恢复状态
          row.status = row.status === 1 ? 0 : 1
          ElMessage.error(res.data.message || '状态更新失败')
        }
      } catch (error) {
        // 恢复状态
        row.status = row.status === 1 ? 0 : 1
        ElMessage.error('状态更新失败：' + (error.response?.data?.message || error.message))
      }
    },

    async handleDelete(row) {
      try {
        await ElMessageBox.confirm(`确定要删除用户"${row.username}"吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        const res = await this.$http.delete(`/user/delete/${row.userId}`)
        if (res.data.code === 200) {
          ElMessage.success('删除成功')
          this.loadUsers()
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
.users-page {
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