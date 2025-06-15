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
import { quickGenerate } from "@/utils/generate";
import IconButton from "@/components/IconButton";
import { Image } from "@tarojs/components";
import sendSvg from "@/assets/icons/send.svg";
import activeSendSvg from "@/assets/icons/active-send.svg";
import CrystalCardSlider from "@/components/CrystalCardSlider";
import api, { PersonalizedGenerateResult } from "@/utils/api";
import CircleRing from "@/components/CircleRing";
import TagList from "@/components/TagList";
import ChatBubble from "@/components/ChatBubble/ChatBubble";
import assistant from "@/assets/assistant.png";
import { getSafeArea } from "@/utils/style-tools";
import appName from "@/assets/app-name.png";
import back from "@/assets/icons/back.svg";
import lastChat from "@/assets/icons/last-chat.svg";
import forwardChat from "@/assets/icons/forward-chat.svg";
import ChatCardList from "@/components/ChatCardList";
import ResultSkeleton from "@/components/ResultSkeleton";

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
  const [resultImageUrl, setResultImageUrl] = useState<string>("");
  const [beadImageData, setBeadImageData] = useState<
    PersonalizedGenerateResult[]
  >([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const safeTop = getSafeArea().top;
  const [messageIndex, setMessageIndex] = useState(0);
  const messageRef = useRef<typeof ChatCardList>(null);

  const params = Taro.getCurrentInstance()?.router?.params;
  const { year, month, day, hour, gender } = params || {};

  // 键盘适配逻辑
  useEffect(() => {
    // 监听键盘弹起
    const onKeyboardHeightChange = (res) => {
      console.log("onKeyboardHeightChange", res);
      setKeyboardHeight(res.height);
      setKeyboardVisible(res.height > 0);
    };

    // 小程序键盘事件监听
    Taro.onKeyboardHeightChange &&
      Taro.onKeyboardHeightChange(onKeyboardHeightChange);

    return () => {
      // 清理监听器
      Taro.offKeyboardHeightChange &&
        Taro.offKeyboardHeightChange(onKeyboardHeightChange);
    };
  }, []);

  const initGenerate = async (year, month, day, hour, gender) => {
    setIsLoading(true);
    try {
      // const res: any = await api.generate.personalizedGenerate({
      //   year: parseInt(year || "0"),
      //   month: parseInt(month || "0"),
      //   day: parseInt(day || "0"),
      //   hour: parseInt(hour || "0"),
      //   // gender: parseInt(gender || "0"),
      // });
      // console.log(res, 'res')
      const res = await new Promise((resolve) => {
        resolve({
          code: 200,
          message: "success",
          recommendation_text:
            "根据您的生辰八字和五行信息，您的五行中水元素较强，喜用神为金和水。因此，我为您选择了多种白色和蓝色的珠子，如白水晶、白松石和海蓝宝，以增强金和水的能量。同时，为了平衡五行，我也加入了一些火元素的珠子，如冰飘南红和红碧石，以增强火的力量。此外，还选择了和田玉等土元素的珠子，以稳定整体能量。这些珠子的颜色搭配和谐，既美观又能有效平衡您的五行能量。",
          recommendations: [
            {
              id: "1",
              name: "白水晶1",
              image_url:
                "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
              color: "白色",
              wuxing: "金",
              english: "White Quartz 1",
            },
            {
              id: "2",
              name: "白水晶2",
              image_url:
                "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B62.png",
              color: "白色",
              wuxing: "金",
              english: "White Quartz 2",
            },
            {
              id: "3",
              name: "白松石",
              image_url:
                "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%9D%BE%E7%9F%B3.png",
              color: "白色",
              wuxing: "金",
              english: "White Turquoise",
            },
            {
              id: "4",
              name: "冰飘南红",
              image_url:
                "https://zhuluoji.cn-sh2.ufileos.com/beads/%E5%86%B0%E9%A3%98%E5%8D%97%E7%BA%A2.png",
              color: "橙色、红色",
              wuxing: "火",
              english: "Ice-Flotting South Red Agate",
            },
            {
              id: "5",
              name: "玻璃球",
              image_url:
                "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%8E%BB%E7%92%83%E7%90%83.png",
              color: "白色、蓝色",
              wuxing: "金、火、土",
              english: "Glass Ball",
            },
            {
              id: "6",
              name: "玻璃球2",
              image_url:
                "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%8E%BB%E7%92%83%E7%90%832.png",
              color: "白色",
              wuxing: "金、木、土",
              english: "Glass Ball 2",
            },
            {
              id: "7",
              name: "玻璃球3",
              image_url:
                "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%8E%BB%E7%92%83%E7%90%833.png",
              color: "白色、紫色、黄色、蓝色、粉色、绿色",
              wuxing: "金、木、水、火、土",
              english: "Glass Ball 3",
            },
            {
              id: "8",
              name: "玻璃球5",
              image_url:
                "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%8E%BB%E7%92%83%E7%90%835.png",
              color: "粉色",
              wuxing: "金",
              english: "Glass Ball 5",
            },
            {
              id: "9",
              name: "玻璃球6",
              image_url:
                "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%8E%BB%E7%92%83%E7%90%836.png",
              color: "蓝色",
              wuxing: "金、木、水、火、土",
              english: "Glass Ball 6",
            },
            {
              id: "10",
              name: "玻璃球7",
              image_url:
                "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%8E%BB%E7%92%83%E7%90%837.png",
              color: "浅蓝色",
              wuxing: "土",
              english: "Glass Ball 7",
            },
            {
              id: "11",
              name: "草莓晶1",
              image_url:
                "https://zhuluoji.cn-sh2.ufileos.com/beads/%E8%8D%89%E8%8E%93%E6%99%B61.png",
              color: "红色",
              wuxing: "火、金、土",
              english: "Strawberry Quartz 1",
            },
            {
              id: "12",
              name: "草莓水晶",
              image_url:
                "https://zhuluoji.cn-sh2.ufileos.com/beads/%E8%8D%89%E8%8E%93%E6%B0%B4%E6%99%B6.png",
              color: "红色",
              wuxing: "火、木",
              english: "Strawberry Quartz",
            },
            {
              id: "13",
              name: "蛋白石",
              image_url:
                "https://zhuluoji.cn-sh2.ufileos.com/beads/%E8%9B%8B%E7%99%BD%E7%9F%B3.png",
              color: "浅绿色",
              wuxing: "金、水",
              english: "Opal",
            },
            {
              id: "14",
              name: "粉水晶",
              image_url:
                "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%B2%89%E6%B0%B4%E6%99%B6.png",
              color: "粉色",
              wuxing: "火、土、水、金",
              english: "Rose Quartz",
            },
            {
              id: "15",
              name: "粉水晶1",
              image_url:
                "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%B2%89%E6%B0%B4%E6%99%B61.png",
              color: "粉红色",
              wuxing: "火",
              english: "Rose Quartz 1",
            },
            {
              id: "16",
              name: "粉水晶4",
              image_url:
                "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%B2%89%E6%B0%B4%E6%99%B64.png",
              color: "粉色",
              wuxing: "火",
              english: "Rose Quartz 4",
            },
            {
              id: "17",
              name: "粉水晶5",
              image_url:
                "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%B2%89%E6%B0%B4%E6%99%B65.png",
              color: "红色",
              wuxing: "火、土、水",
              english: "Rose Quartz 5",
            },
            {
              id: "18",
              name: "粉水晶6",
              image_url:
                "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%B2%89%E6%B0%B4%E6%99%B66.png",
              color: "粉色",
              wuxing: "火、土",
              english: "Rose Quartz 6",
            },
            // {
            //   id: "19",
            //   name: "海蓝宝",
            //   image_url:
            //     "https://zhuluoji.cn-sh2.ufileos.com/beads/%E6%B5%B7%E8%93%9D%E5%AE%9D.png",
            //   color: "蓝色",
            //   wuxing: "水",
            //   english: "Aquamarine",
            // },
            // {
            //   id: "20",
            //   name: "海蓝宝1",
            //   image_url:
            //     "https://zhuluoji.cn-sh2.ufileos.com/beads/%E6%B5%B7%E8%93%9D%E5%AE%9D1.png",
            //   color: "蓝色",
            //   wuxing: "水、金",
            //   english: "Aquamarine 1",
            // },
            // {
            //   id: "21",
            //   name: "海螺珠",
            //   image_url:
            //     "https://zhuluoji.cn-sh2.ufileos.com/beads/%E6%B5%B7%E8%9E%BA%E7%8F%A0.png",
            //   color: "橙色",
            //   wuxing: "金",
            //   english: "Seashell Pearl",
            // },
            // {
            //   id: "22",
            //   name: "和田玉",
            //   image_url:
            //     "https://zhuluoji.cn-sh2.ufileos.com/beads/%E5%92%8C%E7%94%B0%E7%8E%89.png",
            //   color: "浅绿色",
            //   wuxing: "土",
            //   english: "Hetian Jade",
            // },
            // {
            //   id: "23",
            //   name: "黑玛瑙",
            //   image_url:
            //     "https://zhuluoji.cn-sh2.ufileos.com/beads/%E9%BB%91%E7%8E%9B%E7%91%99.png",
            //   color: "黑色",
            //   wuxing: "水",
            //   english: "Black Agate",
            // },
            // {
            //   id: "24",
            //   name: "黑曜石",
            //   image_url:
            //     "https://zhuluoji.cn-sh2.ufileos.com/beads/%E9%BB%91%E6%9B%9C%E7%9F%B3.png",
            //   color: "黑色",
            //   wuxing: "火",
            //   english: "Obsidian",
            // },
            // {
            //   id: "25",
            //   name: "红碧石",
            //   image_url:
            //     "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%BA%A2%E7%A2%A7%E7%9F%B3.png",
            //   color: "红色",
            //   wuxing: "火",
            //   english: "Red Jasper",
            // },
          ],
        });
      });

      res &&
        setBeadImageData(res.recommendations as PersonalizedGenerateResult[]);
      const messageLength = messages.length;
      setMessages((prev) => [...prev, res.recommendation_text]);
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

  console.log("keyboardHeight", keyboardHeight);

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

  // 发送消息
  const handleSend = async () => {
    Taro.showLoading({
      title: "设计中...",
      mask: true,
    });
    if (isEmptyMessage(inputValue) || isLoading) return;

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
            // opacity: messageRef.current?.currentIndex === 0 ? 0.2 : 1,
          }}
          onClick={() => {
            messageRef.current?.handlePrev();
            // setMessageIndex(messageIndex - 1);
          }}
        />
        <Image
          src={forwardChat}
          style={{
            width: "22px",
            height: "22px",
            // opacity: messageRef.current?.currentIndex === messages.length - 1 ? 0.2 : 1,
          }}
          onClick={() => {
            messageRef.current?.handleNext();
            // setMessageIndex(messageIndex + 1);
          }}
        />
      </View>
    );
  };

  const renderKeyboardHide = () => {
    // return (
    //   <ResultSkeleton />
    // )
    return (
      <View className="result-container">
        <View className="result-title">当前方案</View>
        <View className="result-card">
          {beadImageData.length > 0 ? (
            <View className="result-content">
              <View className="result-text">
                <View className="result-text-title">夏日睡莲</View>
                <View className="result-text-content"></View>
              </View>
              <View className="result-image">
                <CircleRing
                  dotsBgImagePath={beadImageData.map((item) => item.image_url)}
                  rotate
                />
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
      <View className="result-card">
        <CircleRing
          size={60}
          backendSize={70}
          dotsBgImagePath={beadImageData.map((item) => item.image_url)}
        />
      </View>
    );
  };

  console.log(messages, messageIndex, "messages");

  return (
    <View
      className="design-container"
      style={{
        paddingTop: safeTop,
      }}
    >
      <View className="app-name" style={{ height: safeTop }}>
        <Image src={back} style={{ height: "24px", width: "24px" }} />
        <Image src={appName} style={{ height: "24px" }} mode="aspectFit" />
      </View>
      {/* 主要聊天区域 */}
      <View className="assistant-container">
        {/* 消息列表 */}
        <Image src={assistant} className="assistant-image" />

        <View className="message-container">
          <View className="message-header">
            <View className="assistant-info">
              <View className="assistant-role">疗愈师</View>
              <View className="assistant-name">黎莉莉</View>
            </View>
            {renderHistoryController()}
          </View>
          {/* 助手欢迎消息 - 按照Figma设计样式，包含三角形指示器 */}
          <View className="message-wrapper">
            <ChatCardList
              chatContents={messages}
              maxHeight={keyboardVisible ? 70 : 96}
              ref={messageRef}
            />
          </View>
        </View>
      </View>
      {/* 生成的图片 */}
      {!keyboardVisible ? renderKeyboardHide() : renderKeyboardShow()}

      {/* 输入区域 */}
      <View
        className="input-container"
        // style={{
        //   paddingBottom: keyboardHeight > 0 ? keyboardHeight + "px" : "0",
        // }}
      >
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
            maxlength={2000}
            autoHeight
            adjustKeyboardTo="bottom"
          />
          <IconButton
            icon={!isEmptyMessage(inputValue) ? activeSendSvg : sendSvg}
            // type="primary"
            // circle
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
