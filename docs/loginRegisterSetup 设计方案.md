# loginRegisterSetup 设计方案

> 软件设计与开发课程教学演示项目 —— 用户登录与注册系统
> 日期：2026-09-22
> 系列第 3 个项目（前两个：`toDoListSetup`、`studentRegisterSetup`）

> ⚠ **本文档与《实现计划》冲突时，一律以计划为准。**
>
> 原因：本文档是**动手之前**写的设计，里面若干判断当时无法验证；
> [`2026-09-22-实现计划.md`](./2026-09-22-实现计划.md) 是**边做边测**的记录，
> 它的〈与设计文档的 5 处偏差〉一节列出了本文档被实测推翻的地方，
> 落实到代码后的最终结论也都在那里。
>
> 所以：读本文档时若发现某个说法和代码对不上（引用的文件路径、import 的字面量、
> 某个"回退方案"是否真的用过），**以代码和计划为准**。
> 本文档只在必要处做了定点订正，没有整体重写 —— 保留"设计当时的想法"
> 本身也是教学材料，但前提是不能让人照着它去找一个不存在的东西。

---

## 一、定位与边界

| 项 | 决定 |
|---|---|
| 项目名 | `loginRegisterSetup`（与 `toDoListSetup` / `studentRegisterSetup` 命名对称） |
| 端口 | **8002**（见下方说明：8001 不是前一个项目"配"的值） |
| 技术栈 | 沿用现有脚手架：Vue 3.5 + TypeScript + Vite 7 + SCSS + ESLint 10 + Prettier + auto-import |
| 新增运行时依赖 | `vue-router@4`、`axios`、`element-plus`、`@element-plus/icons-vue` |
| 新增开发依赖 | `msw` |
| 系列定位 | 前两个项目讲 **Vue 基础**（props/emit、表单、校验），本项目讲 **前后端交互 + 前端鉴权** |

**关于"端口 8001 归 studentRegisterSetup"这个说法（订正）**：
它**不准确**，本文档早期版本和 README 都这么写过。
实测 `../studentRegisterSetup/vite.config.ts:71` 是 `port: 8000` —— 和
`../toDoListSetup/vite.config.ts:71` 一模一样（三个项目共用同一套脚手架，这一项谁也没改），
而且两边都没设 `strictPort`。所以真实情况是：

- 两个项目**声明的是同一个端口 8000**；一起跑时 Vite 按"端口被占就顺延到下一个可用端口"
  的默认规则让它们错开：**先起来的拿 8000，后起来的顺延到 8001**
  （这条"顺延"规则已单独实测过：用本项目自己的配置起两个 dev server，
  第一个占住 8002 —— 它的声明端口；第二个声明同为 8002，
  实测监听的是 **8003**，说明 Vite 确实是往后**逐个**找可用端口，而不是报错退出）
- 只单独打开 `studentRegisterSetup` 时，它监听的就是 **8000**
  （已实测：在只运行它一个的情况下，`Get-NetTCPConnection -LocalPort 8000` 的
  OwningProcess 指向它的 vite 进程）
- 本项目固定 8002，三个一起跑才是 8000 / 8001 / 8002

教学上这一点值得讲：**端口不是"配"出来的，是"抢"出来的** ——
依赖 `strictPort` 缺失造成的顺延，就等于依赖一个隐式前提。

### 本项目要讲清楚的三件事

1. **前端怎么和后端说话** —— axios 实例、拦截器、接口分层
2. **没有后端时怎么开发** —— MSW 在网络层拦截请求，Network 面板能看到真实请求
3. **前端怎么知道"你登录了"** —— token 存储 + 路由守卫 + 401 处理

### 明确不做的事

- Pinia / Vuex（全局只有 token 和一个用户对象，`utils/auth.ts` 足够）
- 权限路由 / 动态路由（按角色生成路由表，属于下一门课）
- 多级侧边栏菜单布局
- 单元测试（与前两个项目保持一致，用 `pnpm build` + `pnpm lint` + 手动验收清单代替）
- 真实的 JWT 签名与密码加密（本项目是纯前端 mock，**必须向学生强调这一点**）

---

## 二、技术选型与理由

### 2.1 为什么 vue-router 用 4.6.4 而不是 5.3.1

官方文档确认 vue-router 5 对 v4 用户**无破坏性变更**（它主要把 `unplugin-vue-router` 的文件式路由并入了核心）。但本项目仍选 **v4.6.4**：

- 中文教材、网上教程、AI 问答几乎全是 v4 写法，学生课后查资料能直接对上
- v4 → v5 API 完全一致，将来升级是一条命令的事，没有锁定风险
- 教学项目优先"可检索性"而不是"版本号最新"

### 2.2 为什么用 Element Plus

- `2.14.6`，持续维护，中文文档最全，学生自学阻力最小
- 自带 `async-validator`，`el-form` 的 `rules` 校验可直接当作一个独立知识点讲
- 脚手架里已有 `unplugin-vue-components`，配 `ElementPlusResolver` 即可按需自动导入，**不需要新增构建插件**

### 2.3 为什么用 MSW 而不是别的 mock 方案

| 方案 | 真实 HTTP 请求 | 风险 | 结论 |
|---|---|---|---|
| **MSW 2.15** | ✅ Service Worker 网络层拦截，Network 面板可见 | 需多一个 worker 文件 + main.ts 改异步 | **采用** |
| vite-plugin-mock-dev-server | ✅ dev server 中间件 | 依赖较新，与 Vite 7 兼容性需实测 | 备用 |
| 手写 axios adapter | ❌ 面板里什么都看不到 | 无 | 不采用，"假"得太明显 |
| json-server | ✅ 真后端 | 要跑两个进程，学生环境易出错 | 不采用 |

