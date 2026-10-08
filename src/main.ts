import { createApp } from 'vue'
import './style.css'
// ★ 不要引 theme-chalk 下的单个 .css 文件，要引组件的 style 入口。
//   ElMessage / ElMessageBox 是函数式调用的，模板里没有 <el-*> 标签，
//   ElementPlusResolver 看不到它们，样式不会被自动引入。
//   只引 el-message-box.css 会缺 .el-overlay 遮罩（背景不变暗），
//   引组件的 style 入口（内部会额外带上 base/input/button/overlay）才能补全。
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import './assets/css/element-theme.css'
import App from './App.vue'
import router from './router'
// 副作用引入：在 router 创建之后、app.use(router) 之前注册全局前置守卫
import './router/guard'

async function bootstrap() {
  // 仅在开发环境、且开关打开时启用 mock；MSW 启动失败不能挡住 mount，
  // 否则学生看到的是一片白屏，而不是"应用正常、只是接口没被拦截"。
  if (import.meta.env.DEV && import.meta.env.VITE_APP_USE_MOCK === 'true') {
    try {
      // 动态 import：生产构建时这段代码不会被打包
      const { startMockServer } = await import('@/mocks/browser')
      await startMockServer()
    } catch (err) {
      console.warn('[mock] MSW 启动失败，接口将不会被拦截', err)
    }
  }

  createApp(App).use(router).mount('#app')
}

bootstrap()
