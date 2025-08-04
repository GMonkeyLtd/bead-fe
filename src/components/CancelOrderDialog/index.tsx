import React, { useState } from "react";
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./index.scss";

export interface CancelOrderDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

const cancelReasons = [
  "不想要了",
  "商家没有联系我",
  "商家报价超出预算",
  "与商家沟通不畅",
  "商家要求取消",
  "设计方案不满意",
  "其他原因"
];

const CancelOrderDialog: React.FC<CancelOrderDialogProps> = ({
  visible,
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
        title: "请选择取消原因",
        icon: "none",
      });
      return;
    }
    onConfirm(selectedReason);
  };

  return (
    <View className="cancel-order-dialog-overlay">
      <View className="cancel-order-dialog">
        {/* 标题 */}
        <View className="dialog-header">
          <Text className="dialog-title">取消订单</Text>
        </View>

        {/* 内容区域 */}
        <View className="dialog-content">
          <View className="reason-prompt">
            <Text className="prompt-text">请选择取消订单的原因：</Text>
          </View>

          <View className="reason-list">
            {cancelReasons.map((reason) => (
              <View
                key={reason}
                className="reason-item"
                onClick={() => handleReasonSelect(reason)}
              >
                <Text className="reason-text">{reason}</Text>
                <View className={`radio-button ${selectedReason === reason ? 'selected' : ''}`}>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 底部按钮 */}
        <View className="dialog-footer">
          <View className="confirm-button" onClick={handleConfirm}>
            <Text className="confirm-text">确定取消</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default CancelOrderDialog; 