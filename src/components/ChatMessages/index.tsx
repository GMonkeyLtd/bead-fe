import { ScrollView, View } from "@tarojs/components";
import styles from "./index.module.scss";
import { ChatMessageItem } from "@/utils/api-session";
import ChatLoading from "../ChatLoading";

export default function ChatMessages({
  messages,
  isChatting,
  maxHeight,
}: {
  messages: ChatMessageItem[];
  isChatting: boolean;
  maxHeight?: string;
}) {
  console.log(messages, "messages");
  return (
    <ScrollView
      enhanced
      scrollY
      style={{ height: maxHeight }}
      showScrollbar={false}
    >
      <View className={styles.chatMessagesContainer}>
        {messages.map((message) => {
          return message.role === "assistant" ? (
            <AssistantMessage key={message.message_id} message={message} />
          ) : (
            <UserMessage key={message.message_id} message={message} />
          );
        })}
      </View>
      {isChatting && <ChatLoading text="正在设计新方案..." style={{ marginTop: "12px" }} />}
    </ScrollView>
  );
}

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
