import { ScrollView, View, Image } from "@tarojs/components";
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import styles from "./index.module.scss";
import apiSession, {
  BraceletDraft,
  ChatMessageItem,
} from "@/utils/api-session";
import ChatLoading from "../ChatLoading";
import { BraceletDraftCard } from "../BraceletDraftCard";
import { DotImageData } from "@/hooks/useCircleRingCanvas";
import { LoadingDots } from "../ChatLoading";

export interface ChatMessagesRef {
  scrollToBottom: () => void;
  scrollToIndex: (index: number) => void;
}

// 消息项组件 - 使用 React.memo 优化渲染性能
const MessageItem = React.memo(({
  message,
  sessionId,
  generateBraceletImage,
  animationDelay = 0,
}: {
  message: ChatMessageItem;
  sessionId: string;
  generateBraceletImage: (beads: DotImageData[]) => Promise<string>;
  animationDelay?: number;
}) => {
  const messageStyle = {
    animationDelay: `${animationDelay}ms`,
  };

  return message.role === "assistant" ? (
    <View
      key={message.message_id}
      className={styles.chatMessageItemContainer}
      id={`message-${message.message_id}`}
      style={messageStyle}
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
      style={messageStyle}
    >
      <UserMessage message={message} />
      {message.draft_id && (
        <BraceletDraftCard
          sessionId={sessionId}
          draftId={message.draft_id}
          draftIndex={message.draft_index}
          generateBraceletImage={generateBraceletImage}
        />
      )}
    </View>
  );
});

export default forwardRef<
  ChatMessagesRef,
  {
    sessionId: string;
    messages: ChatMessageItem[];
    isChatting: boolean;
    maxHeight?: string;
    generateBraceletImage: (beads: DotImageData[]) => Promise<string>;
    autoScrollToBottom?: boolean;
    hasMoreMessages?: boolean;
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
      hasMoreMessages = false,
    },
    ref
  ) => {
    const [scrollAnchor, setScrollAnchor] = useState<string>("");
    const scrollViewRef = useRef<any>(null);
    const [scrollTop, setScrollTop] = useState(0);
    console.log('messages', messages);


    // 使用 useMemo 缓存消息列表，避免不必要的重新渲染
    const messageItems = useMemo(() => {
      return messages.map((message, index) => {
        // 为新消息添加递增的动画延迟，让消息依次出现
        // 只有最近的消息才添加延迟，避免历史消息重复动画
        const isRecentMessage = index >= messages.length - 3;
        const animationDelay = hasMoreMessages && isRecentMessage ? 
          (messages.length - 1 - index) * 100 : 0;
        
        return (
          <MessageItem
            key={message.message_id}
            message={message}
            sessionId={sessionId}
            generateBraceletImage={generateBraceletImage}
            animationDelay={animationDelay}
          />
        );
      });
    }, [messages, sessionId, generateBraceletImage, hasMoreMessages]);

    const scrollToBottom = useCallback(() => {
      // 使用 setTimeout 确保 DOM 更新完成后再设置 scrollIntoView
      setTimeout(() => {
        setScrollAnchor("scrollViewbottomAnchor");
        // 备用方案：如果 scrollIntoView 不工作，使用 scrollTop
        setTimeout(() => {
          setScrollTop(9999);
        }, 200);
      }, 100);
    }, []);

    const scrollToIndex = useCallback((index: number) => {
      if (messages[index]) {
        setTimeout(() => {
          setScrollAnchor(`message-${messages[index].message_id}`);
        }, 100);
      }
    }, [messages]);

    useImperativeHandle(ref, () => ({
      scrollToBottom,
      scrollToIndex,
    }));

    // 监听消息变化，自动滚动到底部
    useEffect(() => {
      if (autoScrollToBottom && messages.length > 0) {
        scrollToBottom();
      }
    }, [messages.length, autoScrollToBottom, scrollToBottom]);

    // 监听聊天状态变化，当开始聊天时滚动到底部
    useEffect(() => {
      if (isChatting) {
        scrollToBottom();
      }
    }, [isChatting, scrollToBottom]);

    // 监听 scrollAnchor 变化，滚动完成后清除
    useEffect(() => {
      if (scrollAnchor) {
        const timer = setTimeout(() => {
          setScrollAnchor("");
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
        {messageItems}
        {hasMoreMessages && (
          <LoadingDots />
        )}
        {isChatting && (
          <View className={styles.chatMessageItemContainer}>
            <ChatLoading text="正在设计新方案..." />
          </View>
        )}
        <View
          id="scrollViewbottomAnchor"
          style={{ height: "1px", width: "100%" }}
        />
      </ScrollView>
    );
  }
);

// 使用 React.memo 优化消息组件渲染
export const AssistantMessage = React.memo(({ message }: { message: ChatMessageItem }) => {
  return (
    <View className={styles.assistantMessageContainer}>
      <View className={styles.assistantMessageBubble}>
        <View className={styles.assistantMessageText}>{message.content}</View>
      </View>
    </View>
  );
});

export const UserMessage = React.memo(({ message }: { message: ChatMessageItem }) => {
  return (
    <View className={styles.userMessageContainer}>
      <View className={styles.userMessageBubble}>
        <View className={styles.userMessageText}>{message.content}</View>
      </View>
    </View>
  );
});
