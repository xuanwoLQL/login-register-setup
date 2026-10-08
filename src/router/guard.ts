import router from './index'
import { getToken } from '@/utils/auth'

/**
 * 全局前置守卫（登录拦截）。
 * 由 main.ts 在 router 创建之后、app.use(router) 之前以副作用方式引入：
 *   import router from './router'
 *   import './router/guard'
 *
 * 返回值语义（vue-router 4 新写法，v3 要调 next()）：
 *   返回 false 或一个路由地址 = 拦截；返回 true / undefined = 放行。
 */
router.beforeEach((to) => {
  const token = getToken()

  // 1. 需要登录但没 token → 打回登录页，并记住原本想去哪
  if (to.meta.requiresAuth && !token) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // 2. 已登录却还想去登录/注册页 → 直接送到首页
  if (to.meta.guestOnly && token) {
    return { name: 'home' }
  }

  // 3. 其余放行
  return true
})
