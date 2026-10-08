import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'

// 路由表：/login 与 /register 是 AuthLayout 的子路由（嵌套路由，共享外壳）
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: AuthLayout,
    children: [
      { path: '', redirect: '/login' },
      {
        path: 'login',
        name: 'login',
        component: () => import('@/views/LoginView.vue'),
        meta: { title: '登录', guestOnly: true }
      },
      {
        path: 'register',
        name: 'register',
        component: () => import('@/views/RegisterView.vue'),
        meta: { title: '注册', guestOnly: true }
      }
    ]
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: '首页', requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'notFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: '页面不存在' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 全局后置钩子：切换页面时同步浏览器标签标题
router.afterEach((to) => {
  const base = import.meta.env.VITE_APP_TITLE
  document.title = to.meta.title ? `${to.meta.title} · ${base}` : base
})

export default router
