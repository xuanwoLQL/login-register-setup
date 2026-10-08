# loginRegisterSetup

> 软件设计与开发课程教学演示项目 —— 用户登录与注册系统
> 系列第 3 个项目（前两个：`toDoListSetup`、`studentRegisterSetup`）

本项目讲三件事：

1. **前端怎么和后端说话** —— axios 实例、拦截器、接口分层
2. **没有后端时怎么开发** —— MSW 在网络层拦截请求，Network 面板能看到真实请求
3. **前端怎么知道"你登录了"** —— token 存储 + 路由守卫 + 401 处理

## 技术栈

Vue 3.5 + TypeScript + Vite 7 + SCSS + ESLint 10 + Prettier + auto-import

新增依赖：`vue-router@4`、`axios`、`element-plus`、`@element-plus/icons-vue`、`msw`（开发依赖）

## 运行说明

```bash
pnpm install        # 安装依赖
pnpm dev            # 启动开发服务器（端口 8002，会自动打开浏览器）
pnpm build          # 生产构建（vite build && vue-tsc --noEmit 类型检查）
pnpm lint           # ESLint 检查并自动修复
pnpm preview        # 预览生产构建产物
```

开发环境默认启用 MSW mock（`.env.development` 里 `VITE_APP_USE_MOCK='true'`）。
生产构建（`pnpm build:pro`）不会打包 mock。

**测试账号**（预置在 mock 用户表里，登录页也有提示条）：

| 用户名 | 密码 | 角色 |
|---|---|---|
| `admin` | `123456` | 管理员 |
| `student` | `123456` | 普通用户 |

> 清空浏览器存储（localStorage / sessionStorage）后，会恢复到上面两个预置账号。

## 目录结构

```
loginRegisterSetup/
├─ public/
│  └─ mockServiceWorker.js          ← npx msw init public/ --save 生成，不要手改
├─ src/
│  ├─ api/
│  │  ├─ request.ts                 ★ axios 实例 + 请求/响应拦截器（本项目核心教具）
│  │  └─ user.ts                    ← 接口收拢：login / register / getUserInfo / logout
│  ├─ mocks/
│  │  ├─ handlers.ts                ★ MSW 请求处理器 + 用户表
│  │  └─ browser.ts                 ← setupWorker
│  ├─ router/
│  │  ├─ index.ts                   ← 路由表 + 全局后置钩子（动态标题）
│  │  └─ guard.ts                   ★ 全局前置守卫（登录拦截）
│  ├─ utils/
│  │  └─ auth.ts                    ← token 与用户信息的读写（"记住我"分存储）
│  ├─ types/
│  │  └─ user.ts                    ← User / StoredUser / LoginForm / RegisterForm
│  │                                  / RegisterPayload / ApiResult<T>
│  ├─ layouts/
│  │  └─ AuthLayout.vue             ← 登录/注册共用外壳（左品牌区 + 右表单卡片）
│  ├─ views/
│  │  ├─ LoginView.vue
│  │  ├─ RegisterView.vue
│  │  ├─ HomeView.vue               ← 登录后的落地页
│  │  └─ NotFoundView.vue           ← 404 页面
│  ├─ assets/css/main.scss          ← 全局 SCSS 变量（additionalData 注入，只放变量/mixin）
│  ├─ assets/css/element-theme.css  ← Element Plus 主题色 CSS 变量覆盖（html:root）
│  ├─ App.vue                       ← 只留 <el-config-provider><RouterView /></...>
│  ├─ main.ts                       ← 异步：先起 MSW 再 mount；副作用引入守卫
│  ├─ style.css                     ← 全局基础样式（与脚手架差异：全屏布局）
│  └─ vite-env.d.ts                 ← Vite 环境变量类型声明
├─ docs/
│  └─ loginRegisterSetup 设计方案.md  ← 本项目的设计文档（含订正）
├─ index.html                       ← 标题走 %VITE_APP_TITLE% 替换
├─ vite.config.ts                   ← 端口 8002 + ElementPlusResolver
├─ package.json                     ← 脚手架 + 4 个运行时依赖 + msw
├─ tsconfig.json / tsconfig.node.json
├─ eslint.config.js / .prettierrc / .prettierignore / .gitignore
├─ .env / .env.development / .env.production
└─ .vscode/
```

## 知识点 → 代码位置 对照表

| # | 知识点 | 文件 | 关键代码 |
|---|---|---|---|
| 1 | 路由表 / 命名路由 | `router/index.ts` | `{ path: 'login', name: 'login', ... }` |
| 2 | 嵌套路由（共享布局） | `router/index.ts` | `AuthLayout` + `children: [...]` |
| 3 | 路由懒加载 | `router/index.ts` | `component: () => import(...)` |
| 4 | 重定向 | `router/index.ts` | `{ path: '', redirect: '/login' }` |
| 5 | 404 通配路由 | `router/index.ts` | `/:pathMatch(.*)*` |
| 6 | 路由元信息 meta | `router/index.ts` | `meta: { requiresAuth: true }` |
| 7 | 全局前置守卫 | `router/guard.ts` | `router.beforeEach((to) => ...)` |
| 8 | 守卫返回值语义 | `router/guard.ts` | 返回路由地址即拦截，返回 `true` 即放行 |
| 9 | 全局后置钩子 | `router/index.ts` | `router.afterEach` 改 `document.title` |
| 10 | 编程式导航 | `LoginView.vue` | `router.replace(redirect)` |
| 11 | 路由参数 query | `LoginView.vue` | `route.query.redirect` / `route.query.username` |
| 12 | axios 实例与 baseURL / timeout | `api/request.ts` | `axios.create({ baseURL, timeout })` |
| 13 | 请求拦截器 | `api/request.ts` | `service.interceptors.request.use(...)` |
| 14 | 响应拦截器 | `api/request.ts` | `service.interceptors.response.use(...)` |
| 15 | 拦截器解包后的类型问题 | `api/request.ts` | `service.request<unknown, T>(config)` |
| 16 | 接口分层（视图不碰 axios） | `api/user.ts` | `export const login = (data) => request<...>(...)` |
| 17 | MSW 网络层拦截 | `mocks/handlers.ts` | `http.post('/api/login', ...)` |
| 18 | 模拟网络延迟 | `mocks/handlers.ts` | `await delay(400)` |
| 19 | 环境变量控制开关 | `main.ts` + `.env` | `import.meta.env.VITE_APP_USE_MOCK` |
| 20 | 动态 import() 条件加载 | `main.ts` | `await import('@/mocks/browser')` |
| 21 | 异步启动应用 | `main.ts` | `async function bootstrap()` |
| 22 | Element Plus 按需自动导入 | `vite.config.ts` | `ElementPlusResolver()` |
| 23 | 函数式组件的样式边界 | `main.ts` | `import 'element-plus/es/components/message/style/css'` |
| 24 | 主题色 CSS 变量覆盖 | `assets/css/element-theme.css` | `--el-color-primary: ...`（选择器是 `html:root`） |
| 25 | 组件中文化 | `App.vue` | `<el-config-provider :locale="zhCn">` |
| 26 | el-form 的 model / rules / ref | `LoginView.vue` | `formRef.value.validate()` |
| 27 | 自定义校验器 | `RegisterView.vue` | `confirmValidator` |
| 28 | 跨字段联动重校验 | `RegisterView.vue` | `password` 变化时重校验 `confirmPassword` |
| 29 | 异步提交的 loading 态 | 两个表单 | `:loading="submitting"` |
| 30 | ElMessage / ElMessageBox | 多处 | `ElMessageBox.confirm(...)` |
| 31 | 表单模型 vs 提交模型 | `types/user.ts` | `Omit<RegisterForm, 'confirmPassword'>` |
| 32 | localStorage 读写与封装 | `utils/auth.ts` | `getToken / setToken / clearAuth` |
| 33 | 异步组件的 await 顺序 | `main.ts` | 先起 mock 再 mount |

## 与脚手架的差异说明

- `src/style.css`：移除了 `body` 的 flex 居中与 `#app` 的 `max-width: 1280px` + `padding`，
  因为 AuthLayout 是全屏左右分栏，需要让渐变背景铺满整屏（`studentRegisterSetup` 是"表单 + 列表"两栏，不需要）。
- `src/vite-env.d.ts`：环境变量类型按本项目 `.env*` 重写（`VITE_APP_TITLE` / `VITE_APP_BASE_API` / `VITE_APP_USE_MOCK` / `VITE_APP_TOKEN_KEY`）。
- `vite.config.ts`：端口 8001 → **8002**，`Components` 增加 `ElementPlusResolver()`。
- `src/router/guard.ts`：全局守卫在 `main.ts` 里以副作用方式引入（`import './router/guard'`），
  保证它在 router 实例创建之后、`app.use(router)` 之前执行注册。

## 验收清单

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

**注册**
- [ ] 两次密码不一致 → 提示"两次输入的密码不一致"
- [ ] 用户名填已存在的 `admin` → 提示"用户名已被占用"
- [ ] 注册成功后跳到 `/login` 且用户名已自动回填
- [ ] 用刚注册的账号能登录成功
- [ ] 刷新页面后，刚注册的账号仍然能登录（localStorage 持久化生效）

**登录态**
- [ ] 登录后刷新页面 → 仍在 `/home`，不掉线
- [ ] 登录后请求头里带 `Authorization: Bearer mock-token-admin`（Network 面板可验）
- [ ] 点"退出登录" → 有二次确认弹窗 → 确认后回到 `/login`
- [ ] 退出后直接访问 `/home` → 被守卫打回登录页

**样式与响应式**
- [ ] 主色是自定义的靛蓝 `#4f46e5`，不是 Element Plus 默认的 `#409eff`
- [ ] `ElMessage` / `ElMessageBox` 弹出时样式完整（圆角、图标都在；`ElMessageBox` 有遮罩与阴影）
- [ ] `el-table` 空状态显示中文
- [ ] 窗口宽度 < 900px → 左侧品牌区隐藏，表单卡片居中
- [ ] 登录页 / 注册页 / 首页在 1440px 下无横向滚动条

## ⚠️ 安全边界（必须向学生强调）

这套 mock 把密码**明文**存在 localStorage 里，真实项目里密码**绝不能**在前端存储或以明文传输
（要靠 HTTPS + 后端加盐哈希）。本项目只是为了演示前端流程，**不要照搬到生产环境**。
mock 的 token 是 `mock-token-<username>` 极简串，真实项目里这是签过名的 JWT。
