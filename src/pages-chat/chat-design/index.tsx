import Taro from "@tarojs/taro";
import { View, Text, Image, Textarea, Canvas } from "@tarojs/components";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import PageContainer from "@/components/PageContainer";
import apiSession, { ChatMessageItem } from "@/utils/api-session";
import styles from "./index.module.scss";
import { LILI_AVATAR_IMAGE_URL } from "@/config";
import ChatMessages from "@/components/ChatMessages";
import sendSvg from "@/assets/icons/send.svg";
import { isEmptyMessage, splitMessage } from "@/utils/messageFormatter";
import activeSendSvg from "@/assets/icons/active-send.svg";
import TagList from "@/components/TagList";
import { ChatMessagesRef } from "@/components/ChatMessages";
import { pageUrls } from "@/config/page-urls";
import { getRecommendTemplate } from "@/utils/utils";

const INPUT_HEIGHT = 30 + 24 + 10;
const INPUT_RECOMMEND_HEIGHT = 30 + 30 + 24 + 16;

const INIT_MESSAGE = [
  "宝子！你终于来了，我是你的专属水晶疗愈师，可以叫我璞璞～",
  "我已经看到你的生辰啦，让我来给你详细分析一下📝",
];

const ChatDesign = () => {
  const params = Taro.getCurrentInstance()?.router?.params;
  const { year, month, day, hour, gender, isLunar, session_id } = params || {};
  const byMerchant = params?.is_merchant === "true";

  const [isDesigning, setIsDesigning] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [recommendTags, setRecommendTags] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState("");
  const chatMessagesRef = useRef<ChatMessagesRef>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const draftIndexRef = useRef(1);
  
  // 添加防重复执行的ref
  const hasInitializedRef = useRef(false);
  const hasShownInitMessagesRef = useRef(false);

  const spareHeight = useMemo(() => {
    const inputHeight =
      recommendTags?.length > 0 ? INPUT_RECOMMEND_HEIGHT : INPUT_HEIGHT;
    return inputHeight + 20;
  }, [recommendTags]);

  // 依次显示消息的函数
  const showMessagesSequentially = useCallback(
    (messages: ChatMessageItem[], recommends?: string[]) => {
      if (messages.length === 0) return;

      setHasMoreMessages(true);
      let currentIndex = 0;
      let waitTime = 3000;

      const showNextMessage = () => {
        if (currentIndex < messages.length) {
          setChatMessages((prev) => {
            const newMessages = [...prev];
            newMessages.push(messages[currentIndex]);
            return newMessages;
          });

          // 滚动到底部
          setTimeout(() => {
            chatMessagesRef.current?.scrollToBottom();
          }, 100);
          waitTime = (messages[currentIndex].content?.length / 15) * 1000;
          if (messages[currentIndex].draft_id) {
            waitTime = 3000;
          } else {
            if (waitTime < 2000) {
              waitTime = 2000;
            } else if (waitTime > 10000) {
              waitTime = 8000;
            }
          }

          if (currentIndex + 1 < messages.length) {
            setTimeout(() => {
              currentIndex++;
              showNextMessage();
            }, waitTime);
          } else {
            // 所有消息显示完毕
            // 显示推荐标签
            setRecommendTags(recommends || []);
            setHasMoreMessages(false);
          }
        }
      };

      showNextMessage();
    },
    []
  );

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
          querySessionHistory(data.session_id, true);
        }
      })
      .catch((err) => {
        Taro.showToast({
          title: "获取会话失败:" + err.message,
          icon: "none",
        });
      })
      .finally(() => {
        setIsDesigning(false);
      });
  };

  const formatMessages = (messages: ChatMessageItem[]) => {
    // 兼容以/n分割的场景
    const splitMessages = splitMessage(messages);
    const newMessages = splitMessages.map((message) => {
      if (message.draft_id) {
        message.draft_index = draftIndexRef.current;
        draftIndexRef.current++;
      }
      return message;
    });
    // 获取newMessages中最后一个role为assistant的message
    const lastMessageWithRecommends = newMessages
      .slice()
      .reverse()
      .find((message) => message.role !== "user");
    return {
      messages: newMessages,
      recommends: lastMessageWithRecommends?.recommends || [],
    };
  }

  const querySessionHistory = async (
    session_id: string,
    isFirst = false,
    is_merchant?: boolean
  ) => {
    try {
      let histroyRes = {};
      if (is_merchant) {
        histroyRes = await apiSession.getChatHistoryByMerchant({ session_id });
      } else {
        histroyRes = await apiSession.getChatHistory({ session_id });
      }

      const messages = histroyRes?.data?.messages || [];
      // 重置draftIndex
      draftIndexRef.current = 1;
      const messagesWithoutUserInfo = messages.filter(
        (message, index) => !(message.role == "user" && index === 0)
      );
      const { messages: newMessages, recommends } = formatMessages(messagesWithoutUserInfo);
      // 有历史会话
      if (!isFirst) {
        const newMessagesWithInit = [
          ...INIT_MESSAGE.map((item, index) => ({
            message_id: Date.now().toString() + index,
            role: "assistant",
            content: item,
            created_at: new Date().toISOString(),
          })),
          ...newMessages,
        ];
        setChatMessages(newMessagesWithInit as any);
        setRecommendTags(recommends || []);
      } else {
        // 无历史对话，都是新消息
        showMessagesSequentially(
          newMessages,
          recommends
        );
      }
    } catch (error) {
      console.error("querySessionHistory error", error);
    }
  };

  useEffect(() => {
    console.log('history useEffect')
    if (session_id && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      setSessionId(session_id);
      querySessionHistory(session_id, false, byMerchant);
    }
  return () => {
    console.log('history unmount')
  }
  }, [byMerchant, session_id]);

  useEffect(() => {
    if (year && month && day && hour && gender && isLunar && !hasShownInitMessagesRef.current) {
      hasShownInitMessagesRef.current = true;
      
      showMessagesSequentially(
        INIT_MESSAGE.map((item, index) => ({
          message_id: Date.now().toString() + index,
          role: "assistant",
          content: item,
          created_at: new Date().toISOString(),
        }))
      );
      setTimeout(() => {
        setIsDesigning(true);
      }, 4000);
      initChat({
        birth_year: parseInt(year || "0") || 0,
        birth_month: parseInt(month || "0") || 0,
        birth_day: parseInt(day || "0") || 0,
        birth_hour: parseInt(hour || "0") || 0,
        sex: parseInt(gender || "0"),
        is_lunar: isLunar === "true" ? true : false,
      });
    }
    return () => {
      console.log('INIT unmount')
    }
  }, [year, month, day, hour, gender, isLunar]);

  const renderAssistant = () => {
    return (
      <View className={styles.chatDesignHeader}>
        <View className={styles.assistantAvatarContainer}>
          <Image
            src={LILI_AVATAR_IMAGE_URL}
            className={styles.assistantAvatar}
          />
          <Text className={styles.assistantName}>璞璞</Text>
        </View>
        <View
          className={styles.designResetInfo}
          onClick={() => {
            Taro.redirectTo({
              url: pageUrls.home + "?newSession=true",
            });
          }}
        >
          重置信息
        </View>
      </View>
    );
  };

  // 发送消息
  const handleSend = async (tag) => {
    const content = inputValue || tag;
    if (isEmptyMessage(content) || isDesigning || hasMoreMessages) return;
    setRecommendTags([])
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

    // 重试机制
    const maxRetries = 0;
    let retryCount = 0;
    console.log(sessionId, '请求定制的sessionId')
    const attemptRequest = async () => {
      try {
        const res = await apiSession.chat({
          session_id: sessionId,
          message: content,
        });
        // 处理返回的消息，按照2秒一条的速度依次显示
        const { messages: newMessages, recommends } = formatMessages(res.data?.messages || []);
        showMessagesSequentially(newMessages, recommends);
        return res;
      } catch (err) {
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`请求失败，第${retryCount}次重试...`);
          // 等待1秒后重试
          await new Promise(resolve => setTimeout(resolve, 1000));
          return attemptRequest();
        } else {
          // 重试3次后仍未成功，抛出错误
          throw new Error('哎呀～水晶能量场暂时波动中，请稍后再试');
        }
      }
    };

    attemptRequest()
      .catch((err) => {
        Taro.showToast({
          title: err.message,
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
      headerExtraContent={isDesigning ? "正在分析中..." : renderAssistant()}
      showHome={false}
      onKeyboardHeightChange={handleKeyboardHeightChange}
    >
      <View className={styles.chatContainer}>
        <ChatMessages
          ref={chatMessagesRef}
          messages={chatMessages}
          hasMoreMessages={hasMoreMessages}
          isChatting={isDesigning}
          maxHeight={`calc(100% - ${spareHeight}px)`}
          sessionId={sessionId}
          byMerchant={byMerchant}
        />

        {/* <BraceletDraftCard
          // sessionId={sessionId}
          // draftId="1981c49cadee802d0724015a690"
          draftData={draft?.data}
          generateBraceletImage={generateBraceletImage}
        /> */}

        {!byMerchant && (
          <View className={styles.inputContainer}>
            {recommendTags?.length > 0 && (
              <TagList
                tags={recommendTags?.map((item) => ({
                  id: item,
                  title: item,
                }))}
                onTagSelect={(tag) => {
                  if (!isDesigning) {
                    handleSend(getRecommendTemplate(tag.title));
                  }
                  // setInputValue((prev) =>
                  //   !isEmptyMessage(prev) ? prev + "，" + tag.title : tag.title
                  // );
                }}
                style={{
                  marginBottom: "10px",
                }}
              />
            )}
            <View className={styles.inputBottomContainer}>
              {/* <View className={styles.chatRecordEnter}>
              <Image
                src={userRecordSvg}
                style={{ width: "27px", height: "27px" }}
              />
            </View> */}
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
                  confirmType="send"
                />
                <Image
                  src={
                    !isEmptyMessage(inputValue) && !isDesigning && !hasMoreMessages
                      ? activeSendSvg
                      : sendSvg
                  }
                  style={{ width: "26px", height: "26px" }}
                  onClick={handleSend}
                />
              </View>
            </View>
          </View>
        )}
      </View>
    </PageContainer>
  );
};

export default ChatDesign;
