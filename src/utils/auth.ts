/**
 * token 与用户信息的本地存储读写（全局鉴权状态就这两个值，无需 Pinia）
 *
 * 「记住我」逻辑：
 *   - 勾选记住我 → 写 localStorage（关浏览器仍在）
 *   - 不勾选     → 写 sessionStorage（关标签页即失效）
 * getToken() 两个存储都读，localStorage 优先。
 */
import type { User } from '@/types/user'

const TOKEN_KEY = import.meta.env.VITE_APP_TOKEN_KEY
const USER_KEY = `${TOKEN_KEY}_user`

function pickStorage(remember: boolean): Storage {
  return remember ? localStorage : sessionStorage
}

/** 读取 token（两个存储都读，localStorage 优先） */
export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY) ?? ''
}

/** 读取本地缓存的用户信息（可能为 null） */
export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

/** 登录成功后写入 token 与用户信息 */
export function setAuth(token: string, user: User, remember = true): void {
  const storage = pickStorage(remember)
  storage.setItem(TOKEN_KEY, token)
  storage.setItem(USER_KEY, JSON.stringify(user))
}

/** 只写 token（按「记住我」决定写哪个存储） */
export function setToken(token: string, remember = true): void {
  pickStorage(remember).setItem(TOKEN_KEY, token)
}

/** 清空两个存储里的 token 与用户信息（退出登录 / 401 时调用） */
export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
}
