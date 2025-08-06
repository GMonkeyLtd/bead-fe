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
// 移除react-native导入，使用Taro的ViewProps
import TypewriterText from "@/components/TypewriterText";
import apiSession, {
  BraceletDraft,
  ChatMessageItem,
} from "@/utils/api-session";
import ChatLoading, { LoadingDots } from "../ChatLoading";
import { BraceletDraftCard } from "../BraceletDraftCard";
import styles from "./index.module.scss";

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
}: {
  message: ChatMessageItem & {
    isNew?: boolean;
    onTypingComplete?: () => void;
  };
  sessionId: string;
  animationDelay?: number;
  shouldLoadImage?: boolean;
  onImageLoaded?: (messageId: string) => void;
  onTypingComplete?: () => void;
}) => {
  const [isTypingComplete, setIsTypingComplete] = useState(!message.isNew);

  const handleTypingComplete = () => {
    setIsTypingComplete(true);
    if (message.onTypingComplete) {
      message.onTypingComplete();
    }
  };

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
      <AssistantMessage message={message} onTypingComplete={handleTypingComplete} />
      {message.draft_id && isTypingComplete && (
          <BraceletDraftCard
            sessionId={sessionId}
            draftId={message.draft_id}
            draftIndex={message.draft_index}
            shouldLoad={shouldLoadImage && isTypingComplete}
            onImageLoaded={() => onImageLoaded?.(message.message_id)}
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
    },
    ref
  ) => {
    const [scrollAnchor, setScrollAnchor] = useState<string>("");
    const scrollViewRef = useRef<any>(null);
    const [scrollTopState, setScrollTopState] = useState(0);
    const [loadedMessageIds, setLoadedMessageIds] = useState<Set<string>>(new Set());

    // 标记消息为已加载
    const markMessageAsLoaded = useCallback((messageId: string) => {
      setLoadedMessageIds(prev => new Set([...prev, messageId]));
    }, []);

    // 计算消息的加载优先级：底部消息优先加载，顶部消息延迟加载
    const getMessageLoadPriority = useCallback((index: number, messageId: string, tempId?: string) => {
      const totalMessages = messages.length;
      if (totalMessages === 0) return true;
      
      // 使用tempId或messageId作为标识符
      const id = tempId || messageId;
      
      // 如果已经加载过，直接返回true
      if (loadedMessageIds.has(id)) {
        return true;
      }
      
      // 底部3条消息立即加载，其他消息延迟加载
      const shouldLoadImmediately = index >= totalMessages - 3;
      
      // 如果不在底部3条，但有id，延迟加载
      if (!shouldLoadImmediately && id) {
        // 延迟加载：2秒后开始加载
        setTimeout(() => {
          if (!loadedMessageIds.has(id)) {
            markMessageAsLoaded(id);
          }
        }, 2000 + (totalMessages - index) * 500); // 越靠上的消息延迟越长
      }
      
      return shouldLoadImmediately;
    }, [messages.length, loadedMessageIds, markMessageAsLoaded]);

    // 使用 useMemo 缓存消息列表，避免不必要的重新渲染
    const messageItems = useMemo(() => {
      return messages.map((message, index) => {
        // 为新消息添加递增的动画延迟，让消息依次出现
        // 只有最近的消息才添加延迟，避免历史消息重复动画
        const isRecentMessage = index >= messages.length - 3;
        const animationDelay = hasMoreMessages && isRecentMessage ? 
          (messages.length - 1 - index) * 100 : 0;
        
        // 计算是否应该立即加载图像
        const shouldLoadImage = getMessageLoadPriority(index, message.message_id || '', message.tempId);
        
        return (
          <MessageItem
            key={message.message_id}
            message={message}
            sessionId={sessionId}
            animationDelay={animationDelay}
            shouldLoadImage={shouldLoadImage}
            onImageLoaded={markMessageAsLoaded}
          />
        );
      });
    }, [messages, sessionId, hasMoreMessages, getMessageLoadPriority]);

    const scrollToBottom = useCallback(() => {
      // 立即设置 scrollAnchor
      setScrollAnchor("scrollViewbottomAnchor");
      // 备用方案：直接设置一个足够大的 scrollTop 值
      setScrollTopState(100000);
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
        scrollTop={scrollTopState}
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
            <ChatLoading text='正在设计新方案...' />
          </View>
        )}
        <View
          id='scrollViewbottomAnchor'
          style={{ height: '1px', width: '100%' }}
        />
      </ScrollView>
    );
  }
);

// 使用 React.memo 优化消息组件渲染
export const AssistantMessage = React.memo(({ message, onTypingComplete }: { message: ChatMessageItem, onTypingComplete?: () => void }) => {
  return (
    <View className={styles.assistantMessageContainer}>
      <View className={styles.assistantMessageBubble}>
        <TypewriterText
          text={message.content || ''}
          isActive={!!message.isNew}
          speed={30}
          onComplete={onTypingComplete}
          className={styles.assistantMessageText}
        />
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
