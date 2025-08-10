import { ASSISTANT_GUIDE_TAG } from "@/config/beads";
import { MessageItem } from "./api-session";

/**
 * 检查消息是否为空或只包含空白字符
 */
export const isEmptyMessage = (content: string): boolean => {
  return !content || content.trim().length === 0;
};

export const splitMessageItem = (message: MessageItem): MessageItem[] => {
  const contentParts = message?.content
    .split("\n")
    .filter((part) => part.trim());

  const guideTagIndex = contentParts.findIndex((part) =>
    part.includes(ASSISTANT_GUIDE_TAG)
  );
  console.log(guideTagIndex, contentParts);

  const splitMessages = contentParts.map((part, index) => {
    let partContent = part;
    const isLastMessage = index === contentParts.length - 1;

    let draftData = {};
    if (message.draft_id) {
      // 如果有引导语, 且引导语不为第一句，则draft放在引导语前
      if (guideTagIndex > 0 && index === guideTagIndex - 1) {
        draftData = {
          draft_id: (message as any).draft_id,
          draft_index: (message as any).draft_index,
        };
      } else if (
        (guideTagIndex === -1 || guideTagIndex === 0) &&
        isLastMessage
      ) {
        // 如果没有引导语或者引导语为第一句，则draft放在最后一条消息后
        draftData = {
          draft_id: (message as any).draft_id,
          draft_index: (message as any).draft_index,
        };
      }
    }

    return {
      message_id: `${message.message_id}_${index}`,
      role: message.role,
      content: partContent.replace(ASSISTANT_GUIDE_TAG, ""),
      created_at: message.created_at,
      ...draftData,
      ...(isLastMessage && {
        recommends: (message as any).recommends,
      }),
    } as MessageItem;
  });
  return splitMessages;
};

export const splitMessage = (
  message: MessageItem | MessageItem[]
): MessageItem[] => {
  if (Array.isArray(message)) {
    return [...message.flatMap((item: MessageItem) => splitMessageItem(item))];
  }
  return splitMessageItem(message);
};
