import { MessageItem } from "./api-session";

/**
 * 检查消息是否为空或只包含空白字符
 */
export const isEmptyMessage = (content: string): boolean => {
  return !content || content.trim().length === 0
}

export const splitMessageItem = (message: MessageItem): MessageItem[] => {
  if (message?.content?.includes("\n")) {
    const contentParts = message?.content
      .split("\n")
      .filter((part) => part.trim());
    const splitMessages = contentParts.map((part, index) => {
      const isLastMessage = index === contentParts.length - 1;
      return {
        message_id: `${message.message_id}_${index}`,
        role: message.role,
        content: part.trim(),
        created_at: message.created_at,
        // 只有最后一个消息包含draft信息
        ...(isLastMessage && {
          draft_id: (message as any).draft_id,
          draft_index: (message as any).draft_index,
          recommends: (message as any).recommends,
        }),
      } as MessageItem;
    });
    return splitMessages;
  }
  return [message];
}

export const splitMessage = (message: MessageItem | MessageItem[]): MessageItem[] => {
  if (Array.isArray(message)) {
    return message.flatMap((item: MessageItem) => splitMessageItem(item));
  }
  return splitMessageItem(message);
}
