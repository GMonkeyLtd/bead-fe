import Taro from "@tarojs/taro";
import { View, Text, Image, Textarea } from "@tarojs/components";
import { useEffect, useState, useMemo } from "react";
import { beadsApi } from "@/utils/api";
import PageContainer from "@/components/PageContainer";
import { useDesign } from "@/store/DesignContext";
import { pageUrls } from "@/config/page-urls";
import apiSession, { ChatMessageItem } from "@/utils/api-session";
import CrystalButton from "@/components/CrystalButton";
import styles from "./index.module.scss";
import assistantAvatar from "@/assets/assistant-avatar.svg";
import ChatLoading from "@/components/ChatLoading";
import ChatMessages from "@/components/ChatMessages";
import { getNavBarHeightAndTop, getSafeArea } from "@/utils/style-tools";
import sendSvg from "@/assets/icons/send.svg";
import { isEmptyMessage } from "@/utils/messageFormatter";
import activeSendSvg from "@/assets/icons/active-send.svg";
import TagList from "@/components/TagList";
import { BRACELET_BG_IMAGE_URL } from "@/config";

const INPUT_HEIGHT = 58 + 24;

const ChatDesign = () => {
  const [isDesigning, setIsDesigning] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);
  const { height: navBarHeight, top: navBarTop } = getNavBarHeightAndTop();
  const [inputValue, setInputValue] = useState("");
  const [recommendTags, setRecommendTags] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState("19812bcc605b911e7980e89570b");
  console.log(chatMessages, "chatMessages");
  const safeArea = getSafeArea();
  console.log(safeArea, "safeArea");

  const spareHeight = useMemo(() => {
    let height = INPUT_HEIGHT;
    return height;
  }, [navBarHeight, navBarTop]);

  useEffect(() => {
    apiSession.getSessionList({ page: 1, page_size: 10 }).then((res) => {
      console.log(res.data.sessions);
      setSessionId(res.data.sessions[0].session_id);
    });
  }, []);

  useEffect(() => {
    if (!sessionId) {
      return;
    }
    apiSession
    .getChatHistory({ session_id: sessionId })
    .then((res) => {
      setChatMessages(res.data.messages || []);
    });
  }, [sessionId]);

  const renderAssistant = () => {
    return (
      <View className={styles.assistantAvatarContainer}>
        <Image src={assistantAvatar} className={styles.assistantAvatar} />
        <Text className={styles.assistantName}>梨莉莉</Text>
      </View>
    );
  };

  const handleSend = () => {
    setIsDesigning((prev) => !prev);
  };

  return (
    <PageContainer
      headerContent={isDesigning ? "正在设计新方案..." : null}
      headerExtraContent={isDesigning ? null : renderAssistant()}
      showHome={false}
    >
      <View className={styles.chatContainer}>
        <ChatMessages
          messages={chatMessages}
          isChatting={isDesigning}
          maxHeight={`calc(100% - ${spareHeight}px)`}
          sessionId={sessionId}
        />
        
        <View className={styles.inputContainer}>
          {recommendTags?.length > 0 && (
            <TagList
              tags={recommendTags?.map((item) => ({
                id: item,
                title: item,
              }))}
              onTagSelect={(tag) => {
                handleSend(tag.title);
                // setInputValue((prev) =>
                //   !isEmptyMessage(prev) ? prev + "，" + tag.title : tag.title
                // );
              }}
            />
          )}
          <View className={styles.inputWrapper}>
            <Textarea
              className={styles.messageInput}
              value={inputValue}
              placeholder="输入您的定制需求..."
              placeholderStyle="color: #00000033;"
              onInput={(e) => setInputValue(e.detail.value)}
              onConfirm={handleSend}
              autoHeight
              adjustPosition={false}
              // adjustKeyboardTo="bottom"
              // onFocus={() => {
              //   setKeyboardHeight(90);
              // }}
              // onBlur={() => {
              //   setKeyboardHeight(0);
              // }}
              showConfirmBar={false}
            />
            <Image
              src={!isEmptyMessage(inputValue) ? activeSendSvg : sendSvg}
              style={{ width: "26px", height: "26px" }}
              onClick={handleSend}
            />
          </View>
        </View>
      </View>
    </PageContainer>
  );
};

export default ChatDesign;
