import React, { useState } from "react";
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./index.scss";

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
    <View className='cancel-order-dialog-overlay' onClick={handleOverlayClick}>
      <View className='cancel-order-dialog' onClick={handleDialogClick}>
        {/* 标题 */}
        <View className='dialog-header'>
          <Text className='dialog-title'>{type === 'cancel' ? "请选择取消原因" : "请选择退款原因"}</Text>
        </View>

        {/* 内容区域 */}
        <View className='dialog-content'>
          {/* <View className='reason-prompt'>
            <Text className='prompt-text'>请选择取消订单的原因：</Text>
          </View> */}

          <View className='reason-list'>
            {reasons[type].map((reason) => (
              <View
                key={reason}
                className='reason-item'
                onClick={() => handleReasonSelect(reason)}
              >
                <Text className='reason-text'>{reason}</Text>
                <View className={`radio-button ${selectedReason === reason ? 'selected' : ''}`}>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 底部按钮 */}
        <View className='dialog-footer'>
          <View className='confirm-button' onClick={handleConfirm}>
            <Text className='confirm-text'>确定取消</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default CancelOrderDialog; 