import React, { useState } from "react";
import { View, Text, Input, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./index.scss";
import CrystalButton from "../CrystalButton";
import rightArrowGolden from "@/assets/icons/right-arrow-golden.svg";
import useKeyboardHeight from "@/hooks/useKeyboardHeight";
import api from "@/utils/api";
import { pageUrls } from "@/config/page-urls";

interface BudgetDialogProps {
  visible: boolean;
  title?: string;
  designNumber?: string;
  productImage?: string;
  onClose?: () => void;
  onConfirm?: (budget: number) => void;
}

const BudgetDialog: React.FC<BudgetDialogProps> = ({
  visible,
  title = "夏日睡莲",
  designNumber = "0001",
  productImage,
  onConfirm,
  onClose,
}) => {
  const [budget, setBudget] = useState<string>('');
  const { keyboardHeight } = useKeyboardHeight();

  const handleConfirm = () => {
    const budgetValue = parseFloat(budget) || 0;
    if (onConfirm) {
      onConfirm(budget);
      return;
    }
    api.userHistory.createOrder({
      design_id: parseInt(designNumber),
      price: budgetValue
    }).then((res) => {
      const { order_uuid } = res?.data || {};
      Taro.navigateTo({
        url: `${pageUrls.orderDispatching}?orderid=${order_uuid}`
      }).then(() => {
        onClose?.();
      });
    });
  };

  const handleBudgetChange = (e: any) => {
    const value = e.detail.value;
    // 只允许数字和小数点
    const numericValue = value.replace(/[^\d.]/g, "");
    setBudget(numericValue);
  };

  return (
    <View className={`budget-dialog-overlay ${visible ? "visible" : ""}`} onClick={onClose} style={{ height: `calc(100vh - ${keyboardHeight}px)` }} >
      <View className="budget-dialog" onClick={(e) => e.stopPropagation()}>
        {/* 标题区域 */}
        <View className="budget-dialog-header">
          <View className="budget-dialog-title-section">
            <View className="budget-dialog-title-group">
              <Text className="budget-dialog-main-title">{title}</Text>
            </View>
            <View className="budget-dialog-subtitle">
              设计编号：{designNumber}
            </View>
          </View>
        </View>

        {/* 主要内容区域 */}
        <View className="budget-dialog-content">
          <View className="budget-dialog-card">
            <View className="budget-dialog-form">
              <View className="budget-dialog-budget-section">
                <View className="budget-dialog-budget-input-area">
                  <View className="budget-dialog-budget-header">
                    <Text className="budget-dialog-budget-label">我的预算</Text>
                  </View>
                  <View className="budget-dialog-budget-input-wrapper">
                    <Input
                      className="budget-dialog-input"
                      value={budget}
                      onInput={handleBudgetChange}
                      type="digit"
                      placeholder="0.00"
                      // placeholderClass="budget-input-placeholder"
                      // placeholderTextColor="red"
                      placeholderStyle="color: #00000033;"
                    />
                  </View>
                </View>

                {/* 商品图片 */}
                {productImage && (
                  <View className="budget-dialog-product-image">
                    <Image
                      className="budget-dialog-image"
                      src={productImage}
                      mode="widthFix"
                    />
                  </View>
                )}
              </View>

              {/* 说明文字 */}
              <View className="budget-dialog-notice">
                <View className="budget-dialog-divider" />
                <Text className="budget-dialog-notice-text">
                  预算只用于算法匹配，价格商家不可见，非最终到手价。
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 确认按钮 */}
        <View style={{ display: "flex", justifyContent: "center" }}>
          <CrystalButton
            style={{ width: "220px", height: "46px", margin: "36px 0 0" }}
            onClick={handleConfirm}
            text="确认"
            icon={
              <Image
                src={rightArrowGolden}
                style={{ width: "16px", height: "10px" }}
              />
            }
            isPrimary
          />
        </View>
      </View>
    </View>
  );
};

export default BudgetDialog;