选 MSW 的关键理由：**它不修改 axios 代码**。学生写的 `axios.post('/api/login', ...)` 与接真实后端时**一字不差**，将来把 MSW 关掉、接上真后端，业务代码零改动。这是最好的教学示范。

### 2.4 不引入 Pinia 的理由

全局状态只有 `token` 和 `user` 两个值，`utils/auth.ts` 读写 localStorage 就够了。
这本身是一个教学点：**先搞清楚"为什么需要状态管理"，再引入状态管理**。
引入 Pinia 会让本项目概念陡增，而学生还没体会到痛点。

---

## 三、目录结构

```
loginRegisterSetup/
├─ public/
│  └─ mockServiceWorker.js          ← npx msw init public/ --save 生成，不要手改
├─ src/
│  ├─ api/
│  │   ├─ request.ts                ★ axios 实例 + 请求/响应拦截器（本项目核心教具）
│  │   └─ user.ts                   ← 接口收拢：login / register / getUserInfo / logout
│  ├─ mocks/
│  │   ├─ handlers.ts               ★ MSW 请求处理器 + 用户表
│  │   └─ browser.ts                ← setupWorker
│  ├─ router/
│  │   ├─ index.ts                  ← 路由表 + 全局守卫注册
│  │   └─ guard.ts                  ★ 全局前置守卫（登录拦截）
│  ├─ utils/
│  │   └─ auth.ts                   ← token 与用户信息的读写
│  ├─ types/
│  │   └─ user.ts                   ← User / StoredUser / LoginForm / RegisterForm
│  │                                   / RegisterPayload / ApiResult&lt;T&gt;
│  ├─ layouts/
│  │   └─ AuthLayout.vue            ← 登录/注册共用外壳（左品牌区 + 右表单卡片）
│  ├─ views/
│  │   ├─ LoginView.vue
│  │   ├─ RegisterView.vue
│  │   ├─ HomeView.vue              ← 登录后的落地页
│  │   └─ NotFoundView.vue
│  ├─ assets/css/main.scss          ← 抄，本文件本身不改（它是 additionalData 注入的 SCSS 变量）
│  ├─ assets/css/element-theme.css  ← 新增：Element Plus 主题色 CSS 变量覆盖
│  │                                   （订正：早期版本写的是"变量放在 main.scss"，
│  │                                    main.scss 会被注入进每一个 SCSS 块，
│  │                                    规则会重复几十遍 —— 见计划〈与设计文档的 5 处偏差〉第 1 条）
│  ├─ App.vue                       ← 精简成只剩 <el-config-provider><RouterView /></...>
│  ├─ main.ts                       ← 改为异步：先起 MSW 再 mount
│  ├─ style.css                     ← 抄
│  └─ vite-env.d.ts                 ← 抄
├─ docs/loginRegisterSetup 设计方案.md   ← 本文件
├─ index.html                       ← 抄，改标题
├─ vite.config.ts                   ← 抄，端口改 8002 + 加 ElementPlusResolver
├─ package.json                     ← 抄，加 4 个依赖
├─ tsconfig.json / tsconfig.node.json        ← 抄
├─ eslint.config.js / .prettierrc / .prettierignore / .gitignore   ← 抄
├─ .env / .env.development / .env.production ← 抄，改接口前缀 + 加 mock 开关
├─ .vscode/                         ← 抄
└─ README.md                        ← 新写：知识点对照表 + 运行说明 + 验收清单
```

**为什么有 `layouts/` 和 `views/` 的区分**：`layouts` 是"外壳"（多个页面共享的框架），`views` 是"页面"（一个路由对应一个）。
登录页和注册页共享同一个左右分栏外壳，只是右侧卡片里的表单不同 —— 这正是**嵌套路由**要解决的问题。

---

## 四、路由设计

### 4.1 路由表

```ts
// src/router/index.ts
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: AuthLayout,
    children: [
      { path: '', redirect: '/login' },
      {
        path: 'login',
        name: 'login',
        component: () => import('@/views/LoginView.vue'),
        meta: { title: '登录', guestOnly: true }
      },
      {
        path: 'register',
        name: 'register',
        component: () => import('@/views/RegisterView.vue'),
        meta: { title: '注册', guestOnly: true }
      }
    ]
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: '首页', requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'notFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: '页面不存在' }
  }
]
```

要点：

- `/login` 与 `/register` 是 `AuthLayout` 的**子路由**，路径不写前导斜杠 —— 嵌套路由的知识点
- `meta.requiresAuth` / `meta.guestOnly` 是**自定义路由元信息**，守卫靠它做判断
- `/:pathMatch(.*)*` 是 vue-router 4 的 404 通配写法（v3 的 `*` 已废弃）
- 所有页面组件用**路由懒加载** `() => import(...)`，构建后自动分包
- `redirect` 放在 `children` 里而不是单独一条 `/` 路由，避免出现两条同 path 的记录

### 4.2 全局前置守卫

```ts
// src/router/guard.ts
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
```

**三个必须讲清楚的点：**

1. 守卫里**返回 `false` 或一个路由地址**就是"拦截"，返回 `true` / `undefined` 是"放行"。这是 vue-router 4 的新写法（v3 要调 `next()`）。
2. 拦截时把 `to.fullPath` 塞进 `query.redirect`，登录成功后就能**回到用户原本想去的页面** —— 这是真实产品的标准做法，学生第一次见到会很兴奋。
3. `beforeEach` 必须在 `router` 实例创建后、`app.use(router)` 之前调用。

### 4.3 登录成功后的跳转

```ts
// LoginView.vue
const redirect = (route.query.redirect as string) || '/home'
router.replace(redirect)
```

用 `replace` 而不是 `push`：避免用户点浏览器"后退"又回到登录页。

### 4.4 动态标题

```ts
router.afterEach((to) => {
  const base = import.meta.env.VITE_APP_TITLE
  document.title = to.meta.title ? `${to.meta.title} · ${base}` : base
})
```

---

## 五、鉴权闭环与数据流

```
浏览器打开 /
 └─ 守卫：无 token，且 / 重定向到 /login
      │
      ▼
 ┌─────────────────┐        ┌──────────────────┐
 │  /login         │        │  /register       │
 │  LoginView.vue  │        │  RegisterView.vue│
 └────────┬────────┘        └────────┬─────────┘
          │  el-form rules 校验        │  el-form rules 校验
          │  + 自定义校验器（确认密码） │
          └───────────┬───────────────┘
                      ▼
              api/user.ts  login(form) / register(form)
                      ▼
        ┌─────────────────────────────────────────┐
        │  axios 实例 (baseURL=/api, timeout=10s) │
        │  ★ 请求拦截器：从 localStorage 取 token  │
        │               写入 Authorization 头      │
        └──────────────────┬──────────────────────┘
                           ▼
        ┌─────────────────────────────────────────┐
        │  ★ MSW Service Worker 在网络层拦截       │
        │    POST /api/login → handlers.ts        │
        │    查用户表 → 返回 { code, message, data }│
        └──────────────────┬──────────────────────┘
                           ▼
        ┌─────────────────────────────────────────┐
        │  ★ 响应拦截器                            │
        │    code === 200 → 直接返回 data（解包）   │
        │    code === 401 → 清 token + 跳 /login   │
        │    code 其他    → ElMessage.error + reject│
        └──────────────────┬──────────────────────┘
                           ▼
              写 token / user 到 localStorage
                           ▼
              router.replace(redirect || '/home')
                           ▼
        ┌─────────────────────────────────────────┐
        │  /home  HomeView.vue                    │
        │  守卫放行 → getUserInfo() 拉用户信息      │
        │  [退出登录] → logout() + 清 token + 跳登录│
        └─────────────────────────────────────────┘
```

### token 的生命周期

| 阶段 | 动作 | 位置 |
|---|---|---|
| 登录成功 | `setToken(res.token)` 写入 localStorage | `LoginView.vue` |
| 后续每次请求 | 请求拦截器自动带上 `Authorization: Bearer <token>` | `api/request.ts` |
| 刷新页面 | 从 localStorage / sessionStorage 读回，守卫放行，用户不掉线 | `utils/auth.ts` |
| 收到 401 | 清空 token + 跳登录页 | `api/request.ts` 响应拦截器 |
| 主动退出 | 调 `logout()` 接口 + 清 token + 跳登录页 | `HomeView.vue` |

---

## 六、接口契约

统一响应格式（模仿真实后端）：

```ts
interface ApiResult<T = unknown> {
  code: number      // 200 成功；其余为业务错误码
  message: string
  data: T | null
}
```

| 接口 | 方法 | 请求 | 成功 | 失败 |
|---|---|---|---|---|
| `/api/login` | POST | `{ username, password }` | `200` `{ token, user }` | `400` 用户名或密码错误 |
| `/api/register` | POST | `{ username, password, nickname, email }` | `200` `{ id, username }` | `409` 用户名已被占用 |
| `/api/user/info` | GET | 请求头带 `Authorization` | `200` `User` | `401` 登录已过期 |
| `/api/logout` | POST | — | `200` `null` | — |

### 表单模型 ≠ 提交模型（重要教学点）

```ts
// src/types/user.ts
export interface RegisterForm {
  username: string
  password: string
  confirmPassword: string   // ← 只在前端用，不发给后端
  nickname: string
  email: string
}

// 提交给后端的字段：去掉 confirmPassword
export type RegisterPayload = Omit<RegisterForm, 'confirmPassword'>
```

`confirmPassword` 是**纯前端校验**字段，真实后端不需要它。
这与 `studentRegisterSetup` 里 `StudentForm = Omit<Student, 'id'>` 是同一个手法，学生能形成呼应。

---

## 七、关键实现细节

### 7.1 `api/request.ts` —— 全项目的枢纽

```ts
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
    ElMessage.error(
      error.code === 'ECONNABORTED' ? '请求超时，请稍后重试' : '网络异常，请稍后重试'
    )
    return Promise.reject(error)
  }
)

/**
 * 类型安全的请求入口。
 * 响应拦截器已经把 AxiosResponse 拆成了 data，但 axios 的类型签名不知道这件事，
 * 所以这里用 axios 自带的第二个泛型参数 R 把返回类型"改"成 Promise<T>。
 */
export function request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  return service.request<unknown, T>(config)
}

export default service
```

**课堂必须讲的坑：拦截器解包之后，类型对不上了。**

响应拦截器 `return res.data` 之后，运行时拿到的是业务数据，但 axios 的类型签名仍然说返回 `AxiosResponse`。
直接用 `service.get<User>()` 会得到一个"类型说是 AxiosResponse、实际是 User"的假象，学生一定会在这里踩坑。

解法是 axios 的 `request<T, R>` 签名里的第二个泛型 `R`（默认 `AxiosResponse<T>`）：

```ts
service.request<unknown, User>(config)  // → Promise<User>
```

我们把它包成 `request<T>()` 一个函数，视图层就永远不用碰 axios 的类型问题了。

### 7.2 `api/user.ts` —— 接口收拢

```ts
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
```

**为什么要有这一层**：视图组件里永远不出现 `axios` 和 URL 字符串。
将来接口地址变了、要加缓存、要换请求库，只改这一个文件。这就是"关注点分离"最直观的例子。

