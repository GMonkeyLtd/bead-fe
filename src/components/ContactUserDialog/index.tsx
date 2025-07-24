import React from "react";
import { View, Text, Image } from "@tarojs/components";
import { makePhoneCall, showToast, setClipboardData } from "@tarojs/taro";
import styles from "./index.module.scss";
import closeIcon from "@/assets/icons/close.svg";
import copyIcon from "@/assets/icons/copy.svg";

interface UserInfo {
  default_contact: number; // 0: 电话, 1: 微信
  phone?: string;
  wechat?: string;
}

interface ContactUserDialogProps {
  visible: boolean;
  userInfo: UserInfo;
  onClose: () => void;
}

const ContactUserDialog: React.FC<ContactUserDialogProps> = ({
  visible,
  userInfo,
  onClose,
}) => {
  if (!visible) {
    return null;
  }

  // 格式化电话号码显示
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "";
    // 隐藏中间4位数字
    const phoneStr = phone.toString();
    if (phoneStr.length >= 7) {
      return `${phoneStr.slice(0, 3)} **** ${phoneStr.slice(-3)}`;
    }
    return phoneStr;
  };

  // 拨打电话
  const handleCallPhone = async () => {
    if (!userInfo.phone) {
      showToast({
        title: "电话号码不存在",
        icon: "none",
      });
      return;
    }

    try {
      await makePhoneCall({
        phoneNumber: userInfo.phone.toString(),
      });
    } catch (error) {
      showToast({
        title: "拨号失败",
        icon: "none",
      });
    }
  };

  // 复制联系方式
  const handleCopyContact = async () => {
    const contactInfo =
      userInfo.default_contact === 0
        ? userInfo.phone?.toString()
        : userInfo.wechat_id;

    if (!contactInfo) {
      showToast({
        title: "联系方式不存在",
        icon: "none",
      });
      return;
    }

    try {
      await setClipboardData({
        data: contactInfo,
      });
      showToast({
        title: "已复制到剪贴板",
        icon: "success",
      });
    } catch (error) {
      showToast({
        title: "复制失败",
        icon: "none",
      });
    }
  };

  // 联系微信用户
  const handleContactWechat = () => {
    if (!userInfo.wechat_id) {
      showToast({
        title: "微信号不存在",
        icon: "none",
      });
      return;
    }

    showToast({
      title: `请添加微信：${userInfo.wechat_id}`,
      icon: "none",
      duration: 3000,
    });
  };

  const renderContactInfo = () => {
    if (userInfo.default_contact === 0) {
      // 电话联系
      return (
        <View className={styles.contactInfoCard} onClick={handleCallPhone}>
          <Text className={styles.contactNumber}>
            {formatPhoneNumber(userInfo.phone || "")}
          </Text>
          <View
            className={styles.contactDialogCopyIcon}
            onClick={(e) => {
              e.stopPropagation();
              handleCopyContact();
            }}
          >
            <Image src={copyIcon} style={{ width: "24px", height: "24px" }} />
          </View>
        </View>
      );
    } else {
      // 微信联系
      return (
        <View className={styles.contactInfoCard}>
          <Text className={styles.contactNumber}>
            {userInfo.wechat_id || "未提供"}
          </Text>
          <View
            className={styles.contactDialogCopyIcon}
            onClick={(e) => {
              e.stopPropagation();
              handleCopyContact();
            }}
          >
            <Image src={copyIcon} style={{ width: "24px", height: "24px" }} />
          </View>
        </View>
      );
    }
  };

  return (
    <View className={styles.contactDialogOverlay}>
      <View className={styles.contactDialog}>
        {/* 头部区域 */}
        <View className={styles.contactDialogContent}>
          <View className={styles.contactDialogHeader}>
            <View className={styles.contactDialogHeaderTitle}>
              <Text className={styles.contactDialogTitleText}>
                {userInfo.default_contact === 0 ? "用户手机号" : "用户微信号"}
              </Text>
              <Image
                src={closeIcon}
                style={{ width: "20px", height: "20px" }}
                onClick={onClose}
              />
            </View>
            {/* <Text className={styles.subtitleText}>给商家的一句话，商家手册</Text> */}
          </View>

          {/* 联系信息区域 */}
          {renderContactInfo()}
        </View>

        {/* 底部按钮 */}
        <View className={styles.contactDialogFooter}>
          <View className={styles.contactDialogReturnBtn} onClick={onClose}>
            <Text className={styles.contactDialogReturnText}>返回</Text>
          </View>
          {userInfo.default_contact === 0 && userInfo.phone && (
            <View
              className={styles.contactDialogCallBtn}
              onClick={handleCallPhone}
            >
              <Text className={styles.contactDialogReturnText}>拨号</Text>
            </View>
          )}
          {userInfo.default_contact === 1 && userInfo.wechat_id && (
            <View
              className={styles.contactDialogCallBtn}
              onClick={handleCopyContact}
            >
              <Text className={styles.contactDialogReturnText}>复制微信号</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default ContactUserDialog;
