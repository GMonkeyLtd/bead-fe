import React from "react";
import { Text, View } from "@tarojs/components";
import "./index.scss";
import ImageSlider from "../ImageSlider";

interface MerchantCardProps {
  name: string;
  historyImages: string[];
  isSelf?: boolean;
  showHistory?: boolean;
  isCanceled?: boolean;
}

const MerchantCard: React.FC<MerchantCardProps> = ({
  name,
  historyImages,
  isSelf = false,
  showHistory = true,
  isCanceled = false,
}) => {
  return (
    <View className="merchant-card">
      {/* 商家信息区域 */}
      <View className="merchant-info" style={{ opacity: isCanceled ? 0.5 : 1 }}>
        <View className="merchant-header">
          <View className="merchant-title">
            {isSelf && <View className="merchant-tag">自营</View>}
            <Text className="merchant-name">{name}</Text>
          </View>
          <Text className="merchant-address">源头晶品，匠心专属</Text>
        </View>

        {/* 评分指标区域 */}
        {/* <View className="metrics-section">
          <View className="metric-item">
            <View className="metric-value rating-value">{rating}</View>
            <View className="metric-label">综合评分</View>
          </View>
          <View className="metric-item">
            <View className="metric-value-row">
              <Text className="metric-value">{dealRate}%</Text>
              <View className="arrow-icon">
                <Image
                  src={dealRate >= 70 ? greenUpArrowIcon : redDownArrowIcon}
                  mode="widthFix"
                  style={{ width: "14px", height: "14px" }}
                />
              </View>
            </View>
            <View className="metric-label">成交率</View>
          </View>
          <View className="metric-item">
            <View className="metric-value-row">
              <Text className="metric-value">{responseRate}%</Text>
              <View className="arrow-icon">
                <Image
                  src={responseRate >= 70 ? greenUpArrowIcon : redDownArrowIcon}
                  mode="widthFix"
                  style={{ width: "14px", height: "14px" }}
                />
              </View>
            </View>
            <View className="metric-label">服务响应率</View>
          </View>
        </View> */}

        {/* 分隔线 */}
        {!isCanceled && <View className="divider"></View>}
      </View>

      {/* 历史成交区域 */}
      {showHistory && !isCanceled && (
        <View className="history-section">
          <Text className="history-title">近30日成交</Text>
          <View className="history-images">
            <ImageSlider
              images={historyImages}
              width={80}
              height={80}
              gap={8}
              borderRadius={10}
              showGradientMask={true}
            />
            <View className="image-fade"></View>
          </View>
        </View>
      )}
    </View>
  );
};

export default MerchantCard;
