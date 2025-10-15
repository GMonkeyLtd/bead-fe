import React from 'react';
import { View, Image, Text } from '@tarojs/components';
import styles from './styles/ImagePreviewModal.module.scss';

interface ImagePreviewModalProps {
  /** 是否显示弹窗 */
  visible: boolean;
  /** 图片URL */
  imageUrl: string;
  /** 图片标题 */
  title?: string;
  /** 关闭弹窗回调 */
  onClose: () => void;
  /** 是否需要旋转图片 */
  imageNeedRotate?: boolean;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  visible,
  imageUrl,
  title,
  onClose,
  imageNeedRotate = false
}) => {
  if (!visible) return null;

  const handleMaskClick = () => {
    onClose();
  };

  const handleModalClick = (e: any) => {
    e.stopPropagation();
  };

  return (
    <View className={styles.imagePreviewModalMask} onClick={handleMaskClick}>
      <View className={`${styles.imagePreviewModal} ${visible ? styles.show : ''}`} onClick={handleModalClick}>
        {/* 关闭按钮 */}
        <View className={styles.modalCloseBtn} onClick={onClose}>
          <View className={styles.closeIcon}>
            <View className={`${styles.closeLine} ${styles.closeLine1}`}></View>
            <View className={`${styles.closeLine} ${styles.closeLine2}`}></View>
          </View>
        </View>

        {/* 标题 */}
        {title && (
          <View className={styles.modalTitle}>
            <Text className={styles.titleText}>{title}</Text>
          </View>
        )}

        {/* 图片容器 */}
        <View className={styles.modalImageContainer}>
          <Image 
            src={imageUrl}
            className={styles.modalImage}
            mode="aspectFit"
            style={{
              transform: imageNeedRotate ? 'rotate(180deg)' : 'none'
            }}
          />
        </View>
      </View>
    </View>
  );
};

export default ImagePreviewModal;
