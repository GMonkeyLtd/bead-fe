import { ScrollView, View, Image } from "@tarojs/components";
import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useState,
} from "react";
import styles from "./index.module.scss";
import apiSession, {
  BraceletDraft,
  ChatMessageItem,
} from "@/utils/api-session";
import ChatLoading from "../ChatLoading";
import { BraceletDraftCard } from "../BraceletDraftCard";
import { DotImageData } from "@/hooks/useCircleRingCanvas";

export interface ChatMessagesRef {
  scrollToBottom: () => void;
  scrollToIndex: (index: number) => void;
}

export default forwardRef<
  ChatMessagesRef,
  {
    sessionId: string;
    messages: ChatMessageItem[];
    isChatting: boolean;
    maxHeight?: string;
    generateBraceletImage: (beads: DotImageData[]) => Promise<string>;
    autoScrollToBottom?: boolean;
  }
>(
  (
    {
      sessionId,
      messages,
      isChatting,
      maxHeight,
      generateBraceletImage,
      autoScrollToBottom = true,
    },
    ref
  ) => {
    const [scrollAnchor, setScrollAnchor] = useState<string>('');
    const scrollViewRef = useRef<any>(null);

    const [scrollTop, setScrollTop] = useState(0);

      const scrollToBottom = () => {
    // 使用 setTimeout 确保 DOM 更新完成后再设置 scrollIntoView
    setTimeout(() => {
      setScrollAnchor("scrollViewbottomAnchor");
      // 备用方案：如果 scrollIntoView 不工作，使用 scrollTop
      setTimeout(() => {
        setScrollTop(9999);
      }, 200);
    }, 100);
  };

    useImperativeHandle(ref, () => ({
      scrollToBottom,
      scrollToIndex: (index: number) => {
        if (messages[index]) {
          setTimeout(() => {
            setScrollAnchor(`message-${messages[index].message_id}`);
          }, 100);
        }
      },
    }));

      // 监听消息变化，自动滚动到底部
  useEffect(() => {
    if (autoScrollToBottom && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, autoScrollToBottom]);

  // 监听聊天状态变化，当开始聊天时滚动到底部
  useEffect(() => {
    if (isChatting) {
      scrollToBottom();
    }
  }, [isChatting]);

  // 监听 scrollAnchor 变化，滚动完成后清除
  useEffect(() => {
    if (scrollAnchor) {
      const timer = setTimeout(() => {
        setScrollAnchor('');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [scrollAnchor]);

    return (
      <ScrollView
        ref={scrollViewRef}
        enhanced
        scrollY
        scrollTop={scrollTop}
        style={{ height: maxHeight }}
        showScrollbar={false}
        enableFlex
        className={styles.chatMessagesContainer}
        scrollIntoView={scrollAnchor}
      >
        {messages.map((message) => {
          return message.role === "assistant" ? (
            <View
              key={message.message_id}
              className={styles.chatMessageItemContainer}
              id={`message-${message.message_id}`}
            >
              <AssistantMessage message={message} />
              {message.draft_id && (
                <BraceletDraftCard
                  sessionId={sessionId}
                  draftId={message.draft_id}
                  draftIndex={message.draft_index}
                  generateBraceletImage={generateBraceletImage}
                />
              )}
            </View>
          ) : (
            <View
              key={message.message_id}
              className={styles.chatMessageItemContainer}
              id={`message-${message.message_id}`}
            >
              <UserMessage message={message} />
            </View>
          );
        })}
        {isChatting && (
          <View className={styles.chatMessageItemContainer}>
            <ChatLoading
              text="正在设计新方案..."
            />
          </View>
        )}
        <View id="scrollViewbottomAnchor" style={{ height: '1px', width: '100%' }} />
      </ScrollView>
    );
  }
);

export const AssistantMessage = ({ message }: { message: ChatMessageItem }) => {
  return (
    <View className={styles.assistantMessageContainer}>
      <View className={styles.assistantMessageBubble}>
        <View className={styles.assistantMessageText}>{message.content}</View>
      </View>
    </View>
  );
};

export const UserMessage = ({ message }: { message: ChatMessageItem }) => {
  return (
    <View className={styles.userMessageContainer}>
      <View className={styles.userMessageBubble}>
        <View className={styles.userMessageText}>{message.content}</View>
      </View>
    </View>
  );
};
