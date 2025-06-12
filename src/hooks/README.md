# Taro 聊天流 Hook 使用指南

## 概述

`useChatStreamTaro` 是专门为 Taro 小程序环境设计的聊天流处理 Hook，用于模拟流式聊天响应。由于小程序不支持 EventSource 和 fetch 的流式响应，此 Hook 使用轮询机制来实现类似的流式体验。

## 使用方法

### 基本用法

```typescript
import { useChatStreamTaro } from '@/hooks/useChatStreamTaro'

const ChatComponent = () => {
  const {
    messages,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    clearMessages,
    abortStream
  } = useChatStreamTaro({
    apiUrl: 'https://api.modelverse.cn/v1/chat/completions',
    streamOptions: {
      model: 'gpt-3.5-turbo',
      maxTokens: 2000,
      temperature: 0.7,
      networkSearch: true
    },
    onProgress: (message) => {
      console.log('消息更新:', message.content)
    },
    onComplete: (message) => {
      console.log('消息完成:', message)
    },
    onError: (error) => {
      console.error('出现错误:', error.message)
    }
  })

  const handleSendMessage = async () => {
    await sendMessage('你好，请介绍一下自己')
  }

  return (
    <View>
      {messages.map(msg => (
        <View key={msg.id}>
          <Text>{msg.role}: {msg.content}</Text>
          {msg.think && <Text>思考: {msg.think}</Text>}
        </View>
      ))}
      
      {isLoading && <Text>加载中...</Text>}
      {isStreaming && <Text>生成中...</Text>}
      {error && <Text>错误: {error}</Text>}
      
      <Button onClick={handleSendMessage}>发送消息</Button>
      <Button onClick={clearMessages}>清空对话</Button>
      <Button onClick={abortStream}>中断生成</Button>
    </View>
  )
}
```

### 高级配置

```typescript
const chatStream = useChatStreamTaro({
  apiUrl: 'https://your-api-endpoint.com/chat',
  streamOptions: {
    model: 'gpt-4',
    maxTokens: 4000,
    temperature: 0.8,
    topP: 0.9,
    repetitionPenalty: 1.1,
    networkSearch: true
  },
  onProgress: (message) => {
    // 实时更新UI
    setCurrentResponse(message.content)
  },
  onComplete: (message) => {
    // 完成后的处理
    if (message.networkSearchResult) {
      setSearchResults(message.networkSearchResult)
    }
  },
  onError: (error) => {
    // 错误处理
    Taro.showToast({
      title: error.message,
      icon: 'error'
    })
  }
})
```

## API 参考

### UseChatStreamOptions

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| apiUrl | string | 'https://api.modelverse.cn/v1/chat/completions' | API 端点 |
| streamOptions | ChatStreamOptions | {} | 流式聊天配置 |
| onProgress | (message: ChatMessage) => void | - | 消息更新回调 |
| onComplete | (message: ChatMessage) => void | - | 消息完成回调 |
| onError | (error: Error) => void | - | 错误处理回调 |

### ChatStreamOptions

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| model | string | 'gpt-3.5-turbo' | AI 模型名称 |
| maxTokens | number | 2000 | 最大令牌数 |
| temperature | number | 0.7 | 温度参数 |
| topP | number | 1.0 | Top-P 参数 |
| repetitionPenalty | number | 1.0 | 重复惩罚 |
| networkSearch | boolean | false | 是否启用网络搜索 |

### 返回值

| 参数 | 类型 | 说明 |
|------|------|------|
| messages | ChatMessage[] | 对话消息列表 |
| isLoading | boolean | 是否正在加载 |
| isStreaming | boolean | 是否正在流式生成 |
| error | string \| null | 错误信息 |
| sendMessage | (content: string) => Promise<void> | 发送消息方法 |
| clearMessages | () => void | 清空消息方法 |
| abortStream | () => void | 中断流式生成方法 |

## 后端接口要求

### 请求格式

```json
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "user",
      "content": "用户消息内容"
    }
  ],
  "stream": true,
  "max_tokens": 2000,
  "temperature": 0.7,
  "top_p": 1.0,
  "repetition_penalty": 1.0,
  "web_search": {
    "enable": true
  },
  "chunk_index": 0
}
```

### 响应格式

```json
{
  "choices": [
    {
      "delta": {
        "content": "助手回复的内容片段",
        "reasoning_content": "思考过程片段"
      },
      "finish_reason": "stop" // 或 "length"、null
    }
  ],
  "search_result": {
    "data": {
      "webPages": {
        "value": [
          {
            "url": "https://example.com",
            "title": "页面标题"
          }
        ]
      }
    }
  }
}
```

## 实现原理

1. **轮询机制**: 使用 `chunk_index` 参数告诉后端返回第几个数据块
2. **内容累积**: 客户端累积每次请求返回的内容片段
3. **状态管理**: 通过 `finish_reason` 判断是否完成
4. **错误处理**: 完善的错误捕获和重试机制
5. **中断支持**: 支持用户中断正在进行的对话

## 注意事项

1. 此实现需要后端支持分块返回数据
2. 轮询间隔为 100ms，可根据需要调整
3. 最大轮询次数为 50 次，防止无限循环
4. 建议在生产环境中添加网络异常重试机制 