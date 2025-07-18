import Taro from "@tarojs/taro";
import { View, Text, Image, Textarea, Canvas } from "@tarojs/components";
import { useEffect, useState, useMemo, useRef } from "react";
import PageContainer from "@/components/PageContainer";
import apiSession, { ChatMessageItem } from "@/utils/api-session";
import styles from "./index.module.scss";
import assistantAvatar from "@/assets/assistant-avatar.svg";
import ChatMessages from "@/components/ChatMessages";
import { getNavBarHeightAndTop, getSafeArea, getSafeAreaInfo } from "@/utils/style-tools";
import sendSvg from "@/assets/icons/send.svg";
import { isEmptyMessage } from "@/utils/messageFormatter";
import activeSendSvg from "@/assets/icons/active-send.svg";
import TagList from "@/components/TagList";
import { useCircleRingCanvas } from "@/hooks/useCircleRingCanvas";
import { ChatMessagesRef } from "@/components/ChatMessages";

const INPUT_HEIGHT = 58 + 24;
const INPUT_RECOMMEND_HEIGHT = 90 + 24;

const ChatDesign = () => {
  const params = Taro.getCurrentInstance()?.router?.params;
  const { session_id } = params || {};

  const [isDesigning, setIsDesigning] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);
  const { height: navBarHeight, top: navBarTop } = getNavBarHeightAndTop();
  const [inputValue, setInputValue] = useState("");
  const [recommendTags, setRecommendTags] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState(session_id || "");
  console.log(chatMessages, "chatMessages");
  const safeArea = getSafeArea();
  console.log(safeArea, "safeArea");
  const chatMessagesRef = useRef<ChatMessagesRef>(null);
  const { bottomHeight } = getSafeAreaInfo();

  const {
    getResult: getBraceletImage,
    canvasProps,
    generateCircleRing: generateBraceletImage,
    clearAllResults: clearAllBraceletImages,
  } = useCircleRingCanvas({
    targetSize: 1024,
    isDifferentSize: true,
    fileType: "png",
    canvasId: "chat-design-canvas",
  });

  console.log(keyboardHeight, "sessionId");

  const spareHeight = useMemo(() => {
    const inputHeight = recommendTags?.length > 0 ? INPUT_RECOMMEND_HEIGHT : INPUT_HEIGHT;
    return inputHeight + bottomHeight;
  }, [navBarHeight, navBarTop, recommendTags]);
console.log(spareHeight, "spareHeight");

  useEffect(() => {
    // 监听键盘弹起
    const onKeyboardHeightChange = (res) => {
      setKeyboardHeight(res.height);
    };

    // 小程序键盘事件监听
    Taro.onKeyboardHeightChange &&
      Taro.onKeyboardHeightChange(onKeyboardHeightChange);
    apiSession.getSessionList({ page: 1, page_size: 10 }).then((res) => {
      console.log(res.data.sessions);
      // setSessionId(res.data.sessions[0].session_id);
    });
    return () => {
      // 清理监听器
      Taro.offKeyboardHeightChange &&
        Taro.offKeyboardHeightChange(onKeyboardHeightChange);
      document.documentElement.style.removeProperty("--keyboard-height");
    };
  }, []);

  useEffect(() => {
    if (!sessionId) {
      return;
    }
    apiSession.getChatHistory({ session_id: sessionId }).then((res) => {
      const messages = res.data.messages || [];
      let draftImageIndex = 1;
      messages.forEach((message) => {
        if (message.draft_id) {
          message.draft_index = draftImageIndex;
          draftImageIndex++;
        }
      });
      setChatMessages(messages);
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

    // 发送消息
    const handleSend = async (tag) => {
      const content = inputValue || tag;
      if (isEmptyMessage(content) || isDesigning) return;
      setChatMessages((prev) => [...prev, {
        message_id: Date.now().toString(),
        role: "user",
        content,
        created_at: new Date().toISOString(),
      }]);
      chatMessagesRef.current?.scrollToBottom();
      setIsDesigning(true);
      setInputValue("");
      apiSession
        .chat({
          session_id: sessionId,
          message: content,
        }
      )
        .then((res) => {
          console.log(res.data, "res.data");
          setChatMessages((prev) => [...prev, res.data]);
          if (res.data.recommends?.length > 0) {
            setRecommendTags(res.data.recommends);
          }
        })
        .catch((err) => {
          Taro.showToast({
            title: "定制失败:" + JSON.stringify(err),
            icon: "none",
          });
        })
        .finally(() => {
          setIsDesigning(false);
        });
    };


  return (
    <PageContainer
      headerContent={isDesigning ? "正在设计新方案..." : null}
      headerExtraContent={isDesigning ? null : renderAssistant()}
      showHome={false}
      keyboardHeight={keyboardHeight}
    >
      <View className={styles.chatContainer}>
        <ChatMessages
          ref={chatMessagesRef}
          messages={chatMessages}
          isChatting={isDesigning}
          maxHeight={`calc(100% - ${spareHeight}px)`}
          sessionId={sessionId}
          generateBraceletImage={generateBraceletImage}
        />

        {/* <BraceletDraftCard
          // sessionId={sessionId}
          // draftId="1981c49cadee802d0724015a690"
          draftData={draft?.data}
          generateBraceletImage={generateBraceletImage}
        /> */}

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
        <Canvas
          canvasId={canvasProps.canvasId}
          id={canvasProps.id}
          height={canvasProps.height}
          width={canvasProps.width}
          style={{
            ...canvasProps.style,
          }}
        />
      </View>
    </PageContainer>
  );
};

export default ChatDesign;
