


/**
 * 检查消息是否为空或只包含空白字符
 */
export const isEmptyMessage = (content: string): boolean => {
  return !content || content.trim().length === 0
}

