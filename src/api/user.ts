/**
 * 接口收拢：视图组件里永远不出现 axios 和 URL 字符串。
 * 将来接口地址变了、要加缓存、要换请求库，只改这一个文件。
 */
import { request } from './request'
import type { User, LoginForm, RegisterPayload } from '@/types/user'

export interface LoginResult {
  token: string
  user: User
}

export const login = (data: LoginForm) =>
  request<LoginResult>({ url: '/login', method: 'post', data })

export const register = (data: RegisterPayload) =>
  request<{ id: number; username: string }>({ url: '/register', method: 'post', data })

export const getUserInfo = () => request<User>({ url: '/user/info', method: 'get' })

export const logout = () => request<null>({ url: '/logout', method: 'post' })
