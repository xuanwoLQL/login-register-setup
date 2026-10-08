<template>
  <div class="home-view">
    <!-- 顶栏 -->
    <header class="home-header">
      <div class="header-left">
        <span class="header-logo">◆</span>
        <span class="header-title">{{ appTitle }}</span>
      </div>

      <el-dropdown trigger="click" @command="handleCommand">
        <span class="header-user">
          <el-avatar :size="32" :icon="UserFilled" />
          <span class="header-username">{{ user?.nickname || user?.username }}</span>
          <el-icon class="header-caret"><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </header>

    <main class="home-main">
      <!-- 账号信息 -->
      <el-card shadow="never" class="section-card">
        <template #header>账号信息</template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户名">{{ user?.username }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ user?.nickname }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ user?.email }}</el-descriptions-item>
          <el-descriptions-item label="角色">
            {{ user?.role === 'admin' ? '管理员' : '普通用户' }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 统计卡片 -->
      <div class="stat-row">
        <el-card shadow="never" class="stat-card">
          <el-statistic title="课程项目" :value="3" />
        </el-card>
        <el-card shadow="never" class="stat-card">
          <el-statistic title="已完成" :value="2" />
        </el-card>
        <el-card shadow="never" class="stat-card">
          <el-statistic title="进行中" :value="1" />
        </el-card>
      </div>

      <!-- 课程项目列表（静态演示数据，本项目的主角是鉴权，不是列表 CRUD） -->
      <el-card shadow="never" class="section-card">
        <template #header>课程项目列表</template>
        <el-table :data="projects" stripe>
          <el-table-column prop="name" label="项目名称" min-width="180" />
          <el-table-column prop="desc" label="说明" min-width="260" />
          <el-table-column prop="status" label="状态" width="100" />
        </el-table>
      </el-card>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, UserFilled } from '@element-plus/icons-vue'
import { getUserInfo, logout } from '@/api/user'
import { clearAuth, getStoredUser } from '@/utils/auth'
import type { User } from '@/types/user'

const router = useRouter()

const appTitle = import.meta.env.VITE_APP_TITLE
// 先用本地缓存里的用户信息渲染，再走接口刷新（守卫只认 token，这里展示完整信息）
const user = ref<User | null>(getStoredUser())

const projects = [
  { name: 'toDoListSetup', desc: '待办清单（事件总线）', status: '已完成' },
  { name: 'studentRegisterSetup', desc: '学生信息登记（props / emit）', status: '已完成' },
  { name: 'loginRegisterSetup', desc: '登录注册（前后端交互 + 鉴权）', status: '进行中' }
]

onMounted(async () => {
  try {
    user.value = await getUserInfo()
  } catch {
    // 401 已由响应拦截器清 token 并跳登录页，这里不用重复处理
  }
})

async function handleCommand(command: string | number | object) {
  if (command !== 'logout') return

  // 退出登录二次确认
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      type: 'warning',
      confirmButtonText: '退出',
      cancelButtonText: '取消'
    })
  } catch {
    return // 用户点了取消
  }

  try {
    await logout()
  } catch {
    // mock 不会报错；接真实后端时，退出接口失败也不阻塞本地登出
  }
  clearAuth()
  ElMessage.success('已退出登录')
  router.replace({ name: 'login' })
}
</script>

<style lang="scss" scoped>
.home-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: $bg-page;
}

.home-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 24px;
  background-color: $bg-card;
  border-bottom: 1px solid $border;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-logo {
  color: $brand;
  font-size: 20px;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: $text;
}

.header-user {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: $text;
  outline: none;
}

.header-username {
  font-size: 14px;
}

.header-caret {
  color: $text-muted;
}

.home-main {
  flex: 1;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-card {
  border-radius: $radius;
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.stat-card {
  border-radius: $radius;
  text-align: center;
}

@media (max-width: 899px) {
  .stat-row {
    grid-template-columns: 1fr;
  }
}
</style>
