import React from "react";
import { View, Text, Image } from "@tarojs/components";
import styles from "./index.module.scss";
import editRecordSvg from "@/assets/icons/edit-record.svg";
import boySvg from "@/assets/icons/boy.svg";
import girlSvg from "@/assets/icons/girl.svg";
import currentRecordSvg from "@/assets/icons/current-record.svg";
import switchSvg from "@/assets/icons/switch.svg";
import deleteSvg from "@/assets/icons/delete.svg";

interface ArchiveCardProps {
  archive: ArchiveItem;
  onClick?: () => void;
  onCurrentClick?: () => void;
  onSwitchClick?: () => void;
  onDeleteClick?: () => void;
}

export interface ArchiveItem {
  id: string;
  name: string;
  designCount: number;
  gender: "男生" | "女生";
  birthDate: string;
  birthTime: string;
  isCurrent: boolean;
  isCustom: boolean;
}

const ArchiveCard: React.FC<ArchiveCardProps> = ({
  archive,
  onClick,
  onCurrentClick,
  onSwitchClick,
  onDeleteClick,
}) => {
  const handleCardClick = (e: any) => {
    e.stopPropagation();
    onClick?.();
  };

  const handleCurrentButtonClick = (e: any) => {
    e.stopPropagation();
    onCurrentClick?.();
  };

  const handleSwitchClick = (e: any) => {
    e.stopPropagation();
    onSwitchClick?.();
  };

  const handleDeleteClick = (e: any) => {
    e.stopPropagation();
    onDeleteClick?.();
  };

  return (
    <View className={`${styles.archiveCard} ${archive.isCustom ? styles.customArchive : ''}`} onClick={handleCardClick}>
      <View className={styles.cardContent}>
        <View className={styles.cardHeader}>
          <View className={styles.archiveNameSection}>
            <Text className={styles.archiveName}>{archive.name}</Text>
            <View className={styles.nameIcon}>
              <Image src={editRecordSvg} mode="widthFix" />
            </View>
          </View>
          <View className={styles.designCountBadge}>
            <Text className={styles.designCountText}>{archive.designCount}个 设计方案</Text>
          </View>
        </View>
        
        <View className={styles.divider} />
        
        <View className={styles.archiveInfo}>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>性别：</Text>
            <View className={styles.infoValue}>
              <View className={styles.genderIcon}>
                <Image src={archive.gender === '女生' ? girlSvg : boySvg} mode="widthFix" />
              </View>
              <Text className={styles.infoText}>{archive.gender}</Text>
            </View>
          </View>
          
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>生辰：</Text>
            <View className={styles.infoValue}>
              <Text className={styles.infoText}>{archive.birthDate}</Text>
              <Text className={`${styles.infoText} ${styles.timeText}`}>({archive.birthTime})</Text>
            </View>
          </View>
        </View>
      </View>
      
      <View className={styles.actionSection}>
        {archive.isCurrent ? (
          // 当前档案状态 - 显示"当前档案"按钮
          <View 
            className={`${styles.currentArchiveButton} ${styles.active}`}
            onClick={handleCurrentButtonClick}
          >
            <View className={styles.buttonIcon}>
              <Image src={currentRecordSvg} mode="widthFix" />
            </View>
            <Text className={styles.buttonText}>当前档案</Text>
          </View>
        ) : (
          // 非当前档案状态 - 显示"切换档案"和删除按钮
          <>
            <View 
              className={styles.switchArchiveButton}
              onClick={handleSwitchClick}
            >
              <View className={styles.switchIcon}>
                <Image src={switchSvg} mode="widthFix" />
              </View>
              <Text className={styles.switchText}>切换档案</Text>
            </View>
            <View 
              className={styles.deleteButton}
              onClick={handleDeleteClick}
            >
              <View className={styles.deleteIcon}>
                <Image src={deleteSvg} mode="widthFix" />
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

export default ArchiveCard; 