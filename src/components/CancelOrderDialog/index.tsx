import React, { useState } from "react";
import { View, Text, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import styles from "./index.module.scss";
import radioSelectedIcon from "@/assets/icons/radio-selected.svg";

export interface CancelOrderDialogProps {
  visible: boolean;
  type?: 'cancel' | 'refund';
  onClose: () => void;
  onConfirm: (reason: string) => void;
}



const reasons = {
  cancel: [
    "不想要了",
    "商家没有联系我",
    "商家报价超出预算",
    "与商家沟通不畅",
    "商家要求取消",
    "设计方案不满意",
    "其他原因"
  ],
  refund: [
    "不想要了",
    "定制周期过长",
    "颜色/材质/款式与预期不符",
    "商家要求取消",
    "质量问题，假冒伪劣",
    "其他原因"
  ]
}

const CancelOrderDialog: React.FC<CancelOrderDialogProps> = ({
  visible,
  type = 'cancel',
  onClose,
  onConfirm,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>("");

  if (!visible) {
    return null;
  }

  const handleReasonSelect = (reason: string) => {
    setSelectedReason(reason);
  };

  const handleConfirm = () => {
    if (!selectedReason) {
      Taro.showToast({
        title: type === 'cancel' ? "请选择取消原因" : "请选择退款原因",
        icon: "none",
      });
      return;
    }
    onConfirm(selectedReason);
  };

  const handleOverlayClick = () => {
    onClose();
  };

  const handleDialogClick = (e: any) => {
    // 阻止事件冒泡，防止点击对话框内部时触发 overlay 的点击事件
    e.stopPropagation();
  };

  return (
    <View className={styles.cancelOrderDialogOverlay} onClick={handleOverlayClick}>
      <View className={styles.cancelOrderDialog} onClick={handleDialogClick}>
        {/* 标题 */}
        <View className={styles.dialogHeader}>
          <Text className={styles.dialogTitle}>{type === 'cancel' ? "请选择取消原因" : "请选择退款原因"}</Text>
        </View>

        {/* 内容区域 */}
        <View className={styles.dialogContent}>
          {/* <View className={styles.reasonPrompt}>
            <Text className={styles.promptText}>请选择取消订单的原因：</Text>
          </View> */}

          <View className={styles.reasonList}>
            {reasons[type].map((reason) => (
              <View
                key={reason}
                className={styles.reasonItem}
                onClick={() => handleReasonSelect(reason)}
              >
                <Text className={styles.reasonText}>{reason}</Text>
                <View className={`${styles.radioButton} ${selectedReason === reason ? styles.selected : ''}`}>
                  {selectedReason === reason && <Image src={radioSelectedIcon} className={styles.radioInner} />}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 底部按钮 */}
        <View className={styles.dialogFooter}>
          <View className={styles.confirmButton} onClick={handleConfirm}>
            <Text className={styles.confirmText}>{type === 'cancel' ? "确定取消" : "确定退款"}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default CancelOrderDialog; 