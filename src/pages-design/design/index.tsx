import React, { useState, useEffect, useRef } from "react";
import { View, Textarea } from "@tarojs/components";
import { isEmptyMessage } from "../../utils/messageFormatter";
import "./index.scss";
import Taro, { useDidHide } from "@tarojs/taro";
import { Image } from "@tarojs/components";
import sendSvg from "@/assets/icons/send.svg";
import activeSendSvg from "@/assets/icons/active-send.svg";
import api, { PersonalizedGenerateResult } from "@/utils/api";
import CircleRing, { CircleRingImage } from "@/components/CircleRing";
import TagList from "@/components/TagList";
import lastChat from "@/assets/icons/last-chat.svg";
import forwardChat from "@/assets/icons/forward-chat.svg";
import ChatCardList from "@/components/ChatCardList";
import SkeletonCard from "@/components/SkeletonCard/SkeletonCard";
import arrowRight from "@/assets/icons/right-arrow.svg";
import { ASSISTANT_SM_IMAGE_URL, ASSISTANT_LG_IMAGE_URL } from "@/config";
import { useDesign } from "@/store/DesignContext";
import { generateUUID } from "@/utils/uuid";
import { pageUrls } from "@/config/page-urls";
import PageContainer from "@/components/PageContainer";
import editBead from "@/assets/icons/edit-bead.svg";
import { CancelToken } from "@/utils/request";
import apiSession from "@/utils/api-session";
import { useSessionResultHandler } from "@/hooks/useSessionResultHandler";
import DateTimeDrawer from "@/components/DateTimeDrawer";

