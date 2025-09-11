import React from "react";
import { Image, Text, View } from "@tarojs/components";
import styles from "./index.module.scss";
import switchIcon from "@/assets/icons/switch.svg";
import editUserInfoIcon from "@/assets/icons/edit-userinfo.svg";


interface UserInfoCardProps {
  userName: string;
  userSlogan: string;
  avatar: string;
  actionText?: string;
  onActionClick?: () => void;
  showAction?: boolean;
  onAvatarClick?: () => void;
}

const UserInfoCard: React.FC<UserInfoCardProps> = ({
  userName,
  userSlogan,
  avatar,
  actionText = "商家后台",
  onActionClick,
  showAction = true,
  onAvatarClick,
}) => {
  return (
    <View className={styles.userInfoCard}>
      {/* 用户信息区域 */}
      <View className={styles.userSection}>
        {/* 用户头像 */}
        <View className={styles.userAvatar} onClick={onAvatarClick}>
          <Image 
            src={avatar} 
            mode="aspectFill"
            className={styles.avatarImage}
          />
        </View>
        
        {/* 用户文本信息 */}
        <View className={styles.userTextInfo} onClick={onAvatarClick}>
          <View className={styles.userNameContainer}>
            <View className={styles.userName}>{userName}</View>
            <Image src={editUserInfoIcon} className={styles.editUserInfoIcon} />
          </View>
          <Text className={styles.userSlogan}>{userSlogan}</Text>
        </View>
      </View>

      {/* 操作按钮区域 */}
      {showAction && (
        // <CrystalButton 
        //   onClick={onActionClick}
        //   text={actionText}
        //   prefix={<Image src={switchIcon} className={styles.exchangeIcon} />}
        // />
        
        <View className={styles.actionSection} onClick={onActionClick}>
          <View className={styles.actionIcon}>
            <Image src={switchIcon} className={styles.exchangeIcon} />
          </View>
          <Text className={styles.actionText}>{actionText}</Text>
        </View>
      )}
    </View>
  );
};

export default UserInfoCard; 