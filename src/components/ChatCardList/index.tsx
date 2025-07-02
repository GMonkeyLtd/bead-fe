import React, { useState, forwardRef, useEffect } from "react";
import { View, Swiper, SwiperItem } from "@tarojs/components";
import "./index.scss";
import ChatBubble from "../ChatBubble/ChatBubble";

interface ChatCardDisplayProps {
  chatContents: string[];
  messageIndex: number;
  maxHeight: number;
  onChange: (index: number) => void;
}

const ChatCardList = ({ messageIndex, maxHeight, chatContents, onChange }: ChatCardDisplayProps) => {

  return (
    <Swiper
      // circular
      indicatorDots={false}
      autoplay={false}
      // currentItemId={"message" + currentIndex}
      current={messageIndex}
      style={{ width: '100%', height: maxHeight }}
      onChange={(e) => {
        onChange(e.detail.current);
      }}
    >
      {chatContents.map((content, index) => (
        <SwiperItem key={"message" + index}>
          <View className="chat-card-list-item">
            <ChatBubble
              message={content}
              style={{
                width: "100%",
                height: maxHeight - 24,
                overflow: "auto",
              }}
            />
          </View>
        </SwiperItem>
      ))}
    </Swiper>
  );
};

export default ChatCardList;
