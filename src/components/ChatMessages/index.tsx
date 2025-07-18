import { ScrollView, View, Image } from "@tarojs/components";
import styles from "./index.module.scss";
import apiSession, { BraceletDraft, ChatMessageItem } from "@/utils/api-session";
import ChatLoading from "../ChatLoading";
import { BraceletDraftCard } from "../BraceletDraftCard";

export default function ChatMessages({
  sessionId,
  messages,
  isChatting,
  maxHeight,
}: {
  sessionId: string;
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
            <View key={message.message_id}>
              <AssistantMessage message={message} />
              {message.draft_id && <BraceletDraftCard sessionId={sessionId} draftId={message.draft_id} />}
            </View>
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


