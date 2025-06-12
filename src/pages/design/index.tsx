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
import { useLLMChat, type ChatMessage } from "../../hooks/useLLMChat";
import {
  formatTime,
  formatMessageContent,
  isEmptyMessage,
} from "../../utils/messageFormatter";
import "./index.scss";
import Taro from "@tarojs/taro";
import { quickGenerate } from "@/utils/generate";
import IconButton from "@/components/IconButton";
import { Image } from "@tarojs/components";
import sendSvg from "@/assets/icons/send.svg";
import activeSendSvg from "@/assets/icons/active-send.svg";
import CrystalCardSlider from "@/components/CrystalCardSlider";
import api, { PersonalizedGenerateResult } from "@/utils/api";
import CircleRing from "@/components/circle-ring-canvas";

const ChatPage: React.FC = () => {
  const [inputValue, setInputValue] = useState("");
  const [helloMessage, setHelloMessage] = useState("");
  const [resultImageUrl, setResultImageUrl] = useState<string>("");
  const [beadImageData, setBeadImageData] = useState<PersonalizedGenerateResult[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // 水晶卡片数据
  const [crystalCards] = useState([
    {
      id: "1",
      title: "Ⅲ",
      imageUrls: "https://crystal-ring.cn-sh2.ufileos.com/images/000.png",
      description: "紫水晶手串",
      price: 299
    },
    {
      id: "2", 
      title: "Ⅱ",
      imageUrls: "https://crystal-ring.cn-sh2.ufileos.com/images/11.png",
      description: "玫瑰石英手串",
      price: 199
    },
    {
      id: "3",
      title: "Ⅰ", 
      imageUrls: "https://crystal-ring.cn-sh2.ufileos.com/images/111.png",
      description: "白水晶手串",
      price: 159
    },
    {
      id: "3",
      title: "Ⅰ", 
      imageUrls: "https://crystal-ring.cn-sh2.ufileos.com/images/22.png",
      description: "白水晶手串",
      price: 159
    },
    {
      id: "3",
      title: "Ⅰ", 
      imageUrls: "https://crystal-ring.cn-sh2.ufileos.com/images/33.png",
      description: "白水晶手串",
      price: 159
    },
    {
      id: "3",
      title: "Ⅰ", 
      imageUrls: "https://crystal-ring.cn-sh2.ufileos.com/images/44.png",
      description: "白水晶手串",
      price: 159
    }
  ]);

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
    Taro.onKeyboardHeightChange && Taro.onKeyboardHeightChange(onKeyboardHeightChange);

    return () => {
      // 清理监听器
      Taro.offKeyboardHeightChange && Taro.offKeyboardHeightChange(onKeyboardHeightChange);
    };
  }, []);

  const initGenerate = async (year, month, day, hour, gender) => {
    try {
      // const res = await api.generate.personalizedGenerate({
      //   year: parseInt(year || "0"),
      //   month: parseInt(month || "0"),
      //   day: parseInt(day || "0"),
      //   hour: parseInt(hour || "0"),
      //   gender: parseInt(gender || "0"),
      // });
      const res =  await new Promise((resolve) => {
        resolve([
          {
              "id": "4",
              "name": "冰飘南红",
              "image_url": "https://zhuluoji.cn-sh2.ufileos.com/beads/%E5%86%B0%E9%A3%98%E5%8D%97%E7%BA%A2.png",
              "color": "橙色、红色",
              "wuxing": "火",
              "english": "Ice-Flotting South Red Agate"
          },
          {
              "id": "5",
              "name": "玻璃球",
              "image_url": "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%8E%BB%E7%92%83%E7%90%83.png",
              "color": "白色、蓝色",
              "wuxing": "金、火、土",
              "english": "Glass Ball"
          },
          {
              "id": "6",
              "name": "玻璃球2",
              "image_url": "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%8E%BB%E7%92%83%E7%90%832.png",
              "color": "白色",
              "wuxing": "金、木、土",
              "english": "Glass Ball 2"
          },
          {
              "id": "7",
              "name": "玻璃球3",
              "image_url": "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%8E%BB%E7%92%83%E7%90%833.png",
              "color": "白色、紫色、黄色、蓝色、粉色、绿色",
              "wuxing": "金、木、水、火、土",
              "english": "Glass Ball 3"
          },
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
          {
              "id": "13",
              "name": "蛋白石",
              "image_url": "https://zhuluoji.cn-sh2.ufileos.com/beads/%E8%9B%8B%E7%99%BD%E7%9F%B3.png",
              "color": "浅绿色",
              "wuxing": "金、水",
              "english": "Opal"
          },
          {
              "id": "14",
              "name": "粉水晶",
              "image_url": "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%B2%89%E6%B0%B4%E6%99%B6.png",
              "color": "粉色",
              "wuxing": "火、土、水、金",
              "english": "Rose Quartz"
          },
          {
              "id": "15",
              "name": "粉水晶1",
              "image_url": "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%B2%89%E6%B0%B4%E6%99%B61.png",
              "color": "粉红色",
              "wuxing": "火",
              "english": "Rose Quartz 1"
          },
          {
              "id": "16",
              "name": "粉水晶4",
              "image_url": "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%B2%89%E6%B0%B4%E6%99%B64.png",
              "color": "粉色",
              "wuxing": "火",
              "english": "Rose Quartz 4"
          },
          {
              "id": "17",
              "name": "粉水晶5",
              "image_url": "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%B2%89%E6%B0%B4%E6%99%B65.png",
              "color": "红色",
              "wuxing": "火、土、水",
              "english": "Rose Quartz 5"
          },
          {
              "id": "18",
              "name": "粉水晶6",
              "image_url": "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%B2%89%E6%B0%B4%E6%99%B66.png",
              "color": "粉色",
              "wuxing": "火、土",
              "english": "Rose Quartz 6"
          },
          {
              "id": "19",
              "name": "海蓝宝",
              "image_url": "https://zhuluoji.cn-sh2.ufileos.com/beads/%E6%B5%B7%E8%93%9D%E5%AE%9D.png",
              "color": "蓝色",
              "wuxing": "水",
              "english": "Aquamarine"
          },
          {
              "id": "20",
              "name": "海蓝宝1",
              "image_url": "https://zhuluoji.cn-sh2.ufileos.com/beads/%E6%B5%B7%E8%93%9D%E5%AE%9D1.png",
              "color": "蓝色",
              "wuxing": "水、金",
              "english": "Aquamarine 1"
          },
          {
              "id": "23",
              "name": "黑玛瑙",
              "image_url": "https://zhuluoji.cn-sh2.ufileos.com/beads/%E9%BB%91%E7%8E%9B%E7%91%99.png",
              "color": "黑色",
              "wuxing": "水",
              "english": "Black Agate"
          },
          {
              "id": "24",
              "name": "黑曜石",
              "image_url": "https://zhuluoji.cn-sh2.ufileos.com/beads/%E9%BB%91%E6%9B%9C%E7%9F%B3.png",
              "color": "黑色",
              "wuxing": "火",
              "english": "Obsidian"
          },
          {
              "id": "25",
              "name": "红碧石",
              "image_url": "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%BA%A2%E7%A2%A7%E7%9F%B3.png",
              "color": "红色",
              "wuxing": "火",
              "english": "Red Jasper"
          },
        ]);
      });
      res && setBeadImageData(res as PersonalizedGenerateResult[]);
      setHelloMessage(
        "你好，我是你的私人疗愈师。你可以叫我莉莉，下面是我给你设计的一款水晶手串。\n\n你最近有什么心愿嘛？"
      );
    } catch (error) {
      Taro.showToast({
        title: "生成失败:" + error.message,
        icon: "none",
      });
    }
  };

  useEffect(() => {
    initGenerate(year, month, day, hour, gender);
    
    setImageLoading(true);
    
    // 检查图片URL
    
    // 按照Figma设计稿的文本格式
    setHelloMessage(
      "你好，我是你的私人疗愈师。你可以叫我莉莉，下面是我给你设计的一款水晶手串。\n\n你最近有什么心愿嘛？"
    );
  }, []);

  const { messages, isLoading, isStreaming, error, sendMessage } = useLLMChat({
    // apiUrl: '/api/chat/stream',
    onError: (error) => {
      Taro.showToast({
        title: "聊天错误:" + error.message,
        icon: "none",
      });
    },
    onComplete: () => {
      Taro.hideLoading();
      console.log("回复完成");
    },
  });

  useEffect(() => {
    console.log(messages);
  }, [messages]);

  // 发送消息
  const handleSend = async () => {
    Taro.showLoading({
      title: "设计中...",
      mask: true,
    });
    console.log("handleSend", inputValue);
    if (isEmptyMessage(inputValue) || isLoading) return;

    const message = inputValue.trim();
    setInputValue("");
    await sendMessage(message);
  };

  // 处理图片加载成功
  const handleImageLoad = () => {
    console.log("图片加载成功");
    setImageLoading(false);
    setImageError(false);
  };

  // 处理图片加载失败
  const handleImageError = (e) => {
    console.error("图片加载失败:", e);
    setImageLoading(false);
    setImageError(true);
    
    Taro.showToast({
      title: "图片加载失败",
      icon: "none",
      duration: 2000
    });
  };

  // 检查图片URL是否可用
  const checkImageUrl = async (url: string) => {
    try {
      // 在小程序中，我们需要检查域名是否在白名单中
      console.log("检查图片URL:", url);
      
      // 如果是IP地址，可能需要配置域名白名单
      const isIpAddress = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url);
      if (isIpAddress) {
        console.warn("检测到IP地址，请确保已在小程序后台配置域名白名单");
        Taro.showModal({
          title: '提示',
          content: '检测到使用IP地址访问图片，如果无法加载，请在微信小程序后台配置域名白名单：117.50.252.189',
          showCancel: false
        });
      }
      
      return true;
    } catch (error) {
      console.error("URL检查失败:", error);
      return false;
    }
  };

  // 重试加载图片
  const retryLoadImage = async () => {
    setImageLoading(true);
    setImageError(false);
    
    // 重新检查URL
    const isValid = await checkImageUrl(resultImageUrl);
    if (!isValid) {
      setImageError(true);
      setImageLoading(false);
    }
  };

  // 处理卡片选择
  const handleCardSelect = (card) => {
    console.log("选择卡片:", card);
    setResultImageUrl(card.imageUrl);
    Taro.showToast({
      title: `已选择${card.description}`,
      icon: "success",
      duration: 1500
    });
  };

  // 处理定制按钮点击
  const handleCustomize = (card) => {
    console.log("定制卡片:", card);
    Taro.showModal({
      title: '确认定制',
      content: `是否确认定制${card.description}？价格：¥${card.price}`,
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({
            title: "定制成功！",
            icon: "success"
          });
        }
      }
    });
  };


  return (
    <View 
      className="design-container"
      style={{
        paddingBottom: keyboardVisible ? `${keyboardHeight}px` : '0'
      }}
    >
      {/* 主要聊天区域 */}
      <View className="assistant-container">
        <View className="assistant-name">
          黎莉莉
        </View>
        {/* 消息列表 */}
        <View className="message-container">
          {/* 助手欢迎消息 - 按照Figma设计样式，包含三角形指示器 */}
          <View className="message-wrapper">
            <View className="message">
              <Text>{messages[0]?.content || helloMessage}</Text>
            </View>
          </View>
          
          {/* 水晶卡片滑动组件 */}
          {/* <CrystalCardSlider
            cards={crystalCards}
            onCardSelect={handleCardSelect}
            onCustomize={handleCustomize}
          />
           */}
          {/* 生成的图片 */}
          {beadImageData.length > 0 ? (
            <View className="result-image">
              <CircleRing 
                dotsBgImagePath={beadImageData.map(item => item.image_url)}
              />
            </View>
          ) : (
            <View className="image-placeholder">设计中...</View>
          )}
        </View>
      </View>

      {/* 输入区域 */}
      <View className="input-container">
        <View className="input-wrapper">
          <Textarea
            className="message-input"
            value={inputValue}
            placeholder="输入您的定制需求..."
            onInput={(e) => setInputValue(e.detail.value)}
            onConfirm={handleSend}
            maxlength={2000}
            autoHeight
            adjustPosition={false}
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