### 7.3 `mocks/handlers.ts` —— MSW 请求处理器

```ts
import { http, HttpResponse, delay } from 'msw'
import type { ApiResult, StoredUser } from '@/types/user'

const USERS_KEY = 'lrs_mock_users'

// 预置测试账号
const PRESET: StoredUser[] = [
  { id: 1, username: 'admin',   password: '123456', nickname: '管理员', role: 'admin',  email: 'admin@demo.com' },
  { id: 2, username: 'student', password: '123456', nickname: '同学',   role: 'user',   email: 'student@demo.com' }
]

/** 用户表：localStorage 持久化，刷新页面后已注册的账号仍可登录 */
function loadUsers(): StoredUser[] { /* 读 localStorage，为空则写入 PRESET */ }
function saveUsers(users: StoredUser[]) { /* 写回 localStorage */ }

/** 极简 token：mock-token-<username>。真实项目里这是签过名的 JWT */
const makeToken = (username: string) => `mock-token-${username}`
const parseToken = (raw: string | null) => raw?.replace('Bearer ', '').replace('mock-token-', '') ?? ''
```

各处理器的行为：

| 处理器 | 逻辑 |
|---|---|
| `POST /api/login` | `await delay(400)` 制造真实延迟；查表比对密码；成功返回 `{ token, user }`，失败 `code: 400` |
| `POST /api/register` | 用户名已存在 → `code: 409`；否则分配 id、写入用户表，返回新用户 |
| `GET /api/user/info` | 从 `Authorization` 头解析用户名；解析不出 → `code: 401` |
| `POST /api/logout` | 直接返回成功（mock 不需要真的作废 token） |

**两个关键设计：**

1. **`await delay(400)`**：不加延迟，`el-button` 的 `:loading` 状态一闪而过，学生根本看不到。加了延迟，异步提交的 loading 才有演示效果。这是 MSW 相对手写 mock 的明显优势。
2. **用户表落 localStorage 而不是纯内存**：纯内存表在硬刷新后会重置，学生注册完一刷新就登录不上，会以为项目坏了。落 localStorage 后行为接近真后端。README 里要写清楚"清空浏览器存储即可恢复到预置的两个测试账号"。

> ⚠️ **必须对学生强调的安全边界**：这套 mock 把密码明文存在 localStorage 里，
> 真实项目里密码**绝不能**在前端存储或以明文传输（要靠 HTTPS + 后端加盐哈希）。
> 本项目只是为了演示前端流程，不要照搬到生产环境。

### 7.4 `src/mocks/browser.ts`

```ts
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
```

> 订正：原设计里写的是 `quiet: false // 打印 [MSW] Mocking enabled 提示`。
> 最终实现**没有**写 `quiet` 这一项，而是自己打一行日志（文字见上）。
>
> 实测两者的可观察差别（用 Playwright 打开页面读控制台）：
> **`[MSW] Mocking enabled` 照样会出现** —— `quiet` 的默认值本来就是 `false`，
> 所以原设计里"靠 `quiet: false` 才能打印这句提示"的说法本身就不成立，
> 那一项是多余的。最终实现是在这行之外**再**打一句本项目自己的中文日志，
> 两句都会出现在控制台里。
>
> 顺带：那句中文日志的文案是 `[mock] MSW 已启动，/api/* 的请求都会被拦截`，
> 和上面那段代码块下面的注释逐字一致 —— 这属于"引用的字面量必须能在代码里 grep 到"。

### 7.5 `src/main.ts` —— 先起 mock，再挂载

```ts
import { createApp } from 'vue'
import './style.css'
// ★ 订正：不要引 theme-chalk 下的单个 .css 文件，要引组件的 style 入口。
//   理由见下方"为什么 ElMessage 的样式要单独引"，这是实测踩出来的。
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import './assets/css/element-theme.css'
import App from './App.vue'
import router from './router'

async function bootstrap() {
  // 仅在开发环境、且开关打开时启用 mock
  if (import.meta.env.DEV && import.meta.env.VITE_APP_USE_MOCK === 'true') {
    // 实际实现里这两行还包在 try/catch 中：MSW 启动失败时不能让 mount 被跳过，
    // 否则学生看到的是一片白屏，而不是"应用正常、只是接口没被拦截"。
    const { startMockServer } = await import('@/mocks/browser')
    await startMockServer()
  }

  createApp(App).use(router).mount('#app')
}

bootstrap()
```

> 订正：上面这段里**没有** `console.log('[mock] 已启用 MSW 模拟后端')`。
> 最终实现的日志在 `startMockServer()` 里面，文字是
> `console.log('[mock] MSW 已启动，/api/* 的请求都会被拦截')`
> —— 位置和文字都和这里原来设想的不一样。照抄这句会让学生"按注释去找控制台里的一行字"
> 却找不到，属于本文件反复出现的那类错误。

**为什么 `ElMessage` 的样式要单独引？**

`ElementPlusResolver` 只能给**模板里用到的组件**（`<el-button>` 这种）自动导入 JS 和 CSS。
而 `ElMessage` / `ElMessageBox` 是**函数式调用的**，模板里根本没有标签，解析器看不到它们，样式不会被引入 ——
表现是"弹出来的提示框没有样式，白底黑字贴在最下面"。

这是个经典坑，也是非常好的教学点：**按需导入不是零成本，它有明确的边界。**

