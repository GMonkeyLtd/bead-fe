# 璞光纪（Cristal）— 前端小程序

> 基于 **Taro 4.1.2 + React 18 + TypeScript** 构建的跨端水晶手串智能设计小程序，主要运行在 **微信小程序** 平台，同时支持 H5、支付宝、百度、抖音等多端编译。

## 目录

- [项目简介](#项目简介)
- [技术栈](#技术栈)
- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [脚本命令](#脚本命令)
- [项目结构](#项目结构)
- [架构设计](#架构设计)
- [页面模块说明](#页面模块说明)
- [核心组件](#核心组件)
- [API 层设计](#api-层设计)
- [状态与认证管理](#状态与认证管理)
- [样式方案](#样式方案)
- [构建与部署](#构建与部署)
- [性能优化](#性能优化)
- [环境配置](#环境配置)

---

## 项目简介

**璞光纪** 是一款水晶手串智能设计平台的小程序前端。用户可以通过输入生辰八字，由 AI 根据五行命理推荐水晶珠串组合，也支持 AI 对话式设计和自定义 DIY。平台同时包含商户端，支持商户接单、报价、发货等全链路订单管理。

### 核心功能

| 功能模块    | 说明                                         |
| ----------- | -------------------------------------------- |
| 🏠 主页      | 品牌展示、引导用户开始设计体验                 |
| 🔮 快速设计  | 输入八字，AI 自动生成水晶手串设计方案           |
| ✏️ 自定义设计 | 用户手动选择水晶珠串，DIY 组合手串              |
| 💬 AI 对话设计 | 通过聊天对话式交互，AI 辅助个性化设计          |
| 📦 订单管理  | 用户下单、支付、查看物流、退款                  |
| 👤 用户中心  | 个人信息编辑、设计报告查看、邀请好友            |
| 🏪 商户端    | 商户登录、抢单、报价、发货、订单管理             |
| 🛍️ 商品展示  | 成品商品列表与详情                              |
| 📰 灵感推荐  | 设计灵感内容展示                                |

---

## 技术栈

| 类别       | 技术选型                                             |
| ---------- | --------------------------------------------------- |
| 框架       | [Taro 4.1.2](https://taro-docs.jd.com/) + React 18   |
| 语言       | TypeScript 5.x                                       |
| 编译器     | Vite 4.x（Taro Vite Runner）                          |
| 样式       | Sass + CSS Modules                                    |
| 状态管理   | React Hooks（useState / useRef / 自定义 Hooks）        |
| HTTP 请求  | 基于 `Taro.request` 的封装（拦截器 + 取消令牌）       |
| 代码规范   | ESLint + Stylelint                                    |
| 包管理     | pnpm                                                  |
| 目标平台   | 微信小程序（主要）、H5、支付宝、百度、抖音、QQ 等      |

### 关键依赖

- **@tarojs/*** — Taro 全家桶（CLI、组件、运行时、各平台插件）
- **lunar-typescript** — 农历日期换算（八字推算依赖）
- **marked** — Markdown 渲染（AI 对话内容格式化）
- **@vant/area-data** — 省市区地址数据

---

## 环境要求

| 工具      | 最低版本  |
| --------- | -------- |
| Node.js   | ≥ 16     |
| pnpm      | ≥ 8      |
| 微信开发者工具 | 最新稳定版 |

---

## 快速开始

```bash
# 1. 克隆仓库
git clone <repo-url>
cd bead-fe

# 2. 安装依赖
pnpm install

# 3. 启动微信小程序开发模式
pnpm run dev:weapp

# 4. 用微信开发者工具导入 dist/weapp 目录
#    AppID: wx0706be656eee23f4
```

> **H5 开发模式**：`pnpm run dev:h5`，浏览器打开后即可调试。

---

## 脚本命令

| 命令                       | 说明                                               |
| -------------------------- | ------------------------------------------------- |
| `pnpm run dev:weapp`       | 微信小程序开发模式（watch 热更新）                   |
| `pnpm run dev:h5`          | H5 开发模式                                        |
| `pnpm run dev:alipay`      | 支付宝小程序开发模式                                |
| `pnpm run dev:swan`        | 百度小程序开发模式                                  |
| `pnpm run dev:tt`          | 抖音小程序开发模式                                  |
| `pnpm run build:weapp`     | 微信小程序生产构建                                  |
| `pnpm run build:weapp:env` | 微信小程序生产构建（输出到 `dist/weapp-build`）       |
| `pnpm run build:h5`        | H5 生产构建                                        |

---

## 项目结构

```
bead-fe/
├── config/                    # Taro 构建配置
│   ├── index.ts               #   基础配置（别名、设计稿尺寸、编译器选项等）
│   ├── dev.ts                 #   开发环境配置（不压缩、不混淆）
│   └── prod.ts                #   生产环境配置（Terser 压缩、代码分割、Tree Shaking）
├── src/                       # 源代码主目录
│   ├── app.ts                 #   应用入口文件
│   ├── app.config.ts          #   Taro 应用配置（页面路由、分包、窗口样式、插件）
│   ├── app.scss               #   全局样式
│   ├── index.html             #   H5 入口 HTML
│   ├── assets/                #   静态资源（SVG 图标、图片等，108 个文件）
│   ├── components/            #   公共组件（61 个组件目录）
│   ├── hooks/                 #   自定义 React Hooks（7 个）
│   ├── utils/                 #   工具函数与 API 层（19 个模块）
│   ├── config/                #   应用配置常量（CDN 地址、页面路由、珠串配置）
│   ├── style/                 #   全局样式模块
│   ├── pages/                 #   主包页面
│   │   └── home/              #     首页
│   ├── pages-design/          #   【分包】设计模块
│   │   ├── quick-design/      #     快速设计（八字 → AI 推荐）
│   │   └── custom-design/     #     自定义设计（DIY 选珠）
│   ├── pages-chat/            #   【分包】AI 对话设计模块
│   │   └── chat-design/       #     聊天式 AI 设计
│   ├── pages-user/            #   【分包】用户模块
│   │   ├── user-center/       #     用户中心
│   │   ├── result/            #     设计结果页
│   │   ├── modify-user/       #     编辑个人资料
│   │   ├── contact-preference/#     联系偏好设置
│   │   └── my-invites/        #     我的邀请
│   ├── pages-order/           #   【分包】订单模块
│   │   ├── order-list/        #     订单列表
│   │   ├── order-detail/      #     订单详情
│   │   └── cancel-order/      #     取消订单
│   ├── pages-merchant/        #   【分包】商户端模块
│   │   ├── login/             #     商户登录
│   │   ├── grab-orders/       #     抢单大厅
│   │   ├── order-management/  #     订单管理
│   │   └── user-center/       #     商户中心
│   ├── pages-common/          #   【分包】公共页面模块
│   │   ├── webview/           #     WebView 内嵌页
│   │   ├── design-report/     #     设计报告
│   │   ├── inspiration/       #     灵感列表
│   │   └── inspiration-detail/#     灵感详情
│   └── pages-product/         #   【分包】商品模块
│       ├── product-list/      #     商品列表
│       └── product-detail/    #     商品详情
├── types/                     # TypeScript 类型声明
├── project.config.json        # 微信小程序项目配置
├── tsconfig.json              # TypeScript 配置
├── .eslintrc                  # ESLint 配置
├── .env.development           # 开发环境变量
├── .env.production            # 生产环境变量
├── .env.test                  # 测试环境变量
├── svgo.config.js             # SVG 优化配置
├── package.json               # 项目依赖与脚本
└── pnpm-lock.yaml             # 依赖锁定文件
```

---

## 架构设计

```
┌────────────────────────────────────────────────────────┐
│                    App Entry (app.ts)                   │
│         全局初始化 / useLaunch / 全局样式注入             │
├────────────────────────────────────────────────────────┤
│              app.config.ts — 路由 & 分包配置              │
│  主包: pages/home                                       │
│  分包: pages-design / pages-chat / pages-user /          │
│        pages-order / pages-merchant / pages-common /     │
│        pages-product                                     │
├────────────────────────────────────────────────────────┤
│                      页面层 (Pages)                      │
│  每个页面由 index.tsx + index.scss 组成                    │
│  使用 Taro Hooks: useLoad / useDidShow / useShareAppMessage│
├────────────────────────────────────────────────────────┤
│                   组件层 (Components)                     │
│  61 个可复用组件，按功能领域独立封装                        │
│  例: CustomDesignRing / CrystalSelector / ChatMessages    │
├────────────────────────────────────────────────────────┤
│                 Hooks 层 (Custom Hooks)                   │
│  useCircleRingCanvas / useOrderPolling / usePollDesign    │
│  usePageQuery / useKeyboardHeight / usePollDraft 等       │
├────────────────────────────────────────────────────────┤
│                  工具与 API 层 (Utils)                     │
│  request.ts ─ HTTP 核心封装（拦截器/取消令牌/重试）        │
│  api.ts ─ 用户/生成/订阅/灵感/商品等 API                   │
│  api-session.ts ─ AI 会话相关 API                         │
│  api-merchant.ts ─ 商户端 API                             │
│  api-pay.ts ─ 支付/订单/退款 API                          │
│  auth.ts / auth-merchant.ts ─ 认证管理                    │
├────────────────────────────────────────────────────────┤
│               配置层 (Config)                             │
│  CDN 资源地址 / 页面路由常量 / 珠串数据 / 首页内容          │
├────────────────────────────────────────────────────────┤
│             Taro Runtime → 微信小程序 / H5 / ...          │
└────────────────────────────────────────────────────────┘
```

---

## 页面模块说明

### 主包 — `pages/`

入口页面，保持体积最小以加速首屏加载。

| 页面     | 路径             | 说明       |
| -------- | ---------------- | ---------- |
| 首页     | `pages/home`     | 品牌首页，引导用户进入设计或浏览灵感 |

### 分包 — 设计模块 `pages-design/`

| 页面       | 路径                          | 说明                           |
| ---------- | ----------------------------- | ------------------------------ |
| 快速设计   | `pages-design/quick-design`   | 输入八字 → AI 推荐水晶方案      |
| 自定义设计 | `pages-design/custom-design`  | 手动选珠、DIY 搭配手串          |

### 分包 — AI 对话模块 `pages-chat/`

| 页面         | 路径                        | 说明                          |
| ------------ | --------------------------- | ----------------------------- |
| 聊天设计     | `pages-chat/chat-design`    | 对话式 AI 辅助设计             |

### 分包 — 用户模块 `pages-user/`

| 页面           | 路径                             | 说明           |
| -------------- | -------------------------------- | -------------- |
| 用户中心       | `pages-user/user-center`          | 个人中心首页   |
| 设计结果       | `pages-user/result`               | 查看 AI 设计结果 |
| 编辑资料       | `pages-user/modify-user`          | 修改昵称/头像  |
| 联系偏好       | `pages-user/contact-preference`   | 设置联系方式   |
| 我的邀请       | `pages-user/my-invites`           | 分销邀请记录   |

### 分包 — 订单模块 `pages-order/`

| 页面       | 路径                          | 说明               |
| ---------- | ----------------------------- | ------------------ |
| 订单列表   | `pages-order/order-list`       | 用户订单列表       |
| 订单详情   | `pages-order/order-detail`     | 订单状态/物流/操作 |
| 取消订单   | `pages-order/cancel-order`     | 订单取消/退款      |

### 分包 — 商户端 `pages-merchant/`

| 页面       | 路径                              | 说明               |
| ---------- | --------------------------------- | ------------------ |
| 商户登录   | `pages-merchant/login`             | 手机号+密码登录    |
| 抢单大厅   | `pages-merchant/grab-orders`       | 查看待分配订单     |
| 订单管理   | `pages-merchant/order-management`  | 报价/发货/管理     |
| 商户中心   | `pages-merchant/user-center`       | 商户信息/充值      |

### 分包 — 公共页面 `pages-common/`

| 页面       | 路径                               | 说明               |
| ---------- | ---------------------------------- | ------------------ |
| WebView    | `pages-common/webview`              | 内嵌网页           |
| 设计报告   | `pages-common/design-report`        | 设计详情报告       |
| 灵感列表   | `pages-common/inspiration`          | 灵感推荐内容       |
| 灵感详情   | `pages-common/inspiration-detail`   | 单个灵感详情       |

### 分包 — 商品模块 `pages-product/`

| 页面       | 路径                              | 说明           |
| ---------- | --------------------------------- | -------------- |
| 商品列表   | `pages-product/product-list`       | 成品商品列表   |
| 商品详情   | `pages-product/product-detail`     | 商品详情页     |

---

## 核心组件

项目共有 **61 个**组件，按功能领域列出核心组件：

### 设计与展示

| 组件                  | 说明                                     |
| --------------------- | ---------------------------------------- |
| `CustomDesignRing`    | 自定义设计交互环（Canvas 绘制手串圆环）    |
| `CrystalSelector`    | 水晶珠选择器（支持颜色/五行/尺寸筛选）     |
| `CircleRing`          | 手串圆环渲染组件                          |
| `BeadList`            | 珠串列表展示                              |
| `WuxingDisplay`       | 五行信息可视化展示                        |
| `BeadSizeSelector`    | 珠径尺寸选择器                            |
| `BraceletDetailDialog`| 手串设计详情弹窗                          |
| `BraceletDraftCard`   | 设计草稿卡片                              |
| `BraceletInfo`        | 手串信息卡片                              |

### AI 对话

| 组件               | 说明                       |
| ------------------ | -------------------------- |
| `ChatMessages`     | 聊天消息列表               |
| `ChatBubble`       | 聊天气泡                   |
| `ChatCardList`     | 聊天中的卡片式回复列表     |
| `ChatLoading`      | AI 回复加载动画            |
| `TypewriterText`   | 打字机效果文本             |

### 订单与支付

| 组件                | 说明                       |
| ------------------- | -------------------------- |
| `OrderList`         | 通用订单列表               |
| `BeadOrderDialog`   | 下单确认弹窗               |
| `PriceTierSelector` | 价格档位选择器             |
| `LogisticsCard`     | 物流信息卡片               |
| `CancelOrderDialog` | 取消订单弹窗               |
| `WayBillForm`       | 运单填写表单               |

### 通用 UI

| 组件                | 说明                       |
| ------------------- | -------------------------- |
| `LazyImage`         | 懒加载图片                 |
| `ImagePreview`      | 图片预览                   |
| `ImageSlider`       | 图片轮播                   |
| `CrystalButton`     | 品牌风格按钮               |
| `PageContainer`     | 页面容器                   |
| `AppHeader`         | 应用头部                   |
| `TabBar`            | 自定义底部导航栏           |
| `SkeletonCard`      | 骨架屏卡片                 |
| `LoadingIcon`       | 加载图标                   |
| `DateTimeDrawer`    | 日期时间选择抽屉           |
| `PromoBanner`       | 推广 Banner                |
| `PosterGenerator`   | 海报生成器（Canvas 绘制）  |

---

## API 层设计

### 请求核心 — `utils/request.ts`

基于 `Taro.request` 封装的完整 HTTP 客户端：

- **请求拦截器**：自动注入 Token、区分用户/商户端 `baseURL`
- **响应拦截器**：统一错误处理、自动 Toast 提示、401 自动重新登录
- **取消令牌** (`CancelToken`)：支持请求取消（如轮询设计进度时中断）
- **HTTP 方法封装**：`http.get / post / put / delete / patch / upload`

```
API Base URL:
  正式环境 → https://api.gmonkey.top
  灰度环境 → https://api-gray.gmonkey.top
```

### API 模块划分

| 文件                 | 职责                                         |
| -------------------- | -------------------------------------------- |
| `api.ts`             | 用户、生成（八字/快速/个性化）、订阅消息、灵感、商品 |
| `api-session.ts`     | AI 会话管理：创建会话、聊天、获取设计草稿/进度   |
| `api-merchant.ts`    | 商户端：登录、抢单、报价、发货、充值            |
| `api-pay.ts`         | 支付：下单、支付、退款、确认收货、物流          |

---

## 状态与认证管理

### 用户端认证 — `utils/auth.ts`

- 基于 `Taro.login()` 获取微信登录 code，换取服务端 Token
- Token 通过 `Taro.setStorageSync` 持久化存储
- 支持自动登录：请求时如无 Token 则自动触发登录流程
- 防并发登录：通过 `isLoggingIn` + `loginPromise` 机制避免重复登录

### 商户端认证 — `utils/auth-merchant.ts`

- 手机号 + 密码登录，Token 独立于用户端存储
- 支持与用户端相同的拦截器与重试机制

### 自定义 Hooks

| Hook                     | 说明                                                 |
| ------------------------ | ---------------------------------------------------- |
| `useCircleRingCanvas`    | 管理手串圆环 Canvas 绑定、绘制与交互逻辑               |
| `useOrderPolling`        | 订单状态轮询                                          |
| `usePollDesign`          | AI 设计进度轮询（支持取消令牌）                        |
| `usePollDraft`           | 设计草稿轮询                                          |
| `usePageQuery`           | 页面参数解析（支持场景值/分享参数）                    |
| `useKeyboardHeight`      | 键盘弹起高度监听                                      |
| `useSessionResultHandler`| AI 会话结果处理                                       |

---

## 样式方案

- **预处理器**：Sass（`.scss`）
- **CSS Modules**：生产环境默认启用，文件命名模式为 `*.module.scss`
- **设计稿基准**：393px（iPhone 14 Pro 逻辑宽度）
- **全局样式**：`src/app.scss` 定义全局重置和公共样式
- **样式模块**：`src/style/` 下存放共享样式模块
- **px 转换**：`pxtransform` 生产环境关闭（直接使用 rpx 或自行换算）

---

## 构建与部署

### 开发环境

```bash
# 微信小程序（推荐）
pnpm run dev:weapp
# 输出目录: dist/weapp
# 用微信开发者工具导入该目录即可

# H5
pnpm run dev:h5
# 输出目录: dist/h5
```

### 生产构建

```bash
# 微信小程序
pnpm run build:weapp
# 输出目录: dist/

# 带自定义输出目录的构建
pnpm run build:weapp:env
# 输出目录: dist/weapp-build
```

### 微信小程序发布流程

```
1. pnpm run build:weapp        # 生产构建
2. 打开微信开发者工具            # 导入 dist/ 目录
3. 开发者工具 → 上传             # 上传为体验版
4. 微信公众平台 → 版本管理       # 提交审核 → 发布
```

> **AppID**: `wx0706be656eee23f4`
> **基础库版本**: `3.8.8`
> **插件**: 微信物流插件 `wx9ad912bf20548d92` (v2.3.0)

### H5 部署

```bash
pnpm run build:h5
# 将 dist/h5 目录部署到任意静态服务器（Nginx / CDN / 云托管）
```

---

## 性能优化

项目在生产构建中启用了多项优化策略（详见 `config/prod.ts`）：

### 代码分割

```
runtime → vendors → taro → common → lunar → marked
```

- 将 `lunar-typescript`、`marked` 等大型库独立打包为 chunk
- 公共代码提取到 `common` chunk，减少重复加载

### 压缩策略

- **Terser 深度压缩**：`drop_console`、`drop_debugger`、双通道压缩（`passes: 2`）
- **CSS 压缩**：类名哈希化 `[hash:base64:5]`，启用 CSS Tree Shaking
- **Source Map**：生产环境完全关闭，节省 3MB+ 体积
- **图片优化**：内联阈值仅 1KB，质量压缩至 75%

### 分包策略

- **主包最小化**：仅保留首页 `pages/home`
- **按需注入**：`lazyCodeLoading: "requiredComponents"`
- **分包预下载**：首页预加载 `pages-design` 分包
- **主包优化**：`optimizeMainPackage` 自动将仅分包使用的代码移出主包

### 静态资源

- 大量图片/视频/字体通过 CDN 加载（`zljcdn.gmonkey.top`）
- SVG 图标经 `svgo` 优化处理
- 仅在 `src/assets/` 保留必要的本地资源

---

## 环境配置

### 环境变量文件

| 文件               | 环境     | 说明                           |
| ------------------ | -------- | ------------------------------ |
| `.env.development` | 开发     | 开发环境 AppID 和变量           |
| `.env.test`        | 测试     | 测试环境 AppID 和变量           |
| `.env.production`  | 生产     | 生产环境 AppID 和变量           |

所有 `TARO_APP_` 前缀的环境变量会自动注入到应用代码中。

### API 域名配置

在 `src/utils/request.ts` 中管理：

```typescript
const domain = 'https://api.gmonkey.top'       // 正式环境
const grayDomain = 'https://api-gray.gmonkey.top' // 灰度环境
```

### CDN 配置

静态资源 CDN 地址统一在 `src/config/index.ts` 中管理，域名为 `zljcdn.gmonkey.top`。

### 路径别名

```typescript
// tsconfig.json & config/index.ts
"@/*" → "src/*"
```

---

## License

Private — 版权所有。
