import { useState, useCallback, useRef } from 'react'
import Taro from '@tarojs/taro'
import { AuthManager } from '../utils/auth'

export interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: number
  think?: string // 思考过程
  networkSearchResult?: any[] // 网络搜索结果
  stopped?: boolean // 是否被中断
}

export interface ChatStreamOptions {
  model?: string
  maxTokens?: number
  temperature?: number
  topP?: number
  repetitionPenalty?: number
  networkSearch?: boolean
}

export interface UseChatStreamOptions {
  apiUrl?: string
  streamOptions?: ChatStreamOptions
  onError?: (error: Error) => void
  onComplete?: (message: ChatMessage) => void
  onProgress?: (message: ChatMessage) => void
}

export interface UseChatStreamReturn {
  messages: ChatMessage[]
  isLoading: boolean
  isStreaming: boolean
  error: string | null
  sendMessageWithStream: (content: string) => Promise<void>
  sendMessage: (content: string) => Promise<void>
  clearMessages: () => void
  abortStream: () => void
}

export const useLLMChat = (options: UseChatStreamOptions = {}): UseChatStreamReturn => {
  const {
    apiUrl = 'https://api.modelverse.cn/v1/chat/completions',
    streamOptions = {},
    onError,
    onComplete,
    onProgress
  } = options

  const {
    model = 'deepseek-ai/DeepSeek-V3-0324',
    maxTokens = 4096,
    temperature = 0.7,
    topP = 1.0,
    repetitionPenalty = 1.0,
    networkSearch = false
  } = streamOptions

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestTaskRef = useRef<any>(null)
  const currentMessageIdRef = useRef<string | null>(null)

  const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // 获取认证token
  const getAuthToken = async (): Promise<string> => {
    try {
      const token = await AuthManager.getToken();
      if (!token) {
        throw new Error('获取认证token失败');
      }
      return token;
    } catch (error) {
      console.error('获取认证token失败:', error);
      // 如果是LLM聊天，可能需要特殊的token，这里使用默认值作为fallback
      return 'wJ3OWcMvq62Bzblb5009DeB8-aAb4-410e-b1a1-BcFf7cBf';
    }
  }

  const addUserMessage = (content: string): ChatMessage => {
    const message: ChatMessage = {
      id: generateId(),
      content,
      role: 'user',
      timestamp: Date.now()
    }
    setMessages(prev => [...prev, message])
    return message
  }

  const addAssistantMessage = (id: string): ChatMessage => {
    const message: ChatMessage = {
      id,
      content: '',
      role: 'assistant',
      timestamp: Date.now()
    }
    setMessages(prev => [...prev, message])
    return message
  }

  const updateAssistantMessage = (id: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id 
        ? { ...msg, ...updates }
        : msg
    ))
  }

  const abortStream = useCallback(() => {
    if (requestTaskRef.current) {
      requestTaskRef.current.abort()
      requestTaskRef.current = null
    }
    setIsStreaming(false)
    setIsLoading(false)
    currentMessageIdRef.current = null
  }, [])

  // 检查是否支持fetch
  const supportsFetch = () => {
    return typeof fetch !== 'undefined' && typeof ReadableStream !== 'undefined'
  }

  // 使用fetch实现真正的流式响应
  const sendMessageWithFetch = async (content: string, assistantMessageId: string, requestData: any) => {
    const abortController = new AbortController()
    requestTaskRef.current = abortController

    try {
      // 获取认证token
      const token = await getAuthToken();

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(requestData),
        signal: abortController.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法获取流读取器')
      }

      const decoder = new TextDecoder()
      let modelAnswer = ''
      let modelThink = ''
      let searchResult: any[] = []

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            
            if (data === '[DONE]') {
              setIsStreaming(false)
              const finalMessage: ChatMessage = {
                id: assistantMessageId,
                content: modelAnswer,
                role: 'assistant',
                timestamp: Date.now(),
                think: modelThink,
                networkSearchResult: searchResult
              }
              onComplete?.(finalMessage)
              return
            }

            try {
              const parsed = JSON.parse(data)
              
              if (parsed.error) {
                throw new Error(parsed.error)
              }

              if (parsed.choices && parsed.choices[0]) {
                const choice = parsed.choices[0]
                
                if (choice.delta?.content) {
                  modelAnswer += choice.delta.content
                }
                
                if (choice.delta?.reasoning_content) {
                  modelThink += choice.delta.reasoning_content
                }
                
                // 更新消息
                const updatedMessage: ChatMessage = {
                  id: assistantMessageId,
                  content: modelAnswer,
                  role: 'assistant',
                  timestamp: Date.now(),
                  think: modelThink,
                  networkSearchResult: searchResult
                }
                
                updateAssistantMessage(assistantMessageId, updatedMessage)
                onProgress?.(updatedMessage)
                
                if (choice.finish_reason === 'stop' || choice.finish_reason === 'length') {
                  setIsStreaming(false)
                  onComplete?.(updatedMessage)
                  return
                }
              }
            } catch (parseError) {
              console.warn('解析SSE数据失败:', parseError)
            }
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('请求被中止')
        return
      }
      throw error
    }
  }

  // 使用Taro.request的降级方案
  const sendMessageWithTaro = async (content: string, assistantMessageId: string, requestData: any) => {
    let modelAnswer = ''
    let modelThink = ''
    let searchResult: any[] = []
    let chunkIndex = 0
    const maxChunks = 50

    const processChunk = async (): Promise<void> => {
      if (chunkIndex >= maxChunks || !isStreaming) {
        setIsStreaming(false)
        return
      }

      try {
        // 获取认证token
        const token = await getAuthToken();

        const response = await Taro.request({
          url: apiUrl,
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          data: {
            ...requestData,
            chunk_index: chunkIndex
          }
        })

        if (response.statusCode === 200) {
          const data = response.data
          
          if (data.error) {
            throw new Error(data.error)
          }

          if (data.choices && data.choices[0]) {
            const choice = data.choices[0]
            
            if (choice.delta?.content) {
              modelAnswer += choice.delta.content
            }
            
            if (choice.delta?.reasoning_content) {
              modelThink += choice.delta.reasoning_content
            }
            
            const isFinished = choice.finish_reason === 'stop' || 
                              choice.finish_reason === 'length' ||
                              data.type === 'done'
            
            // 处理搜索结果
            if (data.search_result) {
              if (data.search_result?.data?.webPages?.value) {
                searchResult = data.search_result.data.webPages.value
              }
              if (data.search_result?.Pages) {
                searchResult = data.search_result.Pages
              }
              if (data.search_result?.annotations) {
                searchResult = data.search_result.annotations
                  ?.map((item: any) => item.url_citation)
                  .filter((item: any) => !!item)
              }
            }
            
            const updatedMessage: ChatMessage = {
              id: assistantMessageId,
              content: modelAnswer,
              role: 'assistant',
              timestamp: Date.now(),
              think: modelThink,
              networkSearchResult: searchResult
            }
            
            updateAssistantMessage(assistantMessageId, updatedMessage)
            onProgress?.(updatedMessage)
            
            if (isFinished) {
              setIsStreaming(false)
              onComplete?.(updatedMessage)
              return
            }
            
            chunkIndex++
            setTimeout(processChunk, 100)
          } else {
            setIsStreaming(false)
            const finalMessage: ChatMessage = {
              id: assistantMessageId,
              content: modelAnswer,
              role: 'assistant',
              timestamp: Date.now(),
              think: modelThink,
              networkSearchResult: searchResult
            }
            onComplete?.(finalMessage)
          }
        } else {
          throw new Error(`HTTP error! status: ${response.statusCode}`)
        }
      } catch (error) {
        setIsStreaming(false)
        setIsLoading(false)
        console.error('发送消息错误:', error)
        throw error
      }
    }

    await processChunk()
  }

  // 主要的发送消息函数
  const sendMessageWithStream = useCallback(async (content: string) => {
    console.log("sendMessage", content);
    try {
      setError(null)
      setIsLoading(true)

      // 添加用户消息
      const userMessage = addUserMessage(content.trim())
      
      // 创建助手消息
      const assistantMessageId = generateId()
      addAssistantMessage(assistantMessageId)
      currentMessageIdRef.current = assistantMessageId

      // 准备请求数据
      const requestData = {
        model: model,
        messages: [...messages, userMessage].map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        stream: true,
        max_tokens: maxTokens,
        temperature: temperature,
        top_p: topP,
        repetition_penalty: repetitionPenalty,
        web_search: { enable: networkSearch }
      }

      setIsLoading(false)
      setIsStreaming(true)

      // 优先使用fetch，不支持时降级使用Taro.request
      if (supportsFetch()) {
        console.log('使用fetch进行流式响应')
        await sendMessageWithFetch(content, assistantMessageId, requestData)
      } else {
        console.log('降级使用Taro.request进行分块响应')
        await sendMessageWithTaro(content, assistantMessageId, requestData)
      }

    } catch (err) {
      console.error('发送消息错误:', err)
      const errorMsg = err instanceof Error ? err.message : '发送失败，请重试'
      setError(errorMsg)
      onError?.(new Error(errorMsg))
      setIsLoading(false)
      setIsStreaming(false)
    }
  }, [messages, isLoading, isStreaming, apiUrl, model, maxTokens, temperature, topP, repetitionPenalty, networkSearch, onError, onComplete, onProgress])

  const clearMessages = useCallback(() => {
    abortStream()
    setMessages([])
    setError(null)
  }, [abortStream])

  const sendMessage = async (content: string) => {
    try {
      // 获取认证token
      const token = await getAuthToken();

      const response = await Taro.request({
        url: apiUrl,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        data: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: content }],
          max_tokens: maxTokens,
          temperature: temperature,
          top_p: topP,
          repetition_penalty: repetitionPenalty,
        })
      })
      
      const data = response.data;
      const assistantMessage = {
        id: generateId(),
        content: data.choices?.[0]?.message?.content || '',
        role: 'assistant' as const,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, assistantMessage])
      onComplete?.(assistantMessage)
      
      return assistantMessage.content;
    } catch (error) {
      console.error('发送消息失败:', error);
      const errorMsg = error instanceof Error ? error.message : '发送失败，请重试';
      setError(errorMsg);
      onError?.(new Error(errorMsg));
      throw error;
    }
  }

  return {
    messages,
    isLoading,
    isStreaming,
    error,
    sendMessageWithStream,
    sendMessage,
    clearMessages,
    abortStream
  }
} 