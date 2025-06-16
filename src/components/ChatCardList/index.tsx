import React, { useState, forwardRef, useEffect } from "react";
import { View, Swiper, SwiperItem } from "@tarojs/components";
import "./index.scss";
import ChatBubble from "../ChatBubble/ChatBubble";

interface ChatCardDisplayProps {
  chatContents: string[];
  messageIndex: number;
  maxHeight: number;
}

const ChatCardList = ({ messageIndex, maxHeight, chatContents }: ChatCardDisplayProps) => {

  return (
    <Swiper
      circular
      indicatorDots={false}
      autoplay={false}
      // currentItemId={"message" + currentIndex}
      current={messageIndex}
      style={{ width: '100%', height: maxHeight }}
    >
      {chatContents.map((content, index) => (
        <SwiperItem key={"message" + index}>
          <ChatBubble
            message={content}
            style={{
              maxHeight: maxHeight - 24,
              overflow: "auto",
            }}
          />
        </SwiperItem>
      ))}
    </Swiper>
  );
};

export default ChatCardList;
