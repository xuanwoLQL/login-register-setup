import axios from 'axios'
import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig
} from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, clearAuth } from '@/utils/auth'
import router from '@/router'
import type { ApiResult } from '@/types/user'

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API, // '/api'
  timeout: 10000
})

// ---- 请求拦截器：统一注入 token ----
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// ---- 响应拦截器：统一解包 / 统一报错 / 统一处理 401 ----
service.interceptors.response.use(
  (response: AxiosResponse<ApiResult>) => {
    const res = response.data
    // 解包：运行时返回的是业务数据，但这不符合 AxiosResponse 的类型签名，
    // 所以显式断言一次。调用方通过下面的 request<T>() 拿回正确的类型。
    if (res.code === 200) return res.data as unknown as AxiosResponse

    if (res.code === 401) {
      clearAuth()
      router.replace({ name: 'login' })
    }
    ElMessage.error(res.message || '请求失败')
    return Promise.reject(new Error(res.message))
  },
  (error) => {
    ElMessage.error(error.code === 'ECONNABORTED' ? '请求超时，请稍后重试' : '网络异常，请稍后重试')
    return Promise.reject(error)
  }
)

/**
 * 类型安全的请求入口。
 * 响应拦截器已经把 AxiosResponse 拆成了 data，但 axios 的类型签名不知道这件事。
 *
 * 版本说明（axios 1.20 起）：request 的返回类型是条件类型
 *   AxiosResponseResult<T, R, D, P> = R extends AxiosResponseDefault ? AxiosResponse<T,...> : R
 * 当第二个泛型 R 传的是本函数的类型参数 T 时，条件类型会"延迟解析"，
 * 不再能直接赋值给 Promise<T>，所以这里需要一次显式断言
 * （与响应拦截器里 res.data as unknown as AxiosResponse 是同一个手法）。
 */
export function request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  return service.request<unknown, T>(config) as unknown as Promise<T>
}

export default service
