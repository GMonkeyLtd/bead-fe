import React, { useState } from "react";
import { View, Text, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import styles from "./index.module.scss";
import qrcodeIcon from "@/assets/icons/qrcode.svg";
import giftIcon from "@/assets/icons/collect.svg"; // 使用现有图标作为礼物图标
import userGroupIcon from "@/assets/icons/user-center.svg"; // 使用现有图标作为用户组图标
import headsetIcon from "@/assets/icons/phone.svg"; // 使用现有图标作为客服图标

export interface JoinGroupChatProps {
  visible: boolean;
  onClose: () => void;
  groupInfo?: {
    name: string;
    memberAvatars?: string[];
    qrCodeUrl?: string;
  };
}

const defaultGroupInfo = {
  name: "瑶光记·水晶手串 达人交流群",
  memberAvatars: [
    "/src/assets/figma-images/member-avatar-1.png",
    "/src/assets/figma-images/member-avatar-2.png", 
    "/src/assets/figma-images/member-avatar-3.png"
  ],
  qrCodeUrl: "https://via.placeholder.com/200x200/FFFFFF/000000?text=QR"
};

const JoinGroupChat: React.FC<JoinGroupChatProps> = ({
  visible,
  onClose,
  groupInfo = defaultGroupInfo,
}) => {
  const [showQRCode, setShowQRCode] = useState(false);

  if (!visible) {
    return null;
  }

  const handleJoinClick = () => {
    setShowQRCode(true);
  };

  const handleQRCodeClose = () => {
    setShowQRCode(false);
  };

  const handleOverlayClick = () => {
    if (showQRCode) {
      handleQRCodeClose();
    } else {
      onClose();
    }
  };

  const handleDialogClick = (e: any) => {
    e.stopPropagation();
  };

  const features = [
    { icon: giftIcon, text: "群内专属优惠" },
    { icon: userGroupIcon, text: "水晶买家交流" },
    { icon: headsetIcon, text: "官方咨询" }
  ];

  return (
    <View className={styles.joinGroupChatOverlay} onClick={handleOverlayClick}>
      <View className={styles.joinGroupChat} onClick={handleDialogClick}>
        {/* 群聊信息区域 */}
        <View className={styles.groupInfoSection}>
          <View className={styles.groupHeader}>
            <View className={styles.memberAvatars}>
              {groupInfo.memberAvatars?.map((avatar, index) => (
                <Image 
                  key={index}
                  src={avatar} 
                  className={styles.memberAvatar}
                  style={{ zIndex: groupInfo.memberAvatars!.length - index }}
                />
              ))}
            </View>
            <View className={styles.groupDetails}>
              <Text className={styles.groupName}>{groupInfo.name}</Text>
              <View className={styles.onlineIndicator}>
                <View className={styles.onlineDot} />
                <Text className={styles.onlineText}>在线</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 功能列表 */}
        <View className={styles.featuresSection}>
          {features.map((feature, index) => (
            <View key={index} className={styles.featureItem}>
              <View className={styles.featureIcon}>
                <Image src={feature.icon} className={styles.icon} />
              </View>
              <Text className={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </View>

        {/* 底部区域 */}
        <View className={styles.bottomSection}>
          <View className={styles.couponTag}>
            <Text className={styles.couponText}>进群领取专属优惠券</Text>
          </View>
          <View className={styles.joinButton} onClick={handleJoinClick}>
            <View className={styles.buttonReflection} />
            <View className={styles.buttonContent}>
              <Text className={styles.joinText}>立即加入</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 二维码弹窗 */}
      {showQRCode && (
        <View className={styles.qrCodeOverlay} onClick={handleQRCodeClose}>
          <View className={styles.qrCodeDialog} onClick={handleDialogClick}>
            <View className={styles.qrCodeHeader}>
              <Text className={styles.qrCodeTitle}>扫码加入群聊</Text>
              <View className={styles.closeButton} onClick={handleQRCodeClose}>
                <Image src={qrcodeIcon} className={styles.closeIcon} />
              </View>
            </View>
            <View className={styles.qrCodeContent}>
              <Image src={groupInfo.qrCodeUrl} className={styles.qrCodeImage} />
              <Text className={styles.qrCodeTip}>请使用微信扫描二维码加入群聊</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default JoinGroupChat; 