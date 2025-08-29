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
import { LoadingDots } from "../ChatLoading";

export interface ChatMessagesRef {
  scrollToBottom: () => void;
  scrollToIndex: (index: number) => void;
}

// 消息项组件 - 使用 React.memo 优化渲染性能
const MessageItem = React.memo(({
  message,
  sessionId,
  animationDelay = 0,
  shouldLoadImage = true,
  onImageLoaded,
  isLatestDraft = false,
  byMerchant = false,
}: {
  message: ChatMessageItem;
  sessionId: string;
  animationDelay?: number;
  shouldLoadImage?: boolean;
  onImageLoaded?: (messageId: string) => void;
  isLatestDraft?: boolean;
  byMerchant?: boolean;
}) => {
  const messageStyle = {
    animationDelay: `${animationDelay}ms`,
  };

  return ["assistant", 'system'].includes(message.role) ? (
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
          shouldLoad={shouldLoadImage}
          onImageLoaded={() => onImageLoaded?.(message.message_id)}
          canRegenerate={isLatestDraft && !byMerchant}
          byMerchant={byMerchant}
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
          shouldLoad={shouldLoadImage}
          onImageLoaded={() => onImageLoaded?.(message.message_id)}
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
    autoScrollToBottom?: boolean;
    hasMoreMessages?: boolean;
    byMerchant?: boolean;
  }
>(
  (
    {
      sessionId,
      messages,
      isChatting,
      maxHeight,
      autoScrollToBottom = true,
      hasMoreMessages = false,
      byMerchant = false,
    },
    ref
  ) => {
    const [scrollAnchor, setScrollAnchor] = useState<string>("");
    const scrollViewRef = useRef<any>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [loadedMessageIds, setLoadedMessageIds] = useState<Set<string>>(new Set());

    // 标记消息为已加载
    const markMessageAsLoaded = useCallback((messageId: string) => {
      setLoadedMessageIds(prev => new Set([...prev, messageId]));
    }, []);

    // 计算消息的加载优先级：底部消息优先加载，顶部消息延迟加载
    const getMessageLoadPriority = useCallback((index: number, messageId: string) => {
      const totalMessages = messages.length;
      if (totalMessages === 0) return true;
      
      // 如果已经加载过，直接返回true
      if (loadedMessageIds.has(messageId)) {
        return true;
      }
      
      // 底部3条消息立即加载，其他消息延迟加载
      const shouldLoadImmediately = index >= totalMessages - 3;
      
      // 如果不在底部3条，但有draft_id，延迟加载
      if (!shouldLoadImmediately && messageId) {
        // 延迟加载：2秒后开始加载
        setTimeout(() => {
          if (!loadedMessageIds.has(messageId)) {
            markMessageAsLoaded(messageId);
          }
        }, 2000 + (totalMessages - index) * 500); // 越靠上的消息延迟越长
      }
      
      return shouldLoadImmediately;
    }, [messages.length, loadedMessageIds, markMessageAsLoaded]);

    // 使用 useMemo 缓存消息列表，避免不必要的重新渲染
    const messageItems = useMemo(() => {
      const lastAssistantMessageWithDraft = messages.findLastIndex(message => message.draft_id);
      return messages.map((message, index) => {
        // 为新消息添加递增的动画延迟，让消息依次出现
        // 只有最近的消息才添加延迟，避免历史消息重复动画
        const isRecentMessage = index >= messages.length - 3;
        const animationDelay = hasMoreMessages && isRecentMessage ? 
          (messages.length - 1 - index) * 100 : 0;
        
        // 计算是否应该立即加载图像
        const shouldLoadImage = getMessageLoadPriority(index, message.message_id);

        const isLatestDraft = index === lastAssistantMessageWithDraft;
        
        return (
          <MessageItem
            key={message.message_id}
            message={message}
            sessionId={sessionId}
            animationDelay={animationDelay}
            shouldLoadImage={true}
            onImageLoaded={markMessageAsLoaded}
            isLatestDraft={isLatestDraft}
            byMerchant={byMerchant}     
          />
        );
      });
    }, [messages, sessionId, hasMoreMessages, getMessageLoadPriority]);

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

    // 滚动监听，当滚动到顶部时加载更多消息的图像
    const handleScroll = useCallback((e: any) => {
      const { scrollTop } = e.detail;
      // 如果滚动到顶部附近，加载更多消息的图像
      if (scrollTop < 100) {
        // 加载前5条消息的图像
        messages.slice(0, 5).forEach(message => {
          if (!loadedMessageIds.has(message.message_id)) {
            markMessageAsLoaded(message.message_id);
          }
        });
      }
    }, [messages, loadedMessageIds, markMessageAsLoaded]);

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
        onScroll={handleScroll}
      >
        {messageItems}
        {hasMoreMessages && (
          <LoadingDots />
        )}
        {isChatting && (
          <View className={styles.chatMessageItemContainer}>
            <ChatLoading text="正在分析中..." />
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
