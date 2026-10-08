import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

export async function startMockServer(): Promise<void> {
  await worker.start({
    // 没有被 handler 匹配到的请求直接放行，不要在控制台刷警告。
    // 页面加载时的 .js / .css / .svg 请求都属于这一类，
    // 不设这一项的话控制台会被一串 "[MSW] Warning: captured a request without
    // a matching request handler" 淹没。
    onUnhandledRequest: 'bypass'
  })
  console.log('[mock] MSW 已启动，/api/* 的请求都会被拦截')
}
