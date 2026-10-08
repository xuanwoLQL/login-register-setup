/**
 * vite-env.d.ts 是 Vite 项目中的类型声明文件。
 * 它的主要作用是为 TypeScript 提供一些全局类型声明，
 * 以便在开发过程中能够正确识别和处理 Vite 相关的模块和环境变量。
 */

// 这行代码告诉 TypeScript 编译器引入 Vite 客户端模块的类型声明
/// <reference types="vite/client" />

// 这个接口用于声明 Vite 环境变量的类型，这样在项目中就可以通过 import.meta.env.变量名 访问到这些环境变量了
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_BASE_API: string
  readonly VITE_APP_USE_MOCK: string
  readonly VITE_APP_TOKEN_KEY: string
}

// 这个接口用于声明 import.meta 的类型，这样在项目中就可以通过 import.meta.env 访问到 import.meta.env 了
interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // 注意：@typescript-eslint/ban-types 已在 v8 中移除，
  // 它原本负责的"禁止 {} 空对象类型"检查由 @typescript-eslint/no-empty-object-type 接手
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
  const component: DefineComponent<{}, {}, any>
  export default component
}