const ChatPage: React.FC = () => {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<string[]>([
    "你好，我是你的私人疗愈师，你可以叫我莉莉。",
  ]);
  const [canvasImageUrl, setCanvasImageUrl] = useState<string>("");
  const [canvasImageStatus, setCanvasImageStatus] = useState<
    "idle" | "downloading" | "success" | "error"
  >("idle");

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  const params = Taro.getCurrentInstance()?.router?.params;
  const { year, month, day, hour, gender, isLunar, session_id } = params || {};
  const { addBeadData } = useDesign();
  const [showDateTimeDrawer, setShowDateTimeDrawer] = useState(false);

  const [sessionData, setSessionData] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const generateRequestRef = useRef<CancelToken>(null);
  const generateRequest2Ref = useRef<CancelToken>(null);

  const { result, stopPolling, retryPolling, processSessionData, updateSessionData } =
    useSessionResultHandler({
      sessionData: sessionData,
    });

  // 键盘适配逻辑
  useEffect(() => {
    // 监听键盘弹起
    const onKeyboardHeightChange = (res) => {
      setKeyboardHeight(res.height);
    };

    // 小程序键盘事件监听
    Taro.onKeyboardHeightChange &&
      Taro.onKeyboardHeightChange(onKeyboardHeightChange);

    return () => {
      // 清理监听器
      Taro.offKeyboardHeightChange &&
        Taro.offKeyboardHeightChange(onKeyboardHeightChange);
      document.documentElement.style.removeProperty("--keyboard-height");
    };
  }, []);

  useDidHide(() => {
    stopPolling();
  });

  const processResult = (resData: any) => {
    processSessionData(resData);
  };

  const processChatResult = (resData: any) => {
    updateSessionData({
      newMessage: {
        role: resData.role,
        content: resData.content,
        created_at: resData.created_at,
        message_id: resData.message_id,
      },
      newRecommends: resData.recommends || [],
      sessionId: sessionId,
      draftId: resData.draft_id,
    });
  };

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
      .createSession({
        birth_info: {
          birth_year,
          birth_month,
          birth_day,
          birth_hour,
          is_lunar,
          sex,
        },
      })
      .then((res) => {
        const data = res.data || {};
        if (data.session_id) {
          setSessionId(data.session_id);
          processResult(data);
        }
      })
      .catch((err) => {
        Taro.showToast({
          title: "获取会话失败:" + JSON.stringify(err),
          icon: "none",
        });
      });
  };

  useEffect(() => {
    if (session_id) {
      apiSession.getSessionDetail(session_id).then((res) => {
        setSessionId(session_id);
        processResult(res.data);
      });
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
  }, [session_id]);

  useEffect(() => {
    if (result.systemMessages?.length > 0) {
      setMessageIndex(result.systemMessages.length - 1);
    }
  }, [result.systemMessages?.length]);

  // 发送消息
  const handleSend = async () => {
    if (isEmptyMessage(inputValue) || isLoading) return;
    setIsLoading(true);
    setInputValue("");
    apiSession
      .chat({
        session_id: sessionId,
        message: inputValue,
      })
      .then((res) => {
        processChatResult(res.data);
      })
      .catch((err) => {
        Taro.showToast({
          title: "定制失败:" + JSON.stringify(err),
          icon: "none",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleNextStep = () => {
    if (!canvasImageUrl) {
      return;
    }
    const beadDataId = "bead-" + generateUUID();
    addBeadData({
      image_url: canvasImageUrl,
      bead_list: result?.draft?.beads?.map((item) => ({
        ...item,
        bead_diameter: item.bead_diameter || item.diameter,
      })),
      bead_data_id: beadDataId,
    });

    Taro.navigateTo({
      url: pageUrls.quickDesign + "?beadDataId=" + beadDataId,
    });
  };

  const renderHistoryController = () => {
    return (
      <View className="history-controller">
        <Image
          src={lastChat}
          style={{
            width: "22px",
            height: "22px",
            opacity: messageIndex === 0 ? 0.2 : 1,
          }}
          onClick={() => {
            setMessageIndex((prev) => (prev > 0 ? prev - 1 : 0));
          }}
        />
        <Image
          src={forwardChat}
          style={{
            width: "22px",
            height: "22px",
            opacity:
              messageIndex === result?.systemMessages?.length - 1 ? 0.2 : 1,
          }}
          onClick={() => {
            setMessageIndex((prev) =>
              prev < result?.systemMessages?.length - 1
                ? prev + 1
                : result?.systemMessages?.length - 1
            );
          }}
        />
      </View>
    );
  };

  const handleEditBead = () => {
    if (!result?.draft?.beads || result?.draft?.beads?.length === 0) {
      return;
    }
    const beadDataId = "bead-" + generateUUID();
    addBeadData({
      image_url: canvasImageUrl,
      bead_list: result?.draft?.beads,
      bead_data_id: beadDataId,
    });
    Taro.navigateTo({
      url: pageUrls.customDesign + "?beadDataId=" + beadDataId,
    });
  };

  const renderKeyboardHide = () => {
    if (!canvasImageUrl || result?.isPolling) {
      return (
        <View className="result-container">
          <SkeletonCard />
        </View>
      );
    }
    return (
      <View className="result-container">
        <View className="result-title">
          <View className="result-title-text">定制方案</View>
          {result?.draft?.beads && result?.draft?.beads?.length > 0 && (
            <View className="diy-adjust" onClick={handleEditBead}>
              DIY调整
            </View>
          )}
        </View>
        <View className="result-card">
          <View className="result-content">
            <View className="result-left">
              <View className="result-text">
                <View className="result-text-title">{result?.draft?.name}</View>
                <View className="result-text-content-container">
                  {(result?.topTwoBeads || [])?.length > 0 &&
                    result?.topTwoBeads?.map((item, index) => (
                      <View className="result-text-content" key={index}>
                        <Image
                          src={item.image_url}
                          style={{
                            width: "15px",
                            height: "15px",
                            marginRight: "4px",
                          }}
                        />
                        <View className="result-text-content-name">
                          {item.name + ":"}
                        </View>
                        <View className="result-text-content-description">
                          {item.funcs[0]}
                        </View>
                      </View>
                    ))}
                </View>
              </View>
              {canvasImageUrl && (
                <View className="result-link ">
                  <View
                    className="crystal-gradient-text"
                    onClick={handleNextStep}
                    style={canvasImageUrl ? { opacity: 1 } : { opacity: 0.5 }}
                  >
                    查看结果
                  </View>
                  <Image
                    src={arrowRight}
                    style={{ width: "16px", height: "16px" }}
                  />
                </View>
              )}
            </View>
            <View className="result-image">
              <CircleRingImage
                size={140}
                backendSize={160}
                imageUrl={canvasImageUrl}
                rotate={true}
              />
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderKeyboardShow = () => {
    return (
      <View className="result-container small">
        <View className="result-card">
          <View className="result-content">
            <View className="result-link ">
              <View
                className="crystal-gradient-text"
                style={canvasImageUrl ? { opacity: 1 } : { opacity: 0.5 }}
                onClick={() => {
                  if (!canvasImageUrl) {
                    return;
                  }
                  Taro.redirectTo({
                    url:
                      pageUrls.result +
                      "?imageUrl=" +
                      encodeURIComponent(canvasImageUrl as string),
                  });
                }}
              >
                查看结果
              </View>
              <Image
                src={arrowRight}
                style={{ width: "16px", height: "16px" }}
              />
            </View>
            <CircleRingImage
              size={60}
              backendSize={70}
              imageUrl={canvasImageUrl}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <PageContainer keyboardHeight={keyboardHeight}>
      <View
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {/* 主要聊天区域 */}
        <View
          className={`assistant-container ${keyboardHeight > 0 ? "small" : ""}`}
        >
          {/* 消息列表 */}
          <Image
            src={
              keyboardHeight > 0
                ? ASSISTANT_SM_IMAGE_URL
                : ASSISTANT_LG_IMAGE_URL
            }
            className="assistant-image"
            mode="aspectFill"
          />
          <View
            className="reset-design-info-link"
            onClick={() => {
              setShowDateTimeDrawer(true);
            }}
          >
            重置信息
          </View>

          <View className="message-container">
            <View className="message-header">
              <View className="assistant-info">
                <View className="assistant-role">疗愈师</View>
                <View className="assistant-name">黎莉莉</View>
              </View>
              {keyboardHeight === 0 && renderHistoryController()}
            </View>
            {/* 助手欢迎消息 - 按照Figma设计样式，包含三角形指示器 */}
            <View className="message-wrapper">
              <ChatCardList
                chatContents={result?.systemMessages}
                messageIndex={messageIndex}
                maxHeight={keyboardHeight > 0 ? 70 : 96}
                onChange={(index) => {
                  setMessageIndex(index);
                }}
              />
            </View>
          </View>
        </View>
        {/* 生成的图片 */}
        {keyboardHeight > 0 ? renderKeyboardShow() : renderKeyboardHide()}

        {/* 输入区域 */}
        <View className="input-container">
          {result?.recommends?.length > 0 && (
            <TagList
              tags={result?.recommends?.map((item) => ({
                id: item,
                title: item,
              }))}
              onTagSelect={(tag) => {
                setInputValue((prev) =>
                  !isEmptyMessage(prev) ? prev + "，" + tag.title : tag.title
                );
              }}
            />
          )}
          <View className="input-wrapper">
            <Textarea
              className="message-input"
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
        {/* 用于拼接珠串图片的隐藏Canvas */}
        {result?.draft?.beads && result?.draft?.beads?.length > 0 && (
          <CircleRing
            dotsBgImageData={result?.draft?.beads || []}
            targetSize={1024}
            canvasId="circle-ring-canvas"
            onChange={(status, canvasImage) => {
              setCanvasImageUrl(canvasImage);
              setCanvasImageStatus(status);
            }}
            showCanvas={false}
          />
        )}
        <DateTimeDrawer
          onPersonalizeCustomize={(data) => {
            initChat({
              birth_year: data.year,
              birth_month: data.month,
              birth_day: data.day,
              birth_hour: data.hour,
              sex: data.gender,
              is_lunar: data.isLunar,
            });
            setShowDateTimeDrawer(false);
          }}
          visible={showDateTimeDrawer}
          onClose={() => {
            setShowDateTimeDrawer(false);
          }}
        />
      </View>
    </PageContainer>
  );
};

export default ChatPage;
