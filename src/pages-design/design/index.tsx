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

const TAGS = [
  { id: "1", title: "升值加薪" },
  { id: "2", title: "身体健康" },
  { id: "3", title: "发偏财" },
  { id: "8", title: "学业进步" },
  { id: "4", title: "家庭和睦" },
  { id: "5", title: "事业成功" },
  { id: "9", title: "人际关系" },
  { id: "10", title: "健康长寿" },
  { id: "11", title: "桃花运" },
  { id: "12", title: "考试顺利" },
  { id: "13", title: "财运亨通" },
  { id: "14", title: "爱情甜蜜" },
  { id: "15", title: "家庭和睦" },
];

const ChatPage: React.FC = () => {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [beadName, setBeadName] = useState<string>("");
  const [canvasImageUrl, setCanvasImageUrl] = useState<string>("");
  const [canvasImageStatus, setCanvasImageStatus] = useState<
    "idle" | "downloading" | "success" | "error"
  >("idle");
  const [beadDescriptions, setBeadDescriptions] = useState<
    { image_url: string; description: string }[]
  >([]);
  const [beadImageData, setBeadImageData] = useState<
    PersonalizedGenerateResult[]
  >([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  const params = Taro.getCurrentInstance()?.router?.params;
  const { year, month, day, hour, gender, isLunar } = params || {};
  const { addBeadData } = useDesign();

  const generateRequestRef = useRef<CancelToken>(null);
  const generateRequest2Ref = useRef<CancelToken>(null);

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
    generateRequestRef.current?.cancel("page hide");
    generateRequest2Ref.current?.cancel("page hide");
  });

  const processResult = (res: any) => {
    const resData = res.data || {};
    setBeadImageData(resData.recommendations as PersonalizedGenerateResult[]);
    setBeadName(resData.bracelet_name);
    setBeadDescriptions(
      resData.crystal_ids_deduplication.slice(0, 2).map((item) => {
        const recommendation = resData.recommendations.find(
          (recommendation) => recommendation.id === item.id
        );
        return {
          image_url: recommendation?.image_url || "",
          description: item.function,
          name: recommendation?.name || "",
        };
      })
    );
    setMessages((prev) => [...prev, resData.recommendation_text]);
  };

  const initGenerate = async (
    year,
    month,
    day,
    hour,
    gender,
    isLunar: boolean
  ) => {
    setIsLoading(true);
    try {
      generateRequestRef.current = CancelToken.create();
      const res: any = await api.generate.personalizedGenerate({
        birth_year: parseInt(year || "0"),
        birth_month: parseInt(month || "0"),
        birth_day: parseInt(day || "0"),
        birth_hour: parseInt(hour || "0"),
        is_lunar: isLunar,
        sex: parseInt(gender || "0"),
        },
        {
          cancelToken: generateRequestRef.current,
        }
      );
      processResult(res);
    } catch (err) {
      Taro.showToast({
        title: "生成失败:" + JSON.stringify(err),
        icon: "none",
      });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initGenerate(
      year,
      month,
      day,
      hour,
      gender,
      isLunar === "true" ? true : false
    );

    // 检查图片URL

    // 按照Figma设计稿的文本格式
    setMessages((prev) => [
      ...prev,
      "你好，我是你的私人疗愈师。你可以叫我莉莉，下面是我给你设计的一款水晶手串。\n\n你最近有什么心愿嘛？",
    ]);
  }, []);

  useEffect(() => {
    setMessageIndex(messages.length - 1);
  }, [messages]);

  // 发送消息
  const handleSend = async () => {
    if (isEmptyMessage(inputValue) || isLoading) return;
    setIsLoading(true);
    setInputValue("");
    try {
      generateRequest2Ref.current = CancelToken.create();
      const res: any = await api.generate.personalizedGenerate2({
        ids: beadImageData.map((item) => item.id),
        context: inputValue,
      }, {
        cancelToken: generateRequest2Ref.current,
      });
      processResult(res);
    } catch (error) {
      Taro.showToast({
        title: "生成失败:" + error.message,
        icon: "none",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = () => {
    if (!canvasImageUrl) {
      return;
    }
    const beadDataId = "bead-" + generateUUID();
    console.log(beadImageData, "beadImageData");
    addBeadData({
      image_url: canvasImageUrl,
      bead_list: beadImageData.map((item) => ({
        ...item,
        bead_diameter: item.bead_diameter,
      })),
      bead_data_id: beadDataId,
    });

    Taro.redirectTo({
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
            opacity: messageIndex === messages.length - 1 ? 0.2 : 1,
          }}
          onClick={() => {
            setMessageIndex((prev) =>
              prev < messages.length - 1 ? prev + 1 : messages.length - 1
            );
          }}
        />
      </View>
    );
  };

  const handleEditBead = () => {
    const beadDataId = "bead-" + generateUUID();
    addBeadData({
      image_url: canvasImageUrl,
      bead_list: beadImageData,
      bead_data_id: beadDataId,
    });
    Taro.navigateTo({
      url: pageUrls.customDesign + "?beadDataId=" + beadDataId,
    });
  };

  const renderKeyboardHide = () => {
    if (isLoading || !beadImageData.length || !canvasImageUrl) {
      return (
        <View className="result-container">
          <SkeletonCard />
        </View>
      );
    }
    return (
      <View className="result-container">
        <View className="result-title">
          <View className="result-title-text">当前方案</View>
          <Image
            src={editBead}
            style={{ width: "20px", height: "20px" }}
            onClick={() => {
              handleEditBead();
            }}
          />
        </View>
        <View className="result-card">
          <View className="result-content">
            <View className="result-left">
              <View className="result-text">
                <View className="result-text-title">{beadName}</View>
                <View className="result-text-content-container">
                  {beadDescriptions.length > 0 &&
                    beadDescriptions.map((item, index) => (
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
                          {item.description}
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
                chatContents={messages}
                messageIndex={messageIndex}
                maxHeight={keyboardHeight > 0 ? 70 : 96}
                onChange={(index) => {
                  console.log(index);
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
          <TagList
            tags={TAGS}
            onTagSelect={(tag) => {
              setInputValue((prev) =>
                !isEmptyMessage(prev) ? prev + "，" + tag.title : tag.title
              );
            }}
          />
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
        <CircleRing
          dotsBgImageData={beadImageData}
          targetSize={1024}
          canvasId="circle-ring-canvas"
          onChange={(status, canvasImage) => {
            setCanvasImageUrl(canvasImage);
            setCanvasImageStatus(status);
          }}
          showCanvas={false}
        />
      </View>
    </PageContainer>
  );
};

export default ChatPage;