> ★ **2026-09-22 订正（原"回退方案"作废）**：本节原来写着
> "若仍有缺失，回退方案是在 `main.ts` 里全量引入 `element-plus/dist/index.css`"。
> 实测结论是：**这个回退方案从来不需要，而且会掩盖真正的问题。**
>
> 缺的样式不是"引少了"，而是**引错了文件**。一开始引的是
> `element-plus/theme-chalk/el-message-box.css`，弹窗的圆角、阴影、按钮颜色全都正常，
> **唯独背后没有遮罩、背景不变暗** —— 因为遮罩规则 `.el-overlay` 那条基础规则
> 只存在于 `theme-chalk/el-overlay.css`，`el-message-box.css` 里只有
> `.el-overlay-message-box` 之类的复合选择器，没有裸的 `.el-overlay{...}`。
> （提醒：别把这件事说成"那个文件里一行都没有"，学生一 grep 就会发现
>  `.el-overlay-message-box` 确实在里面 —— 断言要经得起他亲手验证。）
>
> 改成引组件的 **style 入口** 就自动解决了：
> `node_modules/element-plus/es/components/message-box/style/css.mjs` 里本来就
> 额外引了 `base` / `input` / `button` / `overlay` 四个 style 入口，
> 其中 `overlay` 正是带来 `.el-overlay` 的那一个。
> 所以**只引 `el-message-box.css` 一个文件永远补不上遮罩，全量引 `index.css` 则是用
> 整包 CSS 去掩盖一个"引错入口"的错误** —— 后者既没解决问题，代价也更大。

### 7.6 Element Plus 主题色定制（低成本美观）

不引入 SCSS 变量覆盖那套构建配置，直接在全局样式里覆盖 Element Plus 的 CSS 变量 —— 简单、可读、学生能看懂：

```css
/* src/assets/css/element-theme.css —— 订正：不是 main.scss，见下 */
html:root {
  --el-color-primary: #4f46e5;
  --el-color-primary-light-3: #7b74ec;
  --el-color-primary-light-5: #a5a0f2;
  --el-color-primary-light-7: #ceccf8;
  --el-color-primary-light-8: #e0dffb;
  --el-color-primary-light-9: #f0effd;
  --el-color-primary-dark-2: #3f38b7;
  --el-border-radius-base: 8px;
}
```

> **订正**（两处，均已按实际实现改）：
>
> 1. 这一段**不在 `main.scss` 里**，在 `src/assets/css/element-theme.css`。
>    `main.scss` 是 vite 的 `additionalData` 注入到**每一个 SCSS 块**里的，
>    把 `:root {...}` 放进去会让同一条规则在产物里重复几十遍。
>    详见计划〈与设计文档的 5 处偏差〉第 1 条。
> 2. 选择器是 `html:root` 而不是 `:root`。CSS 自定义属性的覆盖规则是
>    "同优先级下后出现的赢"，而我们的样式和 Element Plus 的样式谁先谁后
>    取决于打包时的 CSS 顺序 —— 那个顺序很容易被一次 import 调整打破。
>    `html:root` 多一个元素选择器、优先级更高，无论加载顺序如何都能稳定覆盖。
>    （实测产物：`dist/css/index-*.css` 里就是 `html:root{...}`。）

> 只覆盖 `--el-color-primary` 是不够的 —— Element Plus 的 hover / disabled / 浅色背景
> 用的是 `light-3` 到 `light-9` 这一串派生色，不一起覆盖会出现"按钮 hover 时颜色突变"的廉价感。

### 7.7 表单校验

`el-form` 的 `rules` 走 Element Plus 内置的 `async-validator`，与 `studentRegisterSetup` 的手写 `validate.ts` 形成对比：

```vue
<el-form ref="formRef" :model="form" :rules="rules" @submit.prevent>
  <el-form-item prop="username">
    <el-input v-model="form.username" placeholder="请输入用户名" :prefix-icon="User" clearable />
  </el-form-item>
  ...
</el-form>
```

图标要显式引入 —— Element Plus 的图标是**独立的包** `@element-plus/icons-vue`，不随组件自动导入：

```ts
import { User, Lock } from '@element-plus/icons-vue'
import type { FormRules } from 'element-plus'
```

校验规则：

```ts
const rules: FormRules<LoginForm> = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 16, message: '用户名需 3 ~ 16 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { pattern: /^\S{6,20}$/, message: '密码需 6 ~ 20 位且不含空格', trigger: 'blur' }
  ]
}
```

注册页多一个**自定义校验器**（确认密码必须与密码一致）：

```ts
const confirmValidator = (_rule: unknown, value: string, callback: (e?: Error) => void) => {
  if (value !== form.password) callback(new Error('两次输入的密码不一致'))
  else callback()
}
```

注册页还需在 `password` 变化时 **手动重校验 `confirmPassword`**，否则用户先填确认密码、再改密码，确认框的错误提示不会自动消失。这是个真实的易错点。

提交统一走：

```ts
async function onSubmit() {
  const ok = await formRef.value?.validate().catch(() => false)  // 校验不过会 reject
  if (!ok) return
  submitting.value = true
  try {
    await login({ ...form })
    ElMessage.success('登录成功')
    router.replace(redirect)
  } finally {
    submitting.value = false      // 成功跳走了也要复位，防止返回时按钮还是 loading
  }
}
```

### 7.8 App.vue

```vue
<template>
  <el-config-provider :locale="zhCn" :z-index="3000">
    <RouterView />
  </el-config-provider>
</template>

<script setup lang="ts">
import zhCn from 'element-plus/es/locale/lang/zh-cn'
</script>
```

`ElConfigProvider` 负责把 Element Plus 的内置文案（分页、空状态、日期选择器等）切成中文。
不包这一层，`el-table` 的空状态会显示英文 "No Data"。

---

## 八、页面设计

### 8.1 AuthLayout.vue（登录 / 注册共用外壳）

