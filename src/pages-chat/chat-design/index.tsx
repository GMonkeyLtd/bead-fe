import Taro from "@tarojs/taro";
import { View, Text, Image, Textarea, Canvas } from "@tarojs/components";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import PageContainer from "@/components/PageContainer";
import apiSession, { ChatMessageItem } from "@/utils/api-session";
import styles from "./index.module.scss";
import { ASSISTANT_AVATAR_IMAGE_URL } from "@/config";
import ChatMessages from "@/components/ChatMessages";
import sendSvg from "@/assets/icons/send.svg";
import { isEmptyMessage, splitMessage } from "@/utils/messageFormatter";
import activeSendSvg from "@/assets/icons/active-send.svg";
import TagList from "@/components/TagList";
import { useCircleRingCanvas } from "@/hooks/useCircleRingCanvas";
import { ChatMessagesRef } from "@/components/ChatMessages";
import { pageUrls } from "@/config/page-urls";

const INPUT_HEIGHT = 58 + 24;
const INPUT_RECOMMEND_HEIGHT = 90 + 24;

const ChatDesign = () => {
  const params = Taro.getCurrentInstance()?.router?.params;
  const { session_id, year, month, day, hour, gender, isLunar } = params || {};

  const [isDesigning, setIsDesigning] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [recommendTags, setRecommendTags] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState(session_id || "");
  const chatMessagesRef = useRef<ChatMessagesRef>(null);

  const { canvasProps, generateCircleRing: generateBraceletImage } =
    useCircleRingCanvas({
      targetSize: 1024,
      isDifferentSize: true,
      fileType: "png",
      canvasId: "chat-design-canvas",
    });

  const spareHeight = useMemo(() => {
    const inputHeight =
      recommendTags?.length > 0 ? INPUT_RECOMMEND_HEIGHT : INPUT_HEIGHT;
    return inputHeight;
  }, [recommendTags]);

  const initChat = ({
    birth_year,
    birth_month,
    birth_day,
    birth_hour,
    sex,
    is_lunar,
  }: {
    birth_year: number;
    birth_month: number;
    birth_day: number;
    birth_hour: number;
    sex: number;
    is_lunar: boolean;
  }) => {
    setIsDesigning(true);

    apiSession
      .createSession(
        {
          birth_info: {
            birth_year,
            birth_month,
            birth_day,
            birth_hour,
            is_lunar,
            sex,
          },
        },
        {
          showLoading: false,
        }
      )
      .then((res) => {
        const data = res.data || {};
        if (data.session_id) {
          setSessionId(data.session_id);
        }
      })
      .catch((err) => {
        Taro.showToast({
          title: "获取会话失败:" + JSON.stringify(err),
          icon: "none",
        });
      })
      .finally(() => {
        setIsDesigning(false);
      });
  };

  const querySessionHistory = (session_id: string) => {
    apiSession.getChatHistory({ session_id }).then((res) => {
      const messages = res.data.messages || [];
      const messagesWithoutUserInfo = messages.filter(
        (message, index) => !(message.role == "user" && index === 0)
      );
      const splitMessages = splitMessage(messagesWithoutUserInfo);
      let draftIndex = 1;
      const newMessages = splitMessages.map((message) => {
        if (message.draft_id) {
          message.draft_index = draftIndex;
          draftIndex++;
        }
        return message;
      });
      setChatMessages(newMessages);
      // 获取newMessages中最后一个role为assistant的message
      const lastAssistantMessage = newMessages.findLast(
        (message) => message.role === "assistant"
      );
      if (lastAssistantMessage?.recommends?.length > 0) {
        setRecommendTags(lastAssistantMessage.recommends);
      }
    });
  };

  useEffect(() => {
    if (sessionId) {
      querySessionHistory(sessionId);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      return;
    }
    if (year && month && day && hour && gender && isLunar) {
      initChat({
        birth_year: parseInt(year || "0") || 0,
        birth_month: parseInt(month || "0") || 0,
        birth_day: parseInt(day || "0") || 0,
        birth_hour: parseInt(hour || "0") || 0,
        sex: parseInt(gender || "0"),
        is_lunar: isLunar === "true" ? true : false,
      });
    }
  }, [year, month, day, hour, gender, isLunar]);

  const renderAssistant = () => {
    return (
      <View className={styles.assistantAvatarContainer}>
        <Image
          src={ASSISTANT_AVATAR_IMAGE_URL}
          className={styles.assistantAvatar}
        />
        <Text className={styles.assistantName}>梨莉莉</Text>
        <View
          className={styles.assistantName}
          onClick={() => {
            Taro.redirectTo({
            url: pageUrls.home + "?newSession=true",
          })}}
        >
          重置信息
        </View>
      </View>
    );
  };

  // 发送消息
  const handleSend = async (tag) => {
    const content = inputValue || tag;
    if (isEmptyMessage(content) || isDesigning) return;
    setChatMessages((prev) => [
      ...prev,
      {
        message_id: Date.now().toString(),
        role: "user",
        content,
        created_at: new Date().toISOString(),
      },
    ]);
    chatMessagesRef.current?.scrollToBottom();
    setIsDesigning(true);
    setInputValue("");
    apiSession
      .chat({
        session_id: sessionId,
        message: content,
      })
      .then((res) => {
        setChatMessages((prev) => {
          let draftIndex = 1;
          // 检查content是否包含换行符，如果包含则拆分成多个消息
          const splitMessages = splitMessage(res.data);
          const newMessages = [...prev, ...splitMessages].map(
            (message, index) => {
              if (message.draft_id) {
                message.draft_index = draftIndex;
                draftIndex++;
              }
              return message;
            }
          );
          return newMessages;
        });
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

  const handleKeyboardHeightChange = useCallback((height: number) => {
    if (height > 0) {
      chatMessagesRef.current?.scrollToBottom();
    }
  }, []);

  return (
    <PageContainer
      headerContent={isDesigning ? "正在设计新方案..." : null}
      headerExtraContent={isDesigning ? null : renderAssistant()}
      showHome={false}
      onKeyboardHeightChange={handleKeyboardHeightChange}
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
