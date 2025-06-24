import React from "react";
import { Image, Text, View } from "@tarojs/components";
import phoneIcon from "@/assets/icons/phone.svg";
import wechatIcon from "@/assets/icons/wechat.svg";
import notificationIcon from "@/assets/icons/notification.svg";
import greenUpArrowIcon from "@/assets/icons/green-up-arrow.svg";
import redDownArrowIcon from "@/assets/icons/red-down-arrow.svg";
import remarkIcon from "@/assets/icons/remark.svg";
import "./index.scss";
import ImageSlider from "../ImageSlider";

interface MerchantCardProps {
  name: string;
  status: string;
  address: string;
  rating: number;
  dealRate: number;
  responseRate: number;
  historyCount: number;
  historyImages: string[];
  onCall?: () => void;
  onWechat?: () => void;
  onRemind?: () => void;
  onRemark?: () => void;
  showRemind?: boolean;
  showRemark?: boolean;
  showHistory?: boolean;
  isCanceled?: boolean;
}

const MerchantCard: React.FC<MerchantCardProps> = ({
  name,
  status,
  address,
  rating,
  dealRate,
  responseRate,
  historyCount,
  historyImages,
  showRemind = true,
  showRemark = true,
  showHistory = true,
  isCanceled = false,
  onCall,
  onWechat,
  onRemind,
  onRemark,
}) => {
  return (
    <View className="merchant-card">
      {/* 商家信息区域 */}
      <View className="merchant-info" style={{ opacity: isCanceled ? 0.5 : 1 }}>
        <View className="merchant-header">
          <View className="merchant-title">
            <Text className="merchant-name">{name}</Text>
          </View>
          <Text className="merchant-address">{address}</Text>
        </View>

        {/* 评分指标区域 */}
        <View className="metrics-section">
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
        </View>

        {/* 分隔线 */}
        <View className="divider"></View>
      </View>

      {/* 历史成交区域 */}
      {showHistory && (
        <View className="history-section">
          <Text className="history-title">历史成交（{historyCount}）</Text>
          <View className="history-images">
            <View className="image-list">
              {historyImages.slice(0, 4).map((image, index) => (
                <View key={index} className="history-image">
                  <img src={image} alt={`成交记录${index + 1}`} />
                </View>
              ))}
            </View>
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

      {/* 操作按钮区域 */}
      <View className="action-buttons">
        <View className="action-btn call-btn" onClick={onCall}>
          <Image src={phoneIcon} />
          <Text>打电话</Text>
        </View>
        <View className="action-btn wechat-btn" onClick={onWechat}>
          <Image src={wechatIcon} />
          <Text>发微信</Text>
        </View>
        {showRemind && (
          <View className="action-btn remind-btn" onClick={onRemind}>
            <Image src={notificationIcon} />
            <Text>催一下</Text>
          </View>
        )}
        {showRemark && (
          <View className="action-btn remark-btn" onClick={onRemark}>
            <Image src={remarkIcon} />
            <Text>评价</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default MerchantCard;
