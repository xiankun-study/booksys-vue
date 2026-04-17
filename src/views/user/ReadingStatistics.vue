<template>
    <div class="statistics-page">
        <el-card class="page-header-card">
            <h2>📚 我的阅读统计</h2>
            <p>记录你的每一次阅读旅程</p>
        </el-card>

        <el-row :gutter="20" class="stat-cards">
            <el-col :span="6" v-for="(item, index) in statItems" :key="index">
                <el-card shadow="hover" class="stat-item-card">
                    <div class="stat-icon">{{ item.icon }}</div>
                    <div class="stat-number" :style="{ color: getStatColor(item.label, item.value) }">
                        {{ item.value }}
                    </div>
                    <div class="stat-label">{{ item.label }}</div>
                </el-card>
            </el-col>
        </el-row>

        <el-row :gutter="20" style="margin-top: 20px;">
            <el-col :span="12">
                <el-card shadow="hover">
                    <template #header>
                        <div class="card-title">近 6 个月借阅趋势</div>
                    </template>
                    <div ref="trendChartRef" style="height: 250px;"></div>
                </el-card>
            </el-col>

            <el-col :span="12">
                <el-card shadow="hover">
                    <template #header>
                        <div class="card-title">借阅类型分布</div>
                    </template>
                    <div ref="categoryChartRef" style="height: 250px;"></div>
                </el-card>
            </el-col>
        </el-row>

        <el-card shadow="hover" style="margin-top: 20px;">
            <template #header>
                <div class="card-title">我的常借图书 Top 5</div>
            </template>
            <el-table :data="topBooks" stripe size="small">
                <el-table-column label="排名" width="80">
                    <template #default="{ $index }">
                        <span
                            :style="{ fontSize: '16px', fontWeight: $index === 0 ? 'bold' : 'normal', color: $index === 0 ? '#f56c6c' : '#909399' }">
                            {{ $index === 0 ? '🥇' : $index === 1 ? '🥈' : $index === 2 ? '🥉' : '#' + ($index + 1) }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column prop="title" label="书名" min-width="200"></el-table-column>
                <el-table-column prop="author" label="作者" min-width="150"></el-table-column>
                <el-table-column prop="borrowCount" label="借阅次数" width="100">
                    <template #default="{ row }">
                        <el-tag type="primary">{{ row.borrowCount }} 次</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="状态" width="100">
                    <template #default="{ row }">
                        <el-tag :type="row.status === '已归还' ? 'success' : 'warning'">
                            {{ row.status }}
                        </el-tag>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <el-card shadow="hover" style="margin-top: 20px;">
            <template #header>
                <div class="card-title">🏆 阅读成就</div>
            </template>
            <div class="badge-container">
                <div class="achievement-badge-item" v-for="badge in badges" :key="badge.id"
                    :class="{ unlocked: badge.unlocked }">
                    <div class="badge-icon">{{ badge.icon }}</div>
                    <div class="badge-name">{{ badge.name }}</div>
                    <div class="badge-desc">{{ badge.description }}</div>
                </div>
            </div>
        </el-card>
    </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
    name: 'ReadingStatistics',
    data() {
        return {
            statItems: [
                { icon: '📖', value: 0, label: '累计借阅' },
                { icon: '✅', value: 0, label: '已归还' },
                { icon: '⏳', value: 0, label: '借阅中' },
                { icon: '📊', value: '0%', label: '借阅完成率' }
            ],
            topBooks: [],
            badges: [
                { id: 1, icon: '📚', name: '阅读新手', description: '完成首次借阅', unlocked: false },
                { id: 2, icon: '📗', name: '博览群书', description: '借阅超过 10 本', unlocked: false },
                { id: 3, icon: '🕐', name: '守时达人', description: '准时归还 5 次', unlocked: false },
                { id: 4, icon: '💡', name: '知识先锋', description: '连续借阅 30 天', unlocked: false },
                { id: 5, icon: '👑', name: '阅读之星', description: '借阅超过 50 本', unlocked: false }
            ]
        }
    },
    mounted() {
        this.loadData()
    },
    methods: {
        async loadData() {
            try {
                const userStr = localStorage.getItem('user')
                if (!userStr) {
                    console.warn('未找到用户信息')
                    return
                }
                const userId = JSON.parse(userStr).userId

                await Promise.all([
                    this.loadStats(userId),
                    this.loadTrendData(userId),
                    this.loadCategoryData(userId),
                    this.loadTopBooks(userId)
                ])
            } catch (error) {
                console.error('加载统计数据失败:', error)
            }
        },

        // 计算方法实现
        async loadStats(userId) {
            try {
                const totalRes = await this.$http.get('/borrow/userRecords', { params: { userId } })
                const currentRes = await this.$http.get('/borrow/currentBorrows', { params: { userId } })

                if (totalRes.data.code === 200 && currentRes.data.code === 200) {
                    const allRecords = totalRes.data.data || []
                    const totalBorrowed = allRecords.length
                    const currentlyBorrowing = currentRes.data.data?.length || 0
                    const returned = totalBorrowed - currentlyBorrowing

                    this.statItems[0].value = totalBorrowed
                    this.statItems[1].value = returned
                    this.statItems[2].value = currentlyBorrowing
                    let completionRate = '-'
                    if (totalBorrowed > 0) {
                        const percent = Math.round((returned / totalBorrowed) * 100)
                        completionRate = percent + '%'
                    }
                    this.statItems[3].value = completionRate
                    if (totalBorrowed >= 1) {
                        this.badges[0].unlocked = true
                    }
                    let maxBorrowDays = 0
                    allRecords.forEach(record => {
                        if (record.borrowDate && record.returnDate) {
                            const start = new Date(record.borrowDate)
                            const end = new Date(record.returnDate)
                            const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
                            if (days > maxBorrowDays) maxBorrowDays = days
                        }
                    })
                    if (maxBorrowDays >= 30) {
                        this.badges[3].unlocked = true
                    }
                    if (totalBorrowed >= 10) this.badges[1].unlocked = true
                    if (returned >= 5) this.badges[2].unlocked = true
                    if (totalBorrowed >= 50) this.badges[4].unlocked = true
                }
            } catch (error) {
                console.error('核心统计数据加载失败', error)
            }
        },

        // 根据完成率设置颜色
        getStatColor(label, value) {
            if (label === '借阅完成率') {
                if (value === '-') return '#2b5876'
                const num = parseInt(value)
                if (num >= 90) return '#67C23A'
                if (num >= 60) return '#E6A23C'
                return '#F56C6C'
            }
            return '#2b5876'
        },

        async loadTopBooks(userId) {
            try {
                const res = await this.$http.get('/borrow/userRecords', { params: { userId } })
                if (res.data.code === 200 && res.data.data && res.data.data.length > 0) {
                    const borrowMap = {}
                    res.data.data.forEach(borrow => {
                        const key = borrow.bookId
                        if (!borrowMap[key]) {
                            borrowMap[key] = {
                                bookId: borrow.bookId,
                                title: borrow.bookTitle || '未知',
                                author: borrow.bookAuthor || '未知',
                                borrowCount: 0,
                                status: borrow.returnDate ? '已归还' : '借阅中'
                            }
                        }
                        borrowMap[key].borrowCount++
                    })

                    this.topBooks = Object.values(borrowMap)
                        .sort((a, b) => b.borrowCount - a.borrowCount)
                        .slice(0, 5)
                }
            } catch (error) {
                console.error('排行榜加载失败', error)
            }
        },
        async loadTrendData(userId) {
            try {
                const trendChart = echarts.init(this.$refs.trendChartRef)
                const trendRes = await this.$http.get('/borrow/user/trend/month', { params: { userId } })

                if (trendRes.data.code === 200 && trendRes.data.labels && trendRes.data.data) {
                    trendChart.setOption({
                        tooltip: { trigger: 'axis' },
                        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                        xAxis: { type: 'category', data: trendRes.data.labels },
                        yAxis: { type: 'value' },
                        series: [{
                            data: trendRes.data.data,
                            type: 'line',
                            smooth: true,
                            areaStyle: { opacity: 0.3, color: 'rgba(64, 158, 255, 0.3)' },
                            lineStyle: { color: '#409EFF' },
                            itemStyle: { color: '#409EFF' }
                        }]
                    })
                } else {
                    trendChart.setOption({
                        tooltip: { trigger: 'axis' },
                        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                        xAxis: { type: 'category', data: ['1 月', '2 月', '3 月', '4 月', '5 月', '6 月'] },
                        yAxis: { type: 'value' },
                        series: [{
                            data: [0, 0, 0, 0, 0, 0],
                            type: 'line',
                            smooth: true,
                            areaStyle: { opacity: 0.3, color: 'rgba(64, 158, 255, 0.3)' },
                            lineStyle: { color: '#409EFF' },
                            itemStyle: { color: '#409EFF' }
                        }]
                    })
                }
            } catch (error) {
                console.error('趋势图加载失败', error)
            }
        },

        async loadCategoryData(userId) {
            try {
                const categoryChart = echarts.init(this.$refs.categoryChartRef)
                const categoryRes = await this.$http.get('/borrow/user/category/distribution', { params: { userId } })

                if (categoryRes.data.code === 200 && categoryRes.data.data && categoryRes.data.data.length > 0) {
                    const sortedData = categoryRes.data.data.sort((a, b) => b.value - a.value)
                    categoryChart.setOption({
                        tooltip: { trigger: 'item' },
                        legend: { orient: 'vertical', left: 'left' },
                        series: [{
                            type: 'pie',
                            radius: '50%',
                            data: sortedData,
                            emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
                        }]
                    })
                } else {
                    categoryChart.setOption({
                        tooltip: { trigger: 'item' },
                        series: [{
                            type: 'pie',
                            radius: '50%',
                            data: [{ value: 0, name: '暂无借阅' }],
                            emphasis: { itemStyle: { shadowBlur: 10 } }
                        }]
                    })
                }
            } catch (error) {
                console.error('分类图加载失败', error)
            }
        }
    },
    beforeUnmount() {
        if (this.$refs.trendChartRef) echarts.dispose(this.$refs.trendChartRef)
        if (this.$refs.categoryChartRef) echarts.dispose(this.$refs.categoryChartRef)
    }
}
</script>

<style scoped>
.statistics-page {
    padding: 20px;
}

.page-header-card {
    margin-bottom: 20px;
    text-align: center;
}

.page-header-card h2 {
    margin: 0;
    font-size: 28px;
    color: #2b5876;
}

.page-header-card p {
    color: #999;
    margin-top: 5px;
}

.stat-cards {
    margin-top: 20px;
}

.stat-item-card {
    text-align: center;
    padding: 20px;
}

.stat-item-card:hover {
    transform: translateY(-5px);
    transition: all 0.3s;
}

.stat-icon {
    font-size: 48px;
    margin-bottom: 10px;
}

.stat-number {
    font-size: 32px;
    font-weight: bold;
    margin-bottom: 5px;
}

.stat-label {
    font-size: 14px;
    color: #999;
}

.card-title {
    font-weight: 500;
    font-size: 16px;
}

.badge-container {
    display: flex;
    justify-content: center;
    align-items: stretch;
    flex-wrap: wrap;
    gap: 20px;
    padding: 10px 0;
}

.achievement-badge-item {
    text-align: center;
    padding: 20px 15px;
    border-radius: 10px;
    background: #f5f7fa;
    opacity: 0.6;
    min-width: 120px;
    transition: all 0.3s;
}

.achievement-badge-item.unlocked {
    background: linear-gradient(135deg, #fff8e1, #ffe0b2);
    opacity: 1;
    box-shadow: 0 4px 12px rgba(255, 193, 7, 0.2);
}

.badge-icon {
    font-size: 40px;
    margin-bottom: 10px;
}

.badge-name {
    font-size: 14px;
    font-weight: 500;
    color: #333;
}

.badge-desc {
    font-size: 12px;
    color: #909399;
    margin-top: 5px;
}
</style>