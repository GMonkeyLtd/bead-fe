import React from "react";
import { View, Text, Image } from "@tarojs/components";
import styles from "./index.module.scss";

interface QrCodeDialogProps {
  visible: boolean;
  qrCodeUrl: string;
  merchantName?: string;
  onClose: () => void;
}

const QrCodeDialog: React.FC<QrCodeDialogProps> = ({
  visible,
  qrCodeUrl,
  merchantName,
  onClose,
}) => {
  if (!visible) return null;

    return (
    <View className={styles.qrCodeDialogOverlay} onClick={onClose}>
      <View className={styles.qrCodeDialog} onClick={(e) => e.stopPropagation()}>
        <View className={styles.dialogHeader}>
          <Text className={styles.dialogTitle}>商家微信二维码</Text>
          <View className={styles.closeButton} onClick={onClose}>
            <Text className={styles.closeIcon}>×</Text>
          </View>
        </View>
        
        <View className={styles.dialogContent}>
          <View className={styles.merchantInfo}>
            {merchantName && (<Text className={styles.merchantName}>{merchantName}</Text>)}
            {/* <Text className={styles.merchantDesc}>扫描二维码添加商家微信</Text> */}
          </View>
          
          <View className={styles.qrCodeContainer}>
            <Image
              src={qrCodeUrl}
              className={styles.qrCodeImage}
              mode="aspectFit"
              showMenuByLongpress={true}
            />
          </View>
          
          <Text className={styles.qrCodeTip}>
            长按扫码添加商家微信
          </Text>
        </View>
      </View>
    </View>
  );
};

export default QrCodeDialog; 