import React from "react";
import { Image, Text, View } from "@tarojs/components";
import styles from "./index.module.scss";
import arrowRightIcon from "@/assets/icons/arrow-right.svg";
import { LILI_AVATAR_IMAGE_URL } from "@/config";

interface ViewReportCardProps {
  /** 报告标题 */
  title?: string;
  /** 报告副标题 */
  subtitle?: string;
  /** 头像图片地址 */
  avatar?: string;
  /** 操作按钮文本 */
  actionText?: string;
  /** 点击回调函数 */
  onActionClick?: () => void;
  /** 是否显示操作按钮 */
  showAction?: boolean;
  disabled?: boolean;
}

const ViewReportCard: React.FC<ViewReportCardProps> = ({
  title = "手串能量",
  subtitle = "深度解读", 
  avatar = LILI_AVATAR_IMAGE_URL,
  actionText = "立即查看",
  onActionClick,
  showAction = true,
  disabled = false,
}) => {
  return (
    <View className={styles.viewReportCard} onClick={onActionClick}>
      {/* 左侧内容区域 */}
      <View className={styles.contentSection}>
        {/* 头像 */}
        <View className={styles.avatarContainer}>
          <Image 
            src={avatar} 
            mode="aspectFill"
            className={styles.avatarImage}
          />
        </View>
        
        {/* 文本信息 */}
        <View className={styles.textInfo}>
          <Text className={styles.title}>{title}</Text>
          <Text className={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>

      {/* 右侧操作区域 */}
      {showAction && (
        <View className={styles.actionSection}>
          <Text className={styles.actionText}>{actionText}</Text>
          <View className={styles.arrowIcon}>
            <Image src={arrowRightIcon} className={styles.arrowImage} />
          </View>
        </View>
      )}
      {disabled && (
        <View className={styles.disabledection}>
          <Text className={styles.actionText}>分析中...</Text>
        </View>
      )}
    </View>
  );
};

export default ViewReportCard;
