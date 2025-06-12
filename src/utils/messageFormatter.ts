/**
 * 格式化时间戳为可读时间
 */
export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - timestamp
  
  // 如果是今天的消息，只显示时间
  if (date.toDateString() === now.toDateString()) {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }
  
  // 如果是昨天的消息
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }
  
  // 如果是更早的消息，显示完整日期
  return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

/**
 * 格式化消息内容，处理换行和特殊字符
 */
export const formatMessageContent = (content: string): string => {
  return content
    .replace(/\n\n/g, '\n') // 减少过多的空行
    .replace(/^\s+|\s+$/g, '') // 去除首尾空白
}

/**
 * 检查消息是否为空或只包含空白字符
 */
export const isEmptyMessage = (content: string): boolean => {
  return !content || content.trim().length === 0
}

/**
 * 截断过长的消息内容
 */
export const truncateMessage = (content: string, maxLength: number = 100): string => {
  if (content.length <= maxLength) {
    return content
  }
  return content.slice(0, maxLength) + '...'
} 