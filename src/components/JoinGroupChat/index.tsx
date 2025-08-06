import React, { useState } from "react";
import { View, Text, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import styles from "./index.module.scss";
import qrcodeIcon from "@/assets/icons/qrcode.svg";
import { APP_QRCODE_IMAGE_URL, JOIN_GROUP_AVATAR_IMAGE_URL} from "@/config";
import rightArrowIcon from "@/assets/icons/right-arrow.svg";
import CrystalButton from "../CrystalButton";
import giftIcon from "@/assets/icons/gift.svg";
import groupIcon from "@/assets/icons/group.svg";
import zixunIcon from "@/assets/icons/zixun.svg";
import JoinGroupQrcode from "./JoinGroupQrcode";

export interface JoinGroupChatProps {
  groupInfo?: {
    name: string;
    qrCodeUrl?: string;
  };
}

const defaultGroupInfo = {
  name: "璞光集水晶手串交流群",
  qrCodeUrl: APP_QRCODE_IMAGE_URL
};

const JoinGroupChat: React.FC<JoinGroupChatProps> = ({
  groupInfo = defaultGroupInfo,
}) => {
  const [showQRCode, setShowQRCode] = useState(false);

  const handleJoinClick = () => {
    setShowQRCode(true);
  };

  const handleQRCodeClose = () => {
    setShowQRCode(false);
  };

  const handleOverlayClick = () => {
    if (showQRCode) {
      handleQRCodeClose();
    }
  };

  const handleDialogClick = (e: any) => {
    e.stopPropagation();
  };

  const features = [
    { icon: giftIcon, text: "群内专属优惠" },
    { icon: groupIcon, text: "水晶买家交流" },
    { icon: zixunIcon, text: "官方咨询" }
  ];

  return (
    <View className={styles.joinGroupChatOverlay} onClick={handleOverlayClick}>
      <View className={styles.joinGroupChat} onClick={handleDialogClick}>
        {/* 群聊信息区域 */}
        <View className={styles.groupInfoSection}>
          <View className={styles.groupHeader}>
            <Image
              src={JOIN_GROUP_AVATAR_IMAGE_URL}
              className={styles.memberAvatar}
              style={{ zIndex: 1 }}
            />
            <View className={styles.groupDetails}>
              <Text className={styles.groupName}>{groupInfo.name}</Text>
              <Image
                src={rightArrowIcon}
                className={styles.rightArrowIcon}
                style={{ width: "12px", height: "12px" }}
              />
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
          <CrystalButton text="立即加入" onClick={handleJoinClick} isPrimary style={{ width: "100%" }} />
          <View className={styles.couponTag}>
            <Text className={styles.couponText}>进群领取专属优惠券</Text>
          </View>
        </View>
      </View>

      {/* 二维码弹窗 */}
      <JoinGroupQrcode
        showQRCode={showQRCode}
        onClose={handleQRCodeClose}
      />
    </View>
  );
};

export default JoinGroupChat; 