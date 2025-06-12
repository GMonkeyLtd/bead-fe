import React, { useState, useRef, useEffect } from 'react'
import { View, Text, Textarea, Button } from '@tarojs/components'
import { useChatStreamTaro, type ChatMessage } from '../../hooks/useChatStreamTaro'
import { formatTime, formatMessageContent, isEmptyMessage } from '../../utils/messageFormatter'
import './index.scss'
import Taro from '@tarojs/taro'

const ChatPage: React.FC = () => {
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const params = Taro.getCurrentInstance()?.router?.params;
  console.log(params, 'params')
  
  const {
    messages,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    clearMessages
  } = useChatStreamTaro({
    // apiUrl: '/api/chat/stream',
    onError: (error) => {
      Taro.showToast({
        title: '聊天错误:' + error.message,
        icon: 'none'
      })
    },
    onComplete: () => {
      console.log('回复完成')
    }
  })

  // 自动滚动到底部
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 发送消息
  const handleSend = async () => {
    if (isEmptyMessage(inputValue) || isLoading || isStreaming) return
    
    const message = inputValue.trim()
    setInputValue('')
    await sendMessage(message)
  }

  // 处理输入框确认事件
  const handleConfirm = () => {
    handleSend()
  }

  // 渲染消息
  const renderMessage = (message: ChatMessage) => (
    <View key={message.id} className={`message ${message.role}`}>
      <View className="message-content">
        {formatMessageContent(message.content) || (message.role === 'assistant' && isStreaming ? '正在思考...' : '')}
      </View>
      <View className="message-time">
        {formatTime(message.timestamp)}
      </View>
    </View>
  )

  // 渲染打字指示器
  const renderTypingIndicator = () => (
    <View className="typing-indicator">
      <Text>AI正在回复</Text>
      <View className="dots">
        <View className="dot" />
        <View className="dot" />
        <View className="dot" />
      </View>
    </View>
  )

  return (
    <View className="chat-container">
      {/* 头部 */}
      <View className="chat-header">
        <Text className="title">AI助手</Text>
        <Text className="subtitle">与智能AI进行对话</Text>
      </View>

      {/* 主要聊天区域 */}
      <View className="chat-main">
        {/* 消息列表 */}
        <View className="messages-container">
          {messages.length === 0 ? (
            <View className="empty-state">
              <Text className="empty-icon">🤖</Text>
              <Text className="empty-text">
                开始与AI对话吧！{'\n'}
                我可以帮助您解答问题、提供建议或进行创作
              </Text>
            </View>
          ) : (
            <>
              {messages.map(renderMessage)}
              {isStreaming && renderTypingIndicator()}
            </>
          )}
          <View ref={messagesEndRef} />
        </View>

        {/* 错误提示 */}
        {error && (
          <View className="error-message">
            {error}
          </View>
        )}

        {/* 操作按钮 */}
        {messages.length > 0 && (
          <View className="actions">
            <Button 
              className="clear-button"
              onClick={clearMessages}
              disabled={isLoading || isStreaming}
            >
              清空对话
            </Button>
          </View>
        )}
      </View>

      {/* 输入区域 */}
      <View className="input-container">
        <View className="input-wrapper">
                     <Textarea
             className="message-input"
             value={inputValue}
             placeholder="输入您的问题..."
             onInput={(e) => setInputValue(e.detail.value)}
             onConfirm={handleConfirm}
             disabled={isLoading || isStreaming}
             maxlength={2000}
             autoHeight
           />
          <Button
            className="send-button"
            onClick={handleSend}
                         disabled={isEmptyMessage(inputValue) || isLoading || isStreaming}
          >
            {isLoading ? '...' : isStreaming ? '⏸' : '➤'}
          </Button>
        </View>
      </View>
    </View>
  )
}

export default ChatPage
