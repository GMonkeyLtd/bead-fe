# 接口调用系统使用说明

## 概述

本项目已经优化了所有接口调用逻辑，实现了以下功能：
- 接口调用前自动检查登录态
- 未登录时自动调用登录接口获取token
- 自动在每个接口调用的header中添加token
- 支持token过期后自动重新登录
- 防止并发登录请求
- 统一的错误处理机制

## 核心组件

### 1. AuthManager (认证管理器)

位置：`src/utils/auth.ts`

主要功能：
- `getToken()`: 获取token，如果没有则自动登录
- `login()`: 执行登录流程
- `isLoggedIn()`: 检查是否已登录
- `logout()`: 退出登录
- `clearAuth()`: 清除认证信息

### 2. HTTP请求工具

位置：`src/utils/request.ts`

特性：
- 自动添加认证header
- 支持跳过认证的接口（`skipAuth: true`）
- 自动重试机制（token过期时）
- 统一的错误处理
- 支持文件上传

## 使用方法

### 1. 基本API调用

```typescript
import api from '@/utils/api'

// 所有API调用都会自动处理认证
const result = await api.generate.bazi({
  year: 2024,
  month: 1,
  day: 1,
  hour: 12,
  gender: 1
})
```

### 2. 直接使用HTTP工具

```typescript
import { http } from '@/utils/request'

// GET请求
const data = await http.get('/user/profile')

// POST请求
const result = await http.post('/user/update', { name: 'test' })

// 跳过认证的请求
const publicData = await http.get('/public/data', {}, { skipAuth: true })
```

### 3. 文件上传

```typescript
import api from '@/utils/api'

// 使用统一的上传接口
const result = await api.file.upload(filePath, { 
  type: 'image',
  category: 'avatar' 
})
```

### 4. 手动管理认证

```typescript
import { AuthManager } from '@/utils/auth'

// 检查登录状态
if (!AuthManager.isLoggedIn()) {
  await AuthManager.login()
}

// 手动退出登录
await AuthManager.logout()

// 获取当前token
const token = await AuthManager.getToken()
```

### 5. LLM聊天功能

```typescript
import { useLLMChat } from '@/hooks/useLLMChat'

const {
  messages,
  sendMessageWithStream,
  isLoading
} = useLLMChat({
  onError: (error) => console.error('聊天错误:', error),
  onComplete: (message) => console.log('消息完成:', message)
})

// 发送消息（会自动处理认证）
await sendMessageWithStream('你好')
```

## 自动认证流程

1. **首次调用接口**：
   - 检查本地是否有token
   - 如果没有，自动调用微信登录接口
   - 获取到token后保存到本地
   - 继续执行原始请求

2. **后续接口调用**：
   - 从本地存储读取token
   - 在请求header中添加`Authorization: Bearer ${token}`
   - 正常发送请求

3. **token过期处理**：
   - 服务器返回401状态码
   - 自动清除本地认证信息
   - 重新登录获取新token
   - 重试原始请求

## 配置选项

### 接口配置

```typescript
// 设置API基础URL
setBaseURL('https://your-api-domain.com/api/v1')

// 设置默认配置
setDefaultConfig({
  timeout: 30000,
  showLoading: true,
  loadingText: '加载中...',
  showError: true
})
```

### 请求配置

```typescript
interface RequestConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: any
  header?: Record<string, string>
  timeout?: number
  showLoading?: boolean
  loadingText?: string
  showError?: boolean
  skipAuth?: boolean // 是否跳过认证检查
}
```

## 错误处理

系统会自动处理以下错误情况：

1. **网络错误**：显示网络错误提示
2. **认证错误**：自动重新登录
3. **服务器错误**：显示具体错误信息
4. **业务错误**：根据返回的错误码和消息显示提示

## 注意事项

1. **登录接口**：必须添加`skipAuth: true`标记，避免循环依赖
2. **并发请求**：系统会自动处理并发登录，防止重复登录
3. **存储同步**：认证信息使用同步存储API，确保实时性
4. **错误重试**：token过期时最多重试1次，避免无限循环

## 示例项目结构

```
src/
├── utils/
│   ├── auth.ts          # 认证管理
│   ├── request.ts       # HTTP请求工具
│   ├── api.ts          # API接口定义
│   └── README.md       # 使用说明
├── hooks/
│   └── useLLMChat.ts   # LLM聊天Hook
└── pages/
    └── ...             # 页面组件
``` 