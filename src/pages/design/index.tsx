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

import React, { useState, useRef, useEffect } from "react";
import { View, Text, Textarea } from "@tarojs/components";
import { isEmptyMessage } from "../../utils/messageFormatter";
import "./index.scss";
import Taro from "@tarojs/taro";
import IconButton from "@/components/IconButton";
import { Image } from "@tarojs/components";
import sendSvg from "@/assets/icons/send.svg";
import activeSendSvg from "@/assets/icons/active-send.svg";
import api, { PersonalizedGenerateResult } from "@/utils/api";
import CircleRing from "@/components/CircleRing";
import TagList from "@/components/TagList";
import assistant from "@/assets/assistant.png";
import { getSafeArea } from "@/utils/style-tools";
import lastChat from "@/assets/icons/last-chat.svg";
import forwardChat from "@/assets/icons/forward-chat.svg";
import ChatCardList from "@/components/ChatCardList";
import SkeletonCard from "@/components/SkeletonCard/SkeletonCard";
import arrowRight from "@/assets/icons/right-arrow.svg";
import AppHeader from "@/components/AppHeader";
import { useCircleRing } from "@/hooks/useCircleRing";

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
  const [resultImageUrl, setResultImageUrl] = useState<string>("");
  const [beadDescriptions, setBeadDescriptions] = useState<
    { image_url: string; description: string }[]
  >([]);
  const [beadImageData, setBeadImageData] = useState<
    PersonalizedGenerateResult[]
  >([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  const params = Taro.getCurrentInstance()?.router?.params;
  const { year, month, day, hour, gender } = params || {};
  const { generateCircleRing, status, imageUrl, isLoading: isCircleRingLoading, error } = useCircleRing({ size: 140, canvasId: "circle-canvas" })
  console.log(imageUrl,isLoading, status, 'imageUrl')

  // 键盘适配逻辑
  useEffect(() => {
    // 监听键盘弹起
    const onKeyboardHeightChange = (res) => {
      setKeyboardHeight(res.height);
      setKeyboardVisible(res.height > 0);
      // 设置CSS变量
      document.documentElement.style.setProperty(
        "--keyboard-height",
        `${res.height}px`
      );
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

  const initGenerate = async (year, month, day, hour, gender) => {
    setIsLoading(true);
    try {
      // const res: any = await api.generate.personalizedGenerate({
      //   birth_year: parseInt(year || "0"),
      //   birth_month: parseInt(month || "0"),
      //   birth_day: parseInt(day || "0"),
      //   birth_hour: parseInt(hour || "0"),
      //   is_lunar: false
      //   // gender: parseInt(gender || "0"),
      // });
      // const resData = res.data || {};
      // console.log(resData, 'res 111111')
      const resData = await new Promise((resolve) => {
        setTimeout(() => {
          Taro.hideLoading();
          setIsLoading(false);
          resolve({
            code: 200,
            message: "success",
            bracelet_name: "水木生辉",
            crystal_ids_deduplication: [
              {
                id: "19",
                function: "补水旺运",
              },
              {
                id: "77",
                function: "平衡五行",
              },
            ],
            recommendations: [
              
            {
                "id": "9",
                "name": "玻璃球6",
                "image_url": "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%8E%BB%E7%92%83%E7%90%836.png",
                "color": "蓝色",
                "wuxing": "金、木、水、火、土",
                "english": "Glass Ball 6"
            },
            {
                "id": "11",
                "name": "草莓晶1",
                "image_url": "https://zhuluoji.cn-sh2.ufileos.com/beads/%E8%8D%89%E8%8E%93%E6%99%B61.png",
                "color": "红色",
                "wuxing": "火、金、土",
                "english": "Strawberry Quartz 1"
            },
            {
                "id": "12",
                "name": "草莓水晶",
                "image_url": "https://zhuluoji.cn-sh2.ufileos.com/beads/%E8%8D%89%E8%8E%93%E6%B0%B4%E6%99%B6.png",
                "color": "红色",
                "wuxing": "火、木",
                "english": "Strawberry Quartz"
            },
          ],
        
        recommendation_text:
              "根据您的生辰八字和五行信息，您的五行中水元素较强，喜用神为金和水。因此，我为您选择了多种白色和蓝色的珠子，如白水晶、白松石和海蓝宝，以增强金和水的能量。同时，为了平衡五行，我也加入了一些火元素的珠子，如冰飘南红和红碧石，以增强火的力量。此外，还选择了和田玉等土元素的珠子，以稳定整体能量。这些珠子的颜色搭配和谐，既美观又能有效平衡您的五行能量。",
          });
        }, 1000);
      });


      setBeadImageData(resData.recommendations as PersonalizedGenerateResult[]);
      setBeadName(resData.bracelet_name);
      setBeadDescriptions(
        resData.crystal_ids_deduplication.map((item) => {
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
    } catch (error) {
      Taro.showToast({
        title: "生成失败:" + error.message,
        icon: "none",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  
  useEffect(() => {
    initGenerate(year, month, day, hour, gender);

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

  useEffect(() => {
    if (beadImageData.length > 0) {
      generateCircleRing(beadImageData.map((item) => item.image_url));
    }
  }, [beadImageData]);

  // 发送消息
  const handleSend = async () => {
    if (isEmptyMessage(inputValue) || isLoading) return;

    Taro.showLoading({
      title: "设计中...",
      mask: true,
    });
    initGenerate(year, month, day, hour, gender);

    setInputValue("");
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
    if (isLoading || isCircleRingLoading || status !== "success") {
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
          {beadImageData.length > 0 ? (
            <View className="result-content">
              <View className="result-text">
                <View className="result-text-title">{beadName}</View>
                <View className="result-text-content-container">
                  {beadDescriptions.length > 0 &&
                    beadDescriptions.map((item, index) => (
                      <View className="result-text-content" key={index}>
                        <Image
                          src={item.image_url}
                          style={{ width: "16px", height: "16px" }}
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
                <View className="result-link ">
                  <View className="crystal-gradient-text">发起定制派单</View>
                  <Image
                    src={arrowRight}
                    style={{ width: "16px", height: "16px" }}
                  />
                </View>
              </View>
              <View className="result-image">
                <CircleRing imageUrl={imageUrl} size={140} backendSize={160} />
              </View>
            </View>
          ) : (
            <View>定制中</View>
          )}
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
              <View className="crystal-gradient-text">发起定制派单</View>
              <Image
                src={arrowRight}
                style={{ width: "16px", height: "16px" }}
              />
            </View>
            <CircleRing imageUrl={imageUrl} size={60} backendSize={70} />
          </View>
        </View>
      </View>
    );
  };

  // console.log(messages, messageIndex, "messages");

  return (
    <View
      className={`crystal-common-container ${
        keyboardVisible ? "keyboard-visible" : ""
      }`}
    >
      <AppHeader isWhite={false} />
      {/* 主要聊天区域 */}
      <View className={`assistant-container ${keyboardVisible ? "small" : ""}`}>
        {/* 消息列表 */}
        <Image src={assistant} className="assistant-image" />

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
            setInputValue(tag.title);
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
            // adjustKeyboardTo="bottom"
            onFocus={() => {
              setKeyboardVisible(true);
            }}
            onBlur={() => {
              setKeyboardVisible(false);
            }}
            showConfirmBar={false}
          />
          <IconButton
            icon={!isEmptyMessage(inputValue) ? activeSendSvg : sendSvg}
            size={20}
            color=""
            disabled={isEmptyMessage(inputValue) || isLoading}
            loading={isLoading}
            onClick={handleSend}
          />
        </View>
      </View>
    </View>
  );
};

export default ChatPage;
