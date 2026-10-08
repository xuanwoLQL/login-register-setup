/**
 * MSW 请求处理器 + 用户表
 *
 * 在 Service Worker 网络层拦截 /api/* 请求，模拟真实后端。
 * 业务 code 语义与设计文档一致：200 成功；400 用户名或密码错误；
 * 409 用户名已被占用；401 登录已过期。
 * 注意：HTTP 状态一律返回 200，业务状态放在 body 的 code 字段里，
 * 这样 axios 走正常成功分支，由响应拦截器统一解包/报错。
 */
import { http, HttpResponse, delay } from 'msw'
import type { ApiResult, StoredUser } from '@/types/user'

const USERS_KEY = 'lrs_mock_users'

// 预置测试账号
const PRESET: StoredUser[] = [
  {
    id: 1,
    username: 'admin',
    password: '123456',
    nickname: '管理员',
    role: 'admin',
    email: 'admin@demo.com'
  },
  {
    id: 2,
    username: 'student',
    password: '123456',
    nickname: '同学',
    role: 'user',
    email: 'student@demo.com'
  }
]

/** 用户表：localStorage 持久化，刷新页面后已注册的账号仍可登录 */
function loadUsers(): StoredUser[] {
  const raw = localStorage.getItem(USERS_KEY)
  if (raw) {
    try {
      return JSON.parse(raw) as StoredUser[]
    } catch {
      // JSON 损坏时回落到预置账号
    }
  }
  saveUsers(PRESET)
  return [...PRESET]
}

function saveUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

/** 极简 token：mock-token-<username>。真实项目里这是签过名的 JWT */
const makeToken = (username: string) => `mock-token-${username}`
const parseToken = (raw: string | null) =>
  raw?.replace('Bearer ', '').replace('mock-token-', '') ?? ''

const ok = <T>(data: T): ApiResult<T> => ({ code: 200, message: 'ok', data })
const fail = (code: number, message: string): ApiResult<null> => ({ code, message, data: null })

/** 去掉密码字段，返回给前端的用户对象 */
function toSafeUser(user: StoredUser) {
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    email: user.email,
    role: user.role
  }
}

export const handlers = [
  // 登录
  http.post('/api/login', async ({ request }) => {
    await delay(400) // 制造真实延迟，让按钮 loading 可见
    const body = (await request.json()) as { username?: string; password?: string }
    const users = loadUsers()
    const found = users.find((u) => u.username === body.username && u.password === body.password)
    if (!found) {
      return HttpResponse.json(fail(400, '用户名或密码错误'))
    }
    return HttpResponse.json(ok({ token: makeToken(found.username), user: toSafeUser(found) }))
  }),

  // 注册
  http.post('/api/register', async ({ request }) => {
    await delay(400)
    const body = (await request.json()) as {
      username?: string
      password?: string
      nickname?: string
      email?: string
    }
    const users = loadUsers()
    if (users.some((u) => u.username === body.username)) {
      return HttpResponse.json(fail(409, '用户名已被占用'))
    }
    const newUser: StoredUser = {
      id: Math.max(0, ...users.map((u) => u.id)) + 1,
      username: body.username ?? '',
      password: body.password ?? '',
      nickname: body.nickname ?? '',
      email: body.email ?? '',
      role: 'user'
    }
    saveUsers([...users, newUser])
    return HttpResponse.json(ok({ id: newUser.id, username: newUser.username }))
  }),

  // 用户信息
  http.get('/api/user/info', async ({ request }) => {
    const username = parseToken(request.headers.get('Authorization'))
    const users = loadUsers()
    const found = users.find((u) => u.username === username)
    if (!found) {
      return HttpResponse.json(fail(401, '登录已过期，请重新登录'))
    }
    return HttpResponse.json(ok(toSafeUser(found)))
  }),

  // 退出登录（mock 不需要真的作废 token）
  http.post('/api/logout', () => HttpResponse.json(ok(null)))
]
