import React, { useState, forwardRef, useEffect } from "react";
import { View, Swiper, SwiperItem } from "@tarojs/components";
import "./index.scss";
import ChatBubble from "../ChatBubble/ChatBubble";

interface ChatCardDisplayMethods {
  handlePrev: () => void;
  handleNext: () => void;
}

interface ChatCardDisplayProps {
  chatContents: string[];
  initialIndex: number;
  maxHeight: number;
}

const ChatCardList: React.ForwardRefRenderFunction<
  ChatCardDisplayMethods,
  ChatCardDisplayProps
> = (props, ref) => {
  const { chatContents, initialIndex, maxHeight } = props;
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(chatContents.length - 1);
  }, [chatContents.length]);

  const handlePrev = () => {
    console.log('handlePrev')
    setCurrentIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : 0
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex < chatContents.length - 1 ? prevIndex + 1 : chatContents.length - 1
    );
  };

  React.useImperativeHandle(ref, () => ({ handlePrev, handleNext, currentIndex }));

  return (
    <Swiper
      circular
      indicatorDots={false}
      autoplay={false}
      // currentItemId={"message" + currentIndex}
      current={currentIndex}
      style={{ width: '100%' }}
    >
      {chatContents.map((content, index) => (
        <SwiperItem key={"message" + index}>
          <ChatBubble
            message={content}
            style={{
              maxHeight: maxHeight,
              overflow: "auto",
            }}
          />
        </SwiperItem>
      ))}
    </Swiper>
  );
};

export default forwardRef(ChatCardList);
