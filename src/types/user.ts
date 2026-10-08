/**
 * 全局类型定义
 *
 * 接口契约（模仿真实后端）：
 *   ApiResult<T>    —— 统一响应格式
 *   User            —— 登录后返回 / 用户信息接口返回的用户对象（不含密码）
 *   StoredUser      —— mock 用户表里存的对象（含密码，仅存在于前端 localStorage）
 *   LoginForm       —— 登录表单模型
 *   RegisterForm    —— 注册表单模型（含纯前端字段 confirmPassword）
 *   RegisterPayload —— 提交给后端的注册模型（Omit 掉 confirmPassword）
 */

/** 统一响应格式（模仿真实后端）：code === 200 成功；其余为业务错误码 */
export interface ApiResult<T = unknown> {
  code: number
  message: string
  data: T | null
}

/** 用户对象（接口返回，不含密码） */
export interface User {
  id: number
  username: string
  nickname: string
  email: string
  role: 'admin' | 'user'
}

/** mock 用户表里存的对象：比 User 多一个 password */
export interface StoredUser extends User {
  password: string
}

/** 登录表单模型 */
export interface LoginForm {
  username: string
  password: string
}

/** 注册表单模型：confirmPassword 只在前端校验用，不发给后端 */
export interface RegisterForm {
  username: string
  password: string
  confirmPassword: string
  nickname: string
  email: string
}

/** 提交给后端的注册字段：去掉 confirmPassword */
export type RegisterPayload = Omit<RegisterForm, 'confirmPassword'>
