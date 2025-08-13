import React from "react";
import { View, Image, Text, ScrollView } from "@tarojs/components";
import "./index.scss";
import RightArrowIcon from "@/assets/icons/right-arrow.svg";

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
              lazyLoad
              fadeIn={false}
            />
          </View>
          <View className="bracelet-info">
            <View className="bracelet-header">
              <View className="bracelet-name-container">
                <Text className="bracelet-name">{item.name}</Text>
              </View>
              <Image src={RightArrowIcon} style={{ width: 15, height: 10 }} />
            </View>
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-start",
                width: "100%",
              }}
            >
              <Text className="bracelet-number">{`NO.${item.id}`}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

export default BraceletList;