```
┌───────────────────────────────────────────────────────────────┐
│  左侧品牌区 (flex: 1，渐变背景)    │   右侧表单区 (固定 480px)   │
│                                    │                            │
│    ◆  软件设计与开发                │   ┌──────────────────────┐ │
│                                    │   │  欢迎回来             │ │
│    「把 Vue 学明白」                │   │  请登录你的账号        │ │
│                                    │   │                      │ │
│    · 前后端交互全流程               │   │  用户名 [__________]  │ │
│    · 路由守卫与前端鉴权             │   │  密码   [__________]  │ │
│    · 网络层 Mock 数据               │   │                      │ │
│                                    │   │  [     登  录     ]  │ │
│    （纯 CSS 装饰：                  │   │                      │ │
│      渐变 + 两团径向光斑）           │   │  没有账号？去注册 →   │ │
│                                    │   └──────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
窄屏 (< 900px)：隐藏左侧品牌区，右侧卡片居中并占满宽度
```

- 左侧装饰**全部用 CSS 实现**（一层 `linear-gradient` 渐变 + 两团 `radial-gradient` 光斑），**不引入任何图片资源** —— 避免图片路径 / 打包 / 版权问题
- 右侧插槽：登录页和注册页各自的内容通过 `<slot />` 塞进来
- 注册页内容更高，右侧区域允许纵向滚动

### 8.2 LoginView.vue

- `el-form` + `el-input`（用户名带 `User` 图标、密码带 `Lock` 图标 + `show-password`）
- 「记住我」`el-checkbox`：勾选写 `localStorage`（关浏览器仍在），不勾写 `sessionStorage`（关标签页即失效）。
  `utils/auth.ts` 的 `setToken(token, remember)` 决定写哪个存储，`getToken()` 则两个存储都读
- 主按钮 `el-button type="primary"` 全宽，`:loading="submitting"`
- 底部一行：`还没有账号？<RouterLink to="/register">立即注册</RouterLink>`
- **测试账号提示条**：用 `el-alert` 明示 `admin / 123456`，学生不用翻 README 就能登录

### 8.3 RegisterView.vue

- 字段：用户名、密码、确认密码、昵称、邮箱
- 「确认密码」用自定义校验器
- 注册成功 → `ElMessage.success` → `router.push({ name: 'login', query: { username } })`
- 登录页读 `route.query.username` **自动回填用户名**，形成完整的交互闭环

### 8.4 HomeView.vue

```
┌────────────────────────────────────────────────────┐
│  Header：◆ 系统名            [头像] 用户名  ▾       │  ← 下拉菜单含「退出登录」
├────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────┐  │
│  │  el-card  账号信息                            │  │
│  │  el-descriptions：用户名 / 昵称 / 邮箱 / 角色  │  │
│  └──────────────────────────────────────────────┘  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐      │
│  │ el-statistic│ │ el-statistic│ │ el-statistic│    │
│  └────────────┘ └────────────┘ └────────────┘      │
│  ┌──────────────────────────────────────────────┐  │
│  │  el-table  课程项目列表（静态演示数据）        │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

目的是让"登录"有一个看得见的去处，同时集中展示一批 Element Plus 组件。
表格数据用本地静态常量，不再走接口 —— 本项目的主角是鉴权，不是列表 CRUD。

退出登录用 `ElMessageBox.confirm` 二次确认，再调 `logout()` 接口、清 token、跳登录页。

---

## 九、知识点 → 代码位置 对照表

可直接当讲义目录使用。

| # | 知识点 | 文件 | 关键代码 |
|---|---|---|---|
| 1 | 路由表 / 命名路由 | `router/index.ts` | `{ path: 'login', name: 'login', component: ... }` |
| 2 | **嵌套路由**（共享布局） | `router/index.ts` | `AuthLayout` + `children: [...]` |
| 3 | 路由懒加载 | `router/index.ts` | `component: () => import('@/views/LoginView.vue')` |
| 4 | 重定向 | `router/index.ts` | `{ path: '', redirect: '/login' }` |
| 5 | 404 通配路由 | `router/index.ts` | `/:pathMatch(.*)*` |
| 6 | **路由元信息 meta** | `router/index.ts` | `meta: { requiresAuth: true }` |
| 7 | `<RouterView>` / `<RouterLink>` | `App.vue`、`AuthLayout.vue` | — |
| 8 | **全局前置守卫** | `router/guard.ts` | `router.beforeEach((to) => { ... })` |
| 9 | 守卫返回值语义 | `router/guard.ts` | 返回路由地址即拦截，返回 `true` 即放行 |
| 10 | 全局后置钩子 | `router/index.ts` | `router.afterEach` 改 `document.title` |
| 11 | **编程式导航** | `LoginView.vue` | `router.replace(redirect)` |
| 12 | 路由参数 `query` | `LoginView.vue` | `route.query.redirect` / `route.query.username` |
| 13 | **axios 实例与 baseURL / timeout** | `api/request.ts` | `axios.create({ baseURL, timeout })` |
| 14 | **请求拦截器** | `api/request.ts` | `service.interceptors.request.use(...)` |
| 15 | **响应拦截器** | `api/request.ts` | `service.interceptors.response.use(...)` |
| 16 | **拦截器解包后的类型问题** | `api/request.ts` | `service.request<unknown, T>(config)` |
| 17 | 接口分层（视图不碰 axios） | `api/user.ts` | `export const login = (data) => request<...>({...})` |
| 18 | axios 错误处理 | `api/request.ts` | `error.code === 'ECONNABORTED'` 判超时 |
| 19 | **MSW 网络层拦截** | `mocks/handlers.ts` | `http.post('/api/login', ...)` |
| 20 | 模拟网络延迟 | `mocks/handlers.ts` | `await delay(400)` |
| 21 | 请求头读取 | `mocks/handlers.ts` | `request.headers.get('Authorization')` |
| 22 | **环境变量控制开关** | `main.ts` + `.env` | `import.meta.env.VITE_APP_USE_MOCK` |
| 23 | 动态 `import()` 条件加载 | `main.ts` | `await import('@/mocks/browser')` |
| 24 | 异步启动应用 | `main.ts` | `async function bootstrap()` |
| 25 | Element Plus 按需自动导入 | `vite.config.ts` | `ElementPlusResolver()` |
| 26 | 函数式组件的样式边界 | `main.ts` | `import 'element-plus/es/components/message/style/css'` |
| 27 | 主题色 CSS 变量覆盖 | `assets/css/element-theme.css` | `--el-color-primary: ...`（选择器是 `html:root`） |
| 28 | 组件中文化 | `App.vue` | `<el-config-provider :locale="zhCn">` |
| 29 | **`el-form` 的 model / rules / ref** | `LoginView.vue` | `formRef.value.validate()` |
| 30 | 自定义校验器 | `RegisterView.vue` | `confirmValidator` |
| 31 | 跨字段联动重校验 | `RegisterView.vue` | `password` 变化时重校验 `confirmPassword` |
| 32 | 异步提交的 loading 态 | 两个表单 | `:loading="submitting"` |
| 33 | `ElMessage` / `ElMessageBox` | 多处 | `ElMessageBox.confirm(...)` |
| 34 | **表单模型 vs 提交模型** | `types/user.ts` | `Omit<RegisterForm, 'confirmPassword'>` |
| 35 | `localStorage` 读写与封装 | `utils/auth.ts` | `getToken / setToken / clearAuth` |
| 36 | 异步组件的 `await` 顺序 | `main.ts` | 先起 mock 再 mount |

---

## 十、环境变量

```bash
# .env（所有模式都加载）
VITE_APP_TITLE='登录注册系统演示'

