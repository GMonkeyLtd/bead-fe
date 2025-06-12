import React, { useState, useRef } from "react";
import { View, Text, ScrollView, Image } from "@tarojs/components";
import "./index.scss";

interface CrystalCard {
  id: string;
  title: string;
  imageUrl: string;
  description?: string;
  price?: number;
}

interface CrystalCardSliderProps {
  cards: CrystalCard[];
  onCardSelect?: (card: CrystalCard) => void;
  onCustomize?: (card: CrystalCard) => void;
}

const CrystalCardSlider: React.FC<CrystalCardSliderProps> = ({
  cards,
  onCardSelect,
  onCustomize,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<any>(null);

  // 处理滚动事件，更新当前卡片索引
  const handleScroll = (e) => {
    const { scrollLeft } = e.detail;
    const cardWidth = 134; // 卡片宽度 + 间距
    const newIndex = Math.round(scrollLeft / cardWidth);
    setCurrentIndex(newIndex);
  };

  // 点击卡片选择
  const handleCardClick = (card: CrystalCard) => {
    onCardSelect?.(card);
  };

  // 点击定制按钮
  const handleCustomizeClick = (card: CrystalCard, e) => {
    e.stopPropagation(); // 防止触发卡片点击事件
    onCustomize?.(card);
  };

  return (
    <View className="crystal-card-slider">
      {/* 滑动卡片容器 */}
      <ScrollView
        className="cards-scroll-view"
        scrollX
        showScrollbar={false}
        enhanced
        bounces={false}
        scrollWithAnimation
        onScroll={handleScroll}
        ref={scrollViewRef}
      >
        <View className="cards-container">
          {cards.map((card, index) => (
            <View
              key={card.id}
              className={`crystal-card ${index === currentIndex ? 'active' : ''}`}
              onClick={() => handleCardClick(card)}
            >
              {/* 卡片内容 */}
              <View className="card-content">
                {/* 水晶手串图片区域 */}
                <View className="crystal-image-container">
                  {/* 实际照片 */}
                  <Image
                    src={card.imageUrl}
                    mode="aspectFill"
                    className="crystal-photo"
                    lazyLoad
                    webp
                  />
                  
                  {/* 标题覆盖层 */}
                  <View className="card-title">{card.title}</View>
                </View>

                {/* 定制按钮区域 */}
                <View className="customize-section">
                  <Text className="customize-text">选择定制</Text>
                  <View className="customize-icon">
                    <View className="arrow-line"></View>
                    <View className="arrow-circle top"></View>
                    <View className="arrow-circle bottom"></View>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 指示器 */}
      <View className="indicators">
        {cards.map((_, index) => (
          <View
            key={index}
            className={`indicator ${index === currentIndex ? 'active' : ''}`}
          />
        ))}
      </View>
    </View>
  );
};

export default CrystalCardSlider; 