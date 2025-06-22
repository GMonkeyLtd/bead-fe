/**
 * 微信小程序图片加载配置说明：
 *
 * 1. 域名白名单配置：
 *    - 登录微信公众平台 (mp.weixin.qq.com)
 *    - 进入小程序后台 -> 开发 -> 开发管理 -> 开发设置 -> 服务器域名
 *    - 在 "downloadFile合法域名" 中添加：https://117.50.252.189
 *
 * 2. 如果是IP地址访问，可能需要：
 *    - 配置代理服务器
 *    - 使用域名替代IP地址
 *    - 确保服务器支持HTTPS
 *
 * 3. 图片格式要求：
 *    - 支持 jpg, png, gif, webp
 *    - 建议使用HTTPS协议
 *    - 图片大小不超过10MB
 */

import React, { useState, useEffect } from "react";
import { View, Textarea } from "@tarojs/components";
import { isEmptyMessage } from "../../utils/messageFormatter";
import "./index.scss";
import Taro from "@tarojs/taro";
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
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  const params = Taro.getCurrentInstance()?.router?.params;
  const { year, month, day, hour, gender, isLunar } = params || {};
  const { addBeadData } = useDesign();

  // 键盘适配逻辑
  useEffect(() => {
    // 监听键盘弹起
    const onKeyboardHeightChange = (res) => {
      // 设置CSS变量
      document.documentElement.style.setProperty(
        "--keyboard-height",
        `${res.height}px`
      );
      setKeyboardVisible(res.height > 0);
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
      const res: any = await api.generate.personalizedGenerate({
        birth_year: parseInt(year || "0"),
        birth_month: parseInt(month || "0"),
        birth_day: parseInt(day || "0"),
        birth_hour: parseInt(hour || "0"),
        is_lunar: isLunar,
        // gender: parseInt(gender || "0"),
      });
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
      const res: any = await api.generate.personalizedGenerate2({
        ids: beadImageData.map((item) => item.id),
        context: inputValue,
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
    addBeadData({
      image_url: canvasImageUrl,
      bead_list: beadImageData.map((item) => ({
        id: item.id,
        image_url: item.image_url,
        name: item.name,
        description: item.description,
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
        <View className="result-title">当前方案</View>
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
              <View className="result-link ">
                <View
                  className="crystal-gradient-text"
                  onClick={handleNextStep}
                  style={canvasImageUrl ? { opacity: 1 } : { opacity: 0.5 }}
                >
                  发起定制派单
                </View>
                <Image
                  src={arrowRight}
                  style={{ width: "16px", height: "16px" }}
                />
              </View>
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
                  Taro.navigateTo({
                    url:
                      pageUrls.result +
                      "?imageUrl=" +
                      encodeURIComponent(canvasImageUrl as string),
                  });
                }}
              >
                发起定制派单
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
    <PageContainer keyboardVisible={keyboardVisible}>
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
          className={`assistant-container ${keyboardVisible ? "small" : ""}`}
        >
          {/* 消息列表 */}
          <Image
            src={
              keyboardVisible ? ASSISTANT_SM_IMAGE_URL : ASSISTANT_LG_IMAGE_URL
            }
            className="assistant-image"
          />

          <View className="message-container">
            <View className="message-header">
              <View className="assistant-info">
                <View className="assistant-role">疗愈师</View>
                <View className="assistant-name">黎莉莉</View>
              </View>
              {!keyboardVisible && renderHistoryController()}
            </View>
            {/* 助手欢迎消息 - 按照Figma设计样式，包含三角形指示器 */}
            <View className="message-wrapper">
              <ChatCardList
                chatContents={messages}
                messageIndex={messageIndex}
                maxHeight={keyboardVisible ? 70 : 96}
              />
            </View>
          </View>
        </View>
        {/* 生成的图片 */}
        {keyboardVisible ? renderKeyboardShow() : renderKeyboardHide()}

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
              adjustKeyboardTo="bottom"
              onFocus={() => {
                setKeyboardVisible(true);
              }}
              onBlur={() => {
                setKeyboardVisible(false);
              }}
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
