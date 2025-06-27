import React from "react";
import { Image, Text, View } from "@tarojs/components";
import "./index.scss";

interface UserInfoCardProps {
  userName: string;
  userSlogan: string;
  avatar: string;
  actionText?: string;
  onActionClick?: () => void;
  showAction?: boolean;
}

const UserInfoCard: React.FC<UserInfoCardProps> = ({
  userName,
  userSlogan,
  avatar,
  actionText = "商家后台",
  onActionClick,
  showAction = true,
}) => {
  return (
    <View className="user-info-card">
      {/* 用户信息区域 */}
      <View className="user-section">
        {/* 用户头像 */}
        <View className="user-avatar">
          <Image 
            src={avatar} 
            mode="aspectFill"
            className="avatar-image"
          />
        </View>
        
        {/* 用户文本信息 */}
        <View className="user-text-info">
          <Text className="user-name">{userName}</Text>
          <Text className="user-slogan">{userSlogan}</Text>
        </View>
      </View>

      {/* 操作按钮区域 */}
      {showAction && (
        <View className="action-section" onClick={onActionClick}>
          <View className="action-icon">
            <View className="exchange-icon">
              <View className="exchange-line exchange-line-1" />
              <View className="exchange-line exchange-line-2" />
            </View>
          </View>
          <Text className="action-text">{actionText}</Text>
        </View>
      )}
    </View>
  );
};

export default UserInfoCard; 