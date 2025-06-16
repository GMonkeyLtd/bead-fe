import React from "react";
import { View } from "@tarojs/components";
import "./SkeletonCard.scss";

const SkeletonCard: React.FC = () => {
  return (
    <View className="skeleton-card">
      <View className="skeleton-content">
        <View className="skeleton-text">
          <View className="skeleton-title" />
          <View className="skeleton-line" />
          <View className="skeleton-line short" />
        </View>
        <View className="skeleton-line link" />
      </View>
      <View className="skeleton-avatar" />
    </View>
  );
};

export default SkeletonCard;
