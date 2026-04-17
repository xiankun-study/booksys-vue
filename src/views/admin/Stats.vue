<template>
  <div class="stats-page">
    <!-- 时间筛选 -->
    <el-card class="filter-card" shadow="hover">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-radio-group v-model="timeRange" @change="loadAllStats">
            <el-radio-button label="week">本周</el-radio-button>
            <el-radio-button label="month">本月</el-radio-button>
            <el-radio-button label="year">本年</el-radio-button>
          </el-radio-group>
        </el-col>
        <el-col :span="6" :offset="12" style="text-align: right;">
          <el-button type="primary" @click="exportData">
            <el-icon><Download /></el-icon> 导出报表
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6" v-for="stat in summaryStats" :key="stat.title">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" :class="stat.iconClass">
              <el-icon><component :is="stat.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">{{ stat.title }}</div>
              <div class="stat-value">{{ stat.value }}</div>
              <!--<div class="stat-change" :class="stat.changeType">
                {{ stat.change }} 较上期
              </div>-->
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>借阅趋势</span>
            </div>
          </template>
          <!-- 确保容器有明确高度 -->
          <div id="borrowTrendChart" style="width: 100%; height: 350px;"></div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>图书分类占比</span>
            </div>
          </template>
          <!-- 确保容器有明确高度 -->
          <div id="categoryChart" style="width: 100%; height: 350px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 排行榜 -->
    <el-row :gutter="20" class="rank-row">
      <el-col :span="12">
        <el-card class="rank-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>热门借阅图书 TOP10</span>
            </div>
          </template>
          
          <div v-for="(book, index) in hotBooks" :key="book.bookId" class="rank-item">
            <div class="rank-num" :class="{ 'top-three': index < 3 }">{{ index + 1 }}</div>
            <div class="rank-info">
              <div class="rank-title">{{ book.title }}</div>
              <div class="rank-author">{{ book.author }}</div>
            </div>
            <div class="rank-count">{{ book.borrowCount }}次</div>
          </div>
          
          <el-empty v-if="hotBooks.length === 0" description="暂无数据" />
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card class="rank-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>活跃用户 TOP10</span>
            </div>
          </template>
          
          <div v-for="(user, index) in activeUsers" :key="user.user_id" class="rank-item">
            <div class="rank-num" :class="{ 'top-three': index < 3 }">{{ index + 1 }}</div>
            <div class="rank-info">
              <div class="rank-title">{{ user.real_name || user.username }}</div>
              <div class="rank-author">{{ user.user_type === 2 ? '管理员' : '普通用户' }}</div>
            </div>
            <div class="rank-count">{{ user.borrowCount }}次</div>
          </div>
          
          <el-empty v-if="activeUsers.length === 0" description="暂无数据" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { ElMessage, ElLoading } from 'element-plus'
import { 
  User, Reading, List, Warning, 
  Download, 
  ArrowUp, ArrowDown 
} from '@element-plus/icons-vue'

export default {
  name: 'AdminStats',
  components: { User, Reading, List, Warning, Download, ArrowUp, ArrowDown },
  data() {
    return {
      timeRange: 'month',
      summaryStats: [
        { title: '总借阅量', icon: 'List', iconClass: 'borrow-icon', value: 0, change: '0%', changeType: 'up' },
        { title: '新增用户', icon: 'User', iconClass: 'user-icon', value: 0, change: '0%', changeType: 'up' },
        { title: '新增图书', icon: 'Reading', iconClass: 'book-icon', value: 0, change: '0%', changeType: 'up' },
        { title: '逾期率(总)', icon: 'Warning', iconClass: 'overdue-icon', value: '0%', change: '0%', changeType: 'down' }
      ],
      hotBooks: [],
      activeUsers: [],
      borrowChart: null,
      categoryChart: null
    }
  },
  mounted() {
    // 确保 DOM 完全渲染后再初始化
    this.$nextTick(() => {
      this.initCharts()
      this.loadAllStats()
    })
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    if (this.borrowChart) {
      this.borrowChart.dispose()
      this.borrowChart = null
    }
    if (this.categoryChart) {
      this.categoryChart.dispose()
      this.categoryChart = null
    }
  },
  methods: {
    handleResize() {
      if (this.borrowChart) this.borrowChart.resize()
      if (this.categoryChart) this.categoryChart.resize()
    },
    
    initCharts() {
      // 借阅趋势图
      const borrowChartDom = document.getElementById('borrowTrendChart')
      if (borrowChartDom && !this.borrowChart) {
        this.borrowChart = echarts.init(borrowChartDom)
      }

      // 分类占比图
      const categoryChartDom = document.getElementById('categoryChart')
      if (categoryChartDom && !this.categoryChart) {
        this.categoryChart = echarts.init(categoryChartDom)
      }
    },

    async updateBorrowChart() {
      if (!this.borrowChart) {
        console.error('借阅图表未初始化')
        return
      }
      try {
        const res = await this.$http.get('/stats/borrow/trend', { params: { type: this.timeRange } })
        if (res.data.code === 200) {
          const chartData = res.data.data || []
          const days = chartData.map(item => item.date)
          const counts = chartData.map(item => item.count)

          const option = {
            tooltip: { 
              trigger: 'axis',
              axisPointer: { type: 'shadow' }
            },
            grid: {
              left: '3%',
              right: '4%',
              bottom: '3%',
              top: '10%',
              containLabel: true
            },
            xAxis: {
              type: 'category',
              data: days.length > 0 ? days : ['暂无数据'],
              axisLabel: {
                rotate: this.timeRange === 'year' ? 30 : 0,
                interval: 0
              }
            },
            yAxis: {
              type: 'value',
              name: '借阅数量',
              minInterval: 1
            },
            series: [
              {
                name: '借阅量',
                type: 'line',
                data: counts.length > 0 ? counts : [0],
                smooth: true,
                lineStyle: {
                  color: '#2b5876',
                  width: 3
                },
                areaStyle: {
                  color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(43, 88, 118, 0.3)' },
                    { offset: 1, color: 'rgba(43, 88, 118, 0.1)' }
                  ])
                },
                itemStyle: {
                  color: '#2b5876'
                }
              }
            ]
          }
          this.borrowChart.setOption(option, true) // true 表示不合并，完全重置
        }
      } catch (error) {
        console.error('加载趋势图失败', error)
        // 即使出错也显示空图表
        this.borrowChart.setOption({
          xAxis: { type: 'category', data: ['暂无数据'] },
          yAxis: { type: 'value' },
          series: [{ type: 'line', data: [0] }]
        })
      }
    },

    async updateCategoryChart() {
      if (!this.categoryChart) {
        console.error('分类图表未初始化')
        return
      }
      try {
        const res = await this.$http.get('/stats/book/category')
        if (res.data.code === 200) {
          const chartData = res.data.data || []
          
          const option = {
            tooltip: { trigger: 'item' },
            legend: {
              orient: 'vertical',
              left: 'left',
              top: 'center'
            },
            series: [
              {
                name: '图书分类',
                type: 'pie',
                radius: ['50%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: {
                  borderRadius: 10,
                  borderColor: '#fff',
                  borderWidth: 2
                },
                label: {
                  show: false
                },
                emphasis: {
                  label: {
                    show: true,
                    fontSize: 14,
                    fontWeight: 'bold'
                  }
                },
                data: chartData.length > 0 ? chartData : [{ name: '暂无数据', value: 1 }]
              }
            ]
          }
          this.categoryChart.setOption(option, true)
        }
      } catch (error) {
        console.error('加载分类图失败', error)
        this.categoryChart.setOption({
          series: [{
            type: 'pie',
            radius: ['50%', '70%'],
            data: [{ name: '暂无数据', value: 1 }]
          }]
        })
      }
    },

    async loadAllStats() {
      const loading = ElLoading.service({ lock: true, text: '加载统计数据中...' })
      try {
        await Promise.all([
          this.loadSummaryStats(),
          this.updateBorrowChart(),
          this.updateCategoryChart(),
          this.loadHotBooks(),
          this.loadActiveUsers()
        ])
      } catch (error) {
        console.error('加载统计数据失败:', error)
        ElMessage.error('加载数据失败，请稍后重试')
      } finally {
        loading.close()
      }
    },

    async loadSummaryStats() {
      try {
        const res = await this.$http.get('/stats/dashboard', { params: { type: this.timeRange } })
        if (res.data.code === 200) {
          const data = res.data.data
          this.summaryStats[0].value = data.totalBorrow || 0
          this.summaryStats[1].value = data.newUsers || 0
          this.summaryStats[2].value = data.newBooks || 0
          this.summaryStats[3].value = (data.overdueRate || 0) + '%'
        }
      } catch (error) {
        console.error('加载汇总统计失败:', error)
      }
    },

    async loadHotBooks() {
      try {
        const res = await this.$http.get('/borrow/stats/hotBooks')
        if (res.data.code === 200) {
          this.hotBooks = res.data.data || []
        }
      } catch (error) {
        console.error('加载热门图书失败:', error)
      }
    },

    async loadActiveUsers() {
      try {
        const res = await this.$http.get('/stats/user/active', { params: { limit: 10 } })
        if (res.data.code === 200) {
          this.activeUsers = res.data.data || []
        }
      } catch (error) {
        console.error('加载活跃用户失败:', error)
      }
    },

   async exportData() {
      const loading = ElLoading.service({ lock: true, text: '正在生成报表...', background: 'rgba(0,0,0,0.7)' })
      try {
        // 调用后端导出接口，关键：设置 responseType 为 'blob'
        const res = await this.$http.get('/stats/export/dashboard', {
          params: { type: this.timeRange },
          responseType: 'blob' 
        })
        loading.close()
        // 从响应头获取文件名，如果失败则使用默认名称
        let fileName = `图书馆统计数据_${this.timeRange}_${Date.now()}.xlsx`
        const disposition = res.headers['content-disposition']
        if (disposition && disposition.indexOf('attachment') !== -1) {
          const regex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
          const matches = regex.exec(disposition)
          if (matches != null && matches[1]) {
            fileName = decodeURIComponent(matches[1].replace(/["]/g, ''))
          }
        }
        // 创建 Blob 并触发下载
        const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', fileName)
        document.body.appendChild(link)
        link.click()
        // 清理资源
        link.remove()
        window.URL.revokeObjectURL(url)
        ElMessage.success('报表导出成功！')
      } catch (error) {
        loading.close()
        console.error('导出失败:', error)
        ElMessage.error('报表导出失败，请稍后重试')
      }
    }
  },
  watch: {
    timeRange() {
      this.loadAllStats()
    }
  }
}
</script>

<style scoped>
.stats-page {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.filter-card {
  margin-bottom: 20px;
  border: none;
  border-radius: 10px;
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
}

.stat-title {
  font-size: 14px;
  color: #999;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  line-height: 1.2;
  margin-bottom: 5px;
}

.stat-change {
  font-size: 12px;
}

.stat-change.up {
  color: #f56c6c;
}

.stat-change.down {
  color: #67c23a;
}

.chart-card {
  border: none;
  border-radius: 10px;
  margin-bottom: 20px;
}

.card-header {
  font-weight: 500;
  font-size: 16px;
}

.rank-row {
  margin-top: 20px;
}

.rank-card {
  border: none;
  border-radius: 10px;
}

.rank-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.rank-item:last-child {
  border-bottom: none;
}

.rank-num {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #999;
  margin-right: 15px;
}

.rank-num.top-three {
  background: linear-gradient(135deg, #f5b041, #f39c12);
  color: #fff;
}

.rank-info {
  flex: 1;
}

.rank-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 3px;
}

.rank-author {
  font-size: 12px;
  color: #999;
}

.rank-count {
  font-size: 14px;
  font-weight: 500;
  color: #2b5876;
}
</style>
