import React, { useState, useEffect } from "react";
import { View, Text, Input, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./index.scss";
import CrystalButton from "../CrystalButton";
import rightArrowGolden from "@/assets/icons/right-arrow-golden.svg";
import useKeyboardHeight from "@/hooks/useKeyboardHeight";
import api, { userApi } from "@/utils/api";
import payApi from "@/utils/api-pay";
import { pageUrls } from "@/config/page-urls";

interface BudgetDialogProps {
  visible: boolean;
  title?: string;
  designNumber?: string;
  productImage?: string;
  onClose?: () => void;
  onConfirm?: (budget: number) => void;
  referencePrice?: number;
}

const BudgetDialog: React.FC<BudgetDialogProps> = ({
  visible,
  title = "夏日睡莲",
  designNumber = "0001",
  productImage,
  onConfirm,
  onClose,
  referencePrice,
  onModifyDesign,
}) => {
  const { keyboardHeight } = useKeyboardHeight();

  const handleConfirm = async () => {
    const userData = await userApi.getUserInfo();
    const { default_contact, phone, wechat_id } = userData?.data || {};
    if (default_contact === 0 && !phone) {
      Taro.redirectTo({
        url: `${pageUrls.contactPreference}?budget=${referencePrice}&designId=${designNumber}`,
      });
      return;
    }
    if (default_contact === 1 && !wechat_id) {
      Taro.redirectTo({
        url: `${pageUrls.contactPreference}?budget=${referencePrice}&designId=${designNumber}`,
      });
      return;
    }
    if (onConfirm) {
      onConfirm(referencePrice || 0);
      return;
    }

    api.userHistory
      .createOrder({
        design_id: parseInt(designNumber),
        price: referencePrice,
      })
      .then((res) => {
        const { order_uuid } = res?.data || {};
        Taro.getSetting({
          success: (res) => {
            console.log(res, 'res')
          }
        })
        Taro.requestSubscribeMessage({
          tmplIds: ["KoXRoTjwgniOQfSF9WN7h-hT_mw-AYRDhwyG_9cMTgI"], // 最多3个
          complete:() => {
            Taro.redirectTo({
              url: `${pageUrls.orderDetail}?orderId=${order_uuid}`,
            })
          },
          success: (res) => {
            Taro.redirectTo({
              url: `${pageUrls.orderDetail}?orderId=${order_uuid}`,
            })
          },
          fail: () => Taro.redirectTo({
              url: `${pageUrls.orderDetail}?orderId=${order_uuid}`,
            })
        });
      });
  };

  return (
    <View
      className={`budget-dialog-overlay ${visible ? "visible" : ""}`}
      onClick={onClose}
      style={{ height: `calc(100vh - ${keyboardHeight}px)` }}
    >
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
                    <Text className="budget-dialog-budget-label">参考价</Text>
                  </View>
                  <View className="budget-dialog-budget-price-wrapper">
                    <View className="budget-dialog-budget-input-value">
                      {referencePrice}
                    </View>
                    <View className="budget-dialog-budget-input-unit">RMB</View>
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
                  参考价格只是系统根据当前市场估算的结果，非最终到手价。
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 确认按钮 */}
        <View className="budget-dialog-button-wrapper">
          <View style={{ display: "flex", justifyContent: "center" }}>
            <CrystalButton
              style={{ width: "220px", height: "46px" }}
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
          {onModifyDesign && (<View className="budget-dialog-button-link" onClick={onModifyDesign}>
            修改定制方案
          </View>)}
        </View>
      </View>
    </View>
  );
};

export default BudgetDialog;
