import React from 'react';
import { View, Image, Text } from '@tarojs/components';
import './index.scss';

interface BraceletItem {
  id: string;
  name: string;
  number: string;
  image: string;
  rating?: number; // 评级分数，用于显示评级图标
}

interface BraceletListProps {
  items: BraceletItem[];
  onItemClick?: (item: BraceletItem) => void;
}

const BraceletList: React.FC<BraceletListProps> = ({ items, onItemClick }) => {
  // 渲染评级图标
  const renderRatingIcons = (rating: number = 5) => {
    return (
      <View className="rating-icons">
        <View className="rating-line" />
        <View className="rating-dot active" />
        <View className="rating-dot active" />
      </View>
    );
  };

  return (
    <View className="bracelet-list">
      {items.map((item) => (
        <View 
          key={item.id}
          className="bracelet-item"
          onClick={() => onItemClick?.(item)}
        >
          <View className="bracelet-image-container">
            <Image 
              className="bracelet-image"
              src={item.image}
              mode="aspectFill"
            />
          </View>
          <View className="bracelet-info">
            <View className="bracelet-header">
              <Text className="bracelet-name">{item.name}</Text>
              {renderRatingIcons(item.rating)}
            </View>
            <Text className="bracelet-number">{item.number}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

export default BraceletList; 