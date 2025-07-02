# HTTP 请求取消功能使用指南

本文档介绍如何使用新增的 HTTP 请求取消功能。

## 功能概述

我们为 API 调用模块添加了完整的请求取消支持，包括：

- ✅ **取消令牌（CancelToken）**：控制单个请求的取消
- ✅ **请求管理器（RequestManager）**：管理多个请求的取消
- ✅ **文件上传取消**：支持取消正在进行的文件上传
- ✅ **自动重复请求处理**：自动取消重复的请求
- ✅ **组件生命周期集成**：组件卸载时自动取消请求

## 基本使用

### 1. 使用取消令牌

```typescript
import { CancelToken } from './utils/request'
import api from './utils/api'

// 创建取消令牌
const cancelToken = CancelToken.create()

// 发起可取消的请求
try {
  const result = await api.generate.quickGenerate(params, { 
    cancelToken 
  })
  console.log('请求成功:', result)
} catch (error) {
  if (error.message?.includes('已取消')) {
    console.log('请求被用户取消')
  }
}

// 取消请求
cancelToken.cancel('用户取消了请求')
```

### 2. 使用请求管理器

```typescript
import { RequestManager } from './utils/request'

const manager = new RequestManager()

// 创建带标识的请求
const promise = manager.createRequest('my-request', (cancelToken) =>
  api.generate.quickGenerate(params, { cancelToken })
)

// 取消特定请求
manager.cancel('my-request', '用户取消')

// 取消所有请求
manager.cancelAll('批量取消')
```

### 3. 使用便捷的全局管理器

```typescript
import { managedApi, requestManager } from './utils/api'

// 自动管理的请求（重复调用会自动取消前一个）
const result = await managedApi.quickGenerate('unique-key', params)

// 取消特定请求
requestManager.cancel('unique-key')
```

## 在组件中使用

### React/Taro 组件示例

```typescript
import React, { useRef, useEffect } from 'react'
import { CancelToken } from '../utils/request'
import api from '../utils/api'

function MyComponent() {
  const cancelTokenRef = useRef<CancelToken>()

  const handleGenerate = async () => {
    try {
      // 如果有正在进行的请求，先取消
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel('开始新请求')
      }

      // 创建新的取消令牌
      cancelTokenRef.current = CancelToken.create()

      const result = await api.generate.quickGenerate(params, {
        cancelToken: cancelTokenRef.current
      })

      console.log('生成成功:', result)
    } catch (error: any) {
      if (error.message?.includes('已取消')) {
        console.log('请求被取消')
      } else {
        console.error('请求失败:', error)
      }
    }
  }

  const handleCancel = () => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('用户点击取消')
    }
  }

  // 组件卸载时取消请求
  useEffect(() => {
    return () => {
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel('组件已卸载')
      }
    }
  }, [])

  return (
    <div>
      <button onClick={handleGenerate}>开始生成</button>
      <button onClick={handleCancel}>取消请求</button>
    </div>
  )
}
```

## 文件上传取消

```typescript
import { CancelToken } from './utils/request'
import api from './utils/api'

const uploadFile = async (filePath: string) => {
  const cancelToken = CancelToken.create()
  
  try {
    const result = await api.file.upload(filePath, {}, { 
      cancelToken 
    })
    console.log('上传成功:', result)
  } catch (error: any) {
    if (error.message?.includes('已取消')) {
      console.log('上传被取消')
    }
  }
  
  // 可以随时取消上传
  // cancelToken.cancel('用户取消上传')
}
```

## 高级用法

### 请求超时自动取消

```typescript
const requestWithTimeout = async <T>(
  requestFn: (cancelToken: CancelToken) => Promise<T>,
  timeoutMs: number = 10000
): Promise<T> => {
  const cancelToken = CancelToken.create()
  
  // 设置超时取消
  const timeoutId = setTimeout(() => {
    cancelToken.cancel(`请求超时 (${timeoutMs}ms)`)
  }, timeoutMs)

  try {
    const result = await requestFn(cancelToken)
    clearTimeout(timeoutId)
    return result
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

// 使用
const result = await requestWithTimeout(
  (cancelToken) => api.generate.quickGenerate(params, { cancelToken }),
  5000 // 5秒超时
)
```

### 批量请求管理

```typescript
import { managedApi, requestManager } from './utils/api'

const batchUpload = async (filePaths: string[]) => {
  const uploadPromises = filePaths.map((filePath, index) => 
    managedApi.upload(`upload-${index}`, filePath)
  )

  try {
    const results = await Promise.all(uploadPromises)
    return results
  } catch (error) {
    // 如果其中一个失败，取消所有上传
    filePaths.forEach((_, index) => {
      requestManager.cancel(`upload-${index}`, '批量上传失败')
    })
    throw error
  }
}
```

## API 参考

### CancelToken

| 方法 | 说明 |
|------|------|
| `CancelToken.create()` | 创建新的取消令牌 |
| `cancel(reason?)` | 取消请求，可选择提供取消原因 |
| `isCancelled` | 检查是否已被取消 |
| `reason` | 获取取消原因 |
| `throwIfCancelled()` | 如果已取消则抛出错误 |

### RequestManager

| 方法 | 说明 |
|------|------|
| `createRequest(key, requestFn)` | 创建带标识的请求 |
| `cancel(key, reason?)` | 取消指定请求 |
| `cancelAll(reason?)` | 取消所有请求 |
| `hasRequest(key)` | 检查请求是否存在 |

### API 配置

所有 API 方法现在都支持 `ApiConfig` 参数：

```typescript
interface ApiConfig {
  cancelToken?: CancelToken;
  showLoading?: boolean;
  loadingText?: string;
  showError?: boolean;
}
```

## 使用场景

1. **长时间运行的生成任务**：用户可以随时取消
2. **文件上传**：支持取消正在进行的上传
3. **页面切换**：离开页面时自动取消请求
4. **重复请求**：自动取消前一个相同的请求
5. **超时控制**：设置请求超时自动取消
6. **批量操作**：部分失败时取消剩余操作

## 注意事项

- 取消令牌是一次性的，一旦取消就不能重用
- 请求被取消时会抛出包含"已取消"字样的错误
- 在组件卸载时记得取消正在进行的请求
- 使用全局请求管理器时，相同 key 的请求会自动取消前一个

## 完整示例

查看 `src/utils/cancelable-request-example.ts` 文件获取更多完整的使用示例。 