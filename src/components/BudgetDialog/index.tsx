import React from "react";
import { View, Text, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./index.scss";
import CrystalButton from "../CrystalButton";
import rightArrowGolden from "@/assets/icons/right-arrow-golden.svg";
import useKeyboardHeight from "@/hooks/useKeyboardHeight";
import api, { userApi } from "@/utils/api";
import { pageUrls } from "@/config/page-urls";
import sameProductIcon from "@/assets/icons/same-product-tip-icon.svg";

interface BudgetDialogProps {
  visible: boolean;
  title?: string;
  designNumber?: string;
  productImage?: string;
  onClose?: () => void;
  onConfirm?: (budget: number) => void;
  onModifyDesign?: () => void;
  referencePrice?: number;
  isSameProduct?: boolean;
  creatorName?: string;
  originalPrice?: number;
}

const BudgetDialog: React.FC<BudgetDialogProps> = ({
  visible,
  title = "夏日睡莲",
  designNumber = "0001",
  productImage,
  onConfirm,
  onClose,
  referencePrice,
  originalPrice,
  onModifyDesign,
  isSameProduct = false,
  creatorName = "",
}) => {
  const { keyboardHeight } = useKeyboardHeight();

  const handleConfirm = async () => {
    const userData = await userApi.getUserInfo();
    const { default_contact, phone, wechat_id } = userData?.data || {} as any;
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
        price: referencePrice || 0,
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
          entityIds: [order_uuid], // 添加必需的 entityIds 参数
          complete: () => {
            Taro.redirectTo({
              url: `${pageUrls.orderDetail}?orderId=${order_uuid}`,
            })
          },
          success: () => {
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
        {/* 同款制作提示条 */}
        {isSameProduct && (
          <View className="budget-dialog-promo-banner">
            <Image src={sameProductIcon} style={{ width: "20px", height: "20px", marginRight: "4px" }} />
            <Text className="budget-dialog-promo-text">同款制作前20名用户享</Text>
            <View className="budget-dialog-promo-discount">
              9折
            </View>
          </View>
        )}

        {/* 标题区域 */}
        <View className="budget-dialog-header">
          <View className="budget-dialog-title-section">
            <View className="budget-dialog-title-group">
              <View className="budget-dialog-main-title">{title}</View>
              {isSameProduct && (<View className="budget-dialog-limited-tag">
                <Text className="budget-dialog-limited-text">限时上架</Text>
              </View>)}
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
                <View className="budget-dialog-budget-section-container">
                  <View className="budget-dialog-budget-input-area">
                    {!isSameProduct && (<View className="budget-dialog-budget-header">
                      <Text className="budget-dialog-budget-label">参考价</Text>
                    </View>)}
                    <View className="budget-dialog-budget-price-wrapper">
                      <View className="budget-dialog-budget-input-value">
                        {referencePrice}
                      </View>
                      <View className="budget-dialog-budget-input-unit">RMB</View>
                    </View>
                  </View>
                  {isSameProduct && (<View className="budget-dialog-original-price-text">
                    原价：{originalPrice}
                  </View>)}
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
                  {isSameProduct ? '同款制作，品质如一，价格更低' : '参考价格只是系统根据当前市场估算的结果，非最终到手价。'}
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
          {!isSameProduct && (<View className="budget-dialog-button-link" onClick={onModifyDesign}>
            修改定制方案
          </View>)}
          {isSameProduct && (<View className="creator-info-container">
            <View>
              创作者
            </View>
            <View className="creator-nickname">
              {`${creatorName}`}
            </View>
          </View>)}
        </View>
      </View>
    </View>
  );
};

export default BudgetDialog;
