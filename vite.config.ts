import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
// 开发时实时运行 ESLint，把错误直接显示在浏览器上
// （用 @nabla/vite-plugin-eslint，它支持 ESLint 9/10；旧的 vite-plugin-eslint 已停更于 2022 年）
import eslint from '@nabla/vite-plugin-eslint'
//
import { resolve } from 'path'
// 自动注册 Vue 组件。它允许你在 Vue 项目中自动引入和注册组件，而不需要手动导入每一个组件。
import Components from 'unplugin-vue-components/vite'
// 这个插件是为了解决在开发中的导入问题
import AutoImport from 'unplugin-auto-import/vite'
// ★ 新增：Element Plus 的按需自动导入解析器。
//   配合下面的 Components({ resolvers: [ElementPlusResolver()] })，
//   模板里写到的 <el-button> / <el-form> 等组件会自动注册 JS 与样式，无需手动 import。
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 根据当前工作目录中的 `mode` 加载 .env 文件
  // 第二个参数：process.cwd()表示返回运行当前脚本的工作目录的路径（current work directory）
  // 第三个参数 'VITE_'：只加载 VITE_ 前缀的变量，供下面的反向代理示例使用
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    //  开发或生产环境服务的公共基础路径：默认'/'   1、绝对 URL 路径名： /foo/；  2、完整的 URL： https://foo.com/； 3、空字符串或 ./（用于开发环境）
    base: '/',

    // ******插件配置******
    plugins: [
      vue(),
      eslint({
        // 只检查 src 下的 .ts / .tsx / .vue，与原来 vite-plugin-eslint 的 include 范围一致
        shouldLint: (path) => {
          const p = path.replace(/\\/g, '/')
          return /\/src\/.*\.(ts|tsx|vue)$/.test(p)
        }
      }),
      AutoImport({
        dts: 'types/auto-imports.d.ts', // 生成配置文件，如果是ts项目，通常我们会把声明文件放在根目录/types中
        // 预设负责告诉插件应该自动引入哪些内容
        imports: [
          'vue' // 自动引入 Vue 的全局 API（ref/reactive/watch/onMounted 等）
        ]
      }),
      // 自动注册 Vue 组件。它允许你在 Vue 项目中自动引入和注册组件，而不需要手动导入每一个组件。
      Components({
        dirs: ['src/components'], // 配置需要默认导入的自定义组件文件夹，该文件夹下的所有组件都会自动 import
        // ★ 新增：Element Plus 组件按需自动导入
        resolvers: [ElementPlusResolver()]
      })
    ],
    // 引入全局scss文件
    css: {
      preprocessorOptions: {
        scss: {
          // 用 @use 代替 @import：Dart Sass 已弃用 @import（3.0 将移除），会打印弃用警告
          // @use ... as * 的效果与原来的 @import 一致：把 main.scss 的成员（变量/mixin）注入为全局可用
          additionalData: '@use "@/assets/css/main.scss" as *;',
          charset: false
        }
      }
    },
    // ******resolver配置******
    resolve: {
      // 配置路径别名
      alias: {
        // 如果报错__dirname找不到，需要安装node,执行 pnpm add -D @types/node
        '@': resolve(__dirname, 'src')
      }
    },
    // ******开发服务器配置******
    server: {
      host: 'localhost',
      // 设置服务启动端口号
      // ★ 本项目固定 8002（三个教学项目一起跑：toDoListSetup 8000 / studentRegisterSetup 8001 / 本项目 8002）
      port: 8002,
      // 设置服务启动时是否自动打开浏览器
      open: true,
      // 允许跨域
      cors: true,
      // 是否开启 https
      https: false,
      // 服务端渲染
      ssr: false

      // 反向代理（本项目走 MSW mock，不需要代理，保持注释）
      // proxy: {
      //   // 本地开发环境通过代理实现跨域
      //   // 正则表达式写法
      //   [env.VITE_APP_BASE_API]: {
      //     target: env.VITE_APP_BASE_URL, // 后端服务实际地址
      //     changeOrigin: true, // 开启代理
      //     ws: false,
      //     rewrite: (path) => path.replace(/^\/api/, '')
      //   }
      // }
    },
    // 生产构建时移除 console 与 debugger
    esbuild: mode === 'production' ? { drop: ['console', 'debugger'] } : {},
    // ******项目构建配置******
    build: {
      // 设置最终构建的浏览器兼容目标
      // 注意：原来的 'modules' 取值在 Vite 5 起已不再被 esbuild 接受，会导致构建失败
      // 这里显式写 es2020，与 tsconfig.json 的 target 保持一致
      target: 'es2020',
      // 构建得包名  默认：dist
      outDir: 'dist',
      // 静态资源得存放路径文件名  assets
      assetsDir: 'assets',
      // 构建后是否生成 source map 文件
      sourcemap: false,
      // chunk 大小警告的限制（以 kbs 为单位）默认：500
      chunkSizeWarningLimit: 500,
      // 防止 vite 将 rgba() 颜色转化为 #RGBA 十六进制符号的形式  (要兼容的场景是安卓微信中的 webview 时,它不支持 CSS 中的 #RGBA 十六进制颜色符号)
      cssTarget: 'chrome61',
      // css代码拆分,禁用则所有样式保存在一个css里面
      cssCodeSplit: true,
      // 项目压缩 :boolean | 'terser' | 'esbuild'
      // 这里用 esbuild：它是 Vite 内置的压缩器，无需额外安装 terser 依赖
      // 生产环境移除 console/debugger 由上面的 esbuild.drop 负责
      minify: 'esbuild',

      // 会打包出 css js 等文件夹 目录显得清晰
      rollupOptions: {
        output: {
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: '[ext]/[name]-[hash].[ext]',
          manualChunks(id) {
            // 最小化拆分包
            if (id.includes('node_modules')) {
              const parts = id.toString().split('node_modules/')[1].split('/')
              const pkg = parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0]
              // vue 包本身只是对 @vue/* 的再导出，单独拆出去会得到一个空 chunk
              // 这里把 vue 和 @vue/* 合并，避免 "Generated an empty chunk: vue" 警告
              if (pkg === 'vue' || pkg.startsWith('@vue/')) {
                return 'vue'
              }
              return pkg
            }
          }
        }
      }
    }
  }
})
