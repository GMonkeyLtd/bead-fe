import React, { useCallback } from "react";
import { View } from "@tarojs/components";
import "./styles/RingInfoDisplay.scss";

interface RingInfoDisplayProps {
  imageUrl: string;
  onViewEffect: () => void;
  onAddAccessory: () => void;
}

/**
 * 圆环信息显示组件
 * 负责显示手围信息和查看效果按钮
 */
const RingInfoDisplay: React.FC<RingInfoDisplayProps> = ({
  imageUrl,
  onViewEffect,
  onAddAccessory,
}) => { 
  const handleViewEffect = useCallback(() => {
    if (!imageUrl) return;
    onViewEffect();
  }, [imageUrl, onViewEffect]);

  return (
    <View className="ring-info-display">

      <View className="view-effect-container">
        <View
          className={`view-effect-button ${!imageUrl ? 'disabled' : ''}`}
          onClick={onAddAccessory}
        >
          添加配饰
        </View>
      </View>

      {/* 查看效果按钮 */}
      <View className="view-effect-container">
        <View
          className={`view-effect-button ${!imageUrl ? 'disabled' : ''}`}
          onClick={handleViewEffect}
        >
          查看效果
        </View>
      </View>
    </View>
  );
};

export default React.memo(RingInfoDisplay);
