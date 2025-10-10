import React, { useState } from 'react';
import { View, Image, Text } from '@tarojs/components';
import styles from './styles/BeadItem.module.scss';

interface BeadItemProps {
  /** 珠子图片URL */
  imageUrl: string;
  /** 珠子名称 */
  name: string;
  /** 珠子规格，如 "8, 10, 12, 14, 15, 16mm" */
  specifications: string;
  /** 是否显示替换按钮 */
  showReplaceButton?: boolean;
  /** 是否显示添加按钮 */
  showAddButton?: boolean;
  /** 替换按钮点击事件 */
  onReplaceClick?: () => void;
  /** 添加按钮点击事件 */
  onAddClick?: () => void;
  /** 整个卡片点击事件 */
  onItemClick?: () => void;
  /** 自定义样式类名 */
  className?: string;
  /** 是否需要旋转图片 */
  imageNeedRotate?: boolean;
  /** 图片点击事件 */
  onBeadImageClick?: () => void;
}

const BeadItem: React.FC<BeadItemProps> = ({
  imageUrl,
  name,
  specifications,
  showReplaceButton = false,
  showAddButton = true,
  onReplaceClick,
  onAddClick,
  onItemClick,
  onBeadImageClick,
  className = '',
  imageNeedRotate = false
}) => {
  const [showImagePreview, setShowImagePreview] = useState(false);

  const handleReplaceClick = (e: any) => {
    e.stopPropagation();
    onReplaceClick?.();
  };

  const handleAddClick = (e: any) => {
    e.stopPropagation();
    onAddClick?.();
  };

  const handleImageClick = (e: any) => {
    e.stopPropagation();
    // 点击图片，从页面底部弹出图片预览弹窗，不使用Taro.previewImage
    onBeadImageClick?.();
  };

  return (
    <View 
      className={`${styles.beadItemCard} ${className} ${!showReplaceButton ? styles.active : ''}`}
      onClick={() => onItemClick?.()}
    >
      {/* 主要内容区域 */}
        <View className={styles.beadItemMain}>
        {/* 珠子图片 */}
        <View className={styles.beadItemImage}>
          <Image 
            src={imageUrl}
            className={styles.beadImage}
            mode="aspectFit"
            style={{ transform: imageNeedRotate ? 'rotate(180deg)' : 'none' }}
            onClick={handleImageClick}
          />
        </View>

        {/* 珠子信息 */}
        <View className={styles.beadItemInfo}>
          <View className={styles.beadItemHeader}>
            <Text className={styles.beadItemName}>{name}</Text>
          </View>
          <View className={styles.beadItemSpecs}>
            <Text className={styles.specsLabel}>规格 :</Text>
            <Text className={styles.specsValue}>{specifications}</Text>
          </View>
        </View>
      </View>

      {/* 操作按钮区域 */}
      <View className={styles.beadItemActions}>
        {showReplaceButton && (
          <View 
            className={`${styles.actionButton} ${styles.replaceButton}`}
            onClick={handleReplaceClick}
          >
            <Text className={styles.buttonText}>替换</Text>
          </View>
        )}
        
        {showAddButton && (
          <View 
            className={`${styles.actionButton} ${styles.addButton}`}
            onClick={handleAddClick}
          >
            <View className={styles.addIcon}>
              <View className={styles.addIconPlus}>
                <View className={styles.plusHorizontal}></View>
                <View className={styles.plusVertical}></View>
              </View>
            </View>
            <Text className={styles.buttonText}>添加</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default BeadItem;