# .env.development
VITE_APP_BASE_API='/api'          # 接口前缀（注意有前导斜杠）
VITE_APP_USE_MOCK='true'          # 开发环境启用 MSW
VITE_APP_TOKEN_KEY='lrs_token'    # localStorage 键名

# .env.production
VITE_APP_BASE_API='/api'
VITE_APP_USE_MOCK='false'         # 生产构建绝不打包 mock
VITE_APP_TOKEN_KEY='lrs_token'
```

与现有脚手架 `.env` 的差异说明：原文件里 `VITE_APP_BASE_API='api'`（无前导斜杠）和
`VITE_APP_BASE_URL='http://127.0.0.1:8000/'` 是为被注释掉的反向代理准备的。
本项目走 MSW，不需要代理，接口前缀改成 `/api`，
这样 axios 发出的请求是 `http://localhost:8002/api/login`，
MSW 的 `http.post('/api/login', ...)` 能正确匹配。

---

## 十一、验证方式

与前两个项目保持一致：**不写单元测试**。验证手段：

1. **`pnpm build`** —— 内含 `vue-tsc --noEmit`，TypeScript 类型检查必须全过
2. **`pnpm lint`** —— ESLint 必须零错误
3. **Playwright 实测** —— 逐条跑下面的验收清单，并截图存档
4. **浏览器控制台** —— 全程无 error / warning

### 验收清单

**路由与守卫**
- [ ] 直接访问 `/home`（未登录）→ 被重定向到 `/login?redirect=/home`
- [ ] 未登录访问 `/` → 重定向到 `/login`
- [ ] 访问不存在的路径 `/xxx` → 显示 404 页面
- [ ] 登录后访问 `/login` → 被重定向到 `/home`
- [ ] 登录成功后跳回 `/home`（即 `redirect` 参数生效）
- [ ] 切换页面时浏览器标签标题跟着变

**登录**
- [ ] 空表单提交 → 两条校验错误同时显示
- [ ] 用户名填 `ab` → 提示"用户名需 3 ~ 16 个字符"
- [ ] 密码填 `123` → 提示"密码需 6 ~ 20 位且不含空格"
- [ ] `admin` + 错误密码 → 顶部弹出红色错误提示，**不跳转**
- [ ] `admin` / `123456` → 按钮进入 loading，约 400ms 后提示成功并跳转 `/home`
- [ ] Network 面板能看到真实的 `POST /api/login` 请求，状态 200
- [ ] 提示条上的测试账号可用

**注册**
- [ ] 两次密码不一致 → 提示"两次输入的密码不一致"
- [ ] 用户名填已存在的 `admin` → 提示"用户名已被占用"
- [ ] 注册成功后跳到 `/login` 且**用户名已自动回填**
- [ ] 用刚注册的账号能登录成功
- [ ] 刷新页面后，刚注册的账号**仍然**能登录（localStorage 持久化生效）
- [ ] 清空浏览器存储后，只剩 `admin` / `student` 两个预置账号

**登录态**
- [ ] 登录后刷新页面 → 仍在 `/home`，不掉线
- [ ] 登录后请求头里带 `Authorization: Bearer mock-token-admin`（Network 面板可验）
- [ ] 点"退出登录" → 有二次确认弹窗 → 确认后回到 `/login`
- [ ] 退出后直接访问 `/home` → 被守卫打回登录页

**样式与响应式**
- [ ] 主色是自定义的靛蓝 `#4f46e5`，**不是** Element Plus 默认的 `#409eff`
- [ ] 按钮 hover 时颜色平滑过渡，无突变
- [ ] `ElMessage` / `ElMessageBox` 弹出时**样式完整**（圆角、图标都在；`ElMessageBox` 还有阴影）
      > ⚠ **这一条原来写的是"圆角、阴影、图标都在"，那个"阴影"是错的，已删。**
      > `ElMessage` 本来就**没有**阴影，验收时不要去找它：
      > Element Plus 2.14.6 的 `theme-chalk/el-message.css` 里 `box-shadow` **只出现一次**，
      > 挂在 `.el-message.is-plain` 上，基础 `.el-message` 规则里没有。
      > 本项目 `src/` 下**没有任何一处**传 `plain: true`，所以弹出的提示条是
      > 「有圆角、有类型图标、**无阴影**」—— 这是组件的既定行为，不是样式没引全。
      > （复核命令，两条都能当场跑：
      > `grep -o 'box-shadow[^;}]*' node_modules/element-plus/theme-chalk/el-message.css`
      > 只回一行 `box-shadow:var(--el-box-shadow-light)`；
      > `grep -oE '\.el-message[a-z.-]*\{[^}]*box-shadow[^}]*\}' …/el-message.css`
      > 显示带阴影的选择器只有 `.el-message.is-plain` 一个。）
      > 另外注意区分：`ElMessageBox` 是**有**阴影的 —— `.el-message-box` 自带
      > `box-shadow: var(--el-messagebox-box-shadow)`，它那一条可以照常验收。
- [ ] `el-table` 空状态显示中文
- [ ] 窗口宽度 < 900px → 左侧品牌区隐藏，表单卡片居中
- [ ] 登录页 / 注册页 / 首页在 1440px 下无横向滚动条

---

## 十二、与前面两个项目的对比教学点

| 对比项 | `toDoListSetup` | `studentRegisterSetup` | `loginRegisterSetup` |
|---|---|---|---|
| 端口 | 8000 | 8000（8000 被占时顺延 8001） | **8002** |
| 路由 | 无 | 无 | **vue-router 4 + 守卫** |
| 组件通信 | `mitt` 事件总线 | props / emit 状态提升 | 路由 + 接口，**不再需要跨组件传数据** |
| 数据来源 | 组件内 `ref` | `App.vue` 单一数据源 | **后端接口（MSW 模拟）** |
| 表单校验 | 无 | 手写 `validate.ts` | **Element Plus `rules` + 自定义校验器** |
| UI | 手写 CSS | 手写 CSS | **Element Plus 组件库** |
| 持久化 | 无 | 无 | **localStorage 存 token** |
| 新概念数量 | 少 | 中 | **多（路由 / 拦截器 / mock / 组件库）** |

**课堂结论**：三个项目是**同一条主线的三个阶段**。

- `toDoListSetup` 教会「数据放在哪」——事件总线 vs 状态提升
- `studentRegisterSetup` 教会「数据怎么流动」——单向数据流
- `loginRegisterSetup` 教会「数据从哪来」——真实项目的数据在**远端**，前端要处理**异步、错误、鉴权**这三件事

到了第三个项目，"兄弟组件怎么通信"已经不再是问题了 —— 因为数据和鉴权状态都收拢到了路由和拦截器里。这正好让学生体会到：**架构选择是随需求复杂度演进的**。

---

## 十三、建议的教学推进顺序

1. **第 1 步**：装 vue-router，把 `App.vue` 改成 `<RouterView />`，做出 `/login` 和 `/home` 两个空页面 —— 先跑通路由
2. **第 2 步**：加 `guard.ts`，用 `localStorage` 里手填一个假 token 来演示拦截效果 —— 先让学生"看见"守卫
3. **第 3 步**：装 MSW，写 `POST /api/login`，用最朴素的 `axios.post` 打通登录 —— 先跑通请求
4. **第 4 步**：抽出 `request.ts`，加两个拦截器 —— 引出"统一处理"的价值
5. **第 5 步**：接 Element Plus，把表单换成 `el-form` + `rules` —— 美化与校验
6. **第 6 步**：做注册页与 `AuthLayout` 外壳 —— 引出嵌套路由
7. **第 7 步**：做 HomeView、退出登录、401 处理 —— 闭环

每一步都能独立运行、独立演示，不会出现"讲到最后才看到效果"。

---

## 十四、实施过程中需要留意的不确定点

这几条在实施时必须实测确认，不能想当然：

1. ~~**`el-form` 的 `:disabled` 与 `el-input` 的联动**~~：**已作废** ——
   最终实现不给 `el-form` 加 `:disabled`，提交中只给按钮上 `:loading`（Element Plus 官方示例的做法），
   这条不确定点因此不存在了。见计划〈与设计文档的 5 处偏差〉第 5 条。
2. ~~**`ElMessage` 样式引入的完整性**：仅引 `el-message.css` 是否足够，若弹窗样式仍缺失则全量引入~~
   **已定论（2026-09-22，Task 3 实测）**：问题不在"引少了"而在"引错了文件"——
   要引的是组件的 style 入口 `element-plus/es/components/{message,message-box}/style/css`，
   不是 `theme-chalk` 下的单个 `.css`。**"全量引入 `index.css`"这个回退方案从未使用过，也不需要。**
   详细经过见 §7.5 的订正说明。
3. **MSW 与 Vite 的 `base` 路径**：本项目 `base: '/'`，MSW 按 origin 相对路径匹配应当无问题，需实测
4. **`vue-tsc` 对 `service.request<unknown, T>()` 的类型推断**：需确认 `tsconfig` 的 `strict` 模式下无误报
5. **`unplugin-auto-import` 生成的 `types/auto-imports.d.ts` 与 vue-router 的 `RouteRecordRaw` 等类型是否有冲突**（预期无，但要跑一次 `pnpm build` 确认）

以上每一条都会在实施后用 `pnpm build` + `pnpm lint` + Playwright 实测验证，验证结果回填到本文档与 README。
**回填方式**：正文对应位置直接订正（像上面第 1、2 条这样标出结论），
而不是在文末追加"后来发现……"—— 后者会让正文里的旧说法继续被当成结论引用。
