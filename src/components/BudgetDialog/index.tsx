import React, { useState } from "react";
import { View, Text, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./index.scss";
import CrystalButton from "../CrystalButton";
import rightArrowGolden from "@/assets/icons/right-arrow-golden.svg";
import useKeyboardHeight from "@/hooks/useKeyboardHeight";
import api, { userApi } from "@/utils/api";
import { pageUrls } from "@/config/page-urls";
import sameProductIcon from "@/assets/icons/same-product-tip-icon.svg";
import LogisticsCard, { AddressInfo } from "../LogisticsCard";
import apiPay from "@/utils/api-pay";

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
  workId,
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
  const [address, setAddress] = useState<AddressInfo | undefined>(undefined);
  const [orderUuid, setOrderUuid] = useState<string | undefined>(undefined);


  const doPurchase = async (address: AddressInfo | undefined) => {
    if (!isSameProduct) {
      Taro.reportEvent('result_event', {
        confirm_pay: 1
      })
    } else {
      Taro.reportEvent('inspiration_event', {
        same_product_pay: 1
      })
    }
    if (onConfirm) {
      onConfirm(referencePrice || 0);
      return;
    }

    try {

      const addressInfo = {
        name: address?.userName,
        phone: address?.telNumber,
        province: address?.provinceName,
        city: address?.cityName,
        district: address?.countyName,
        detail: address?.detailInfo,
        postal_code: address?.postalCode,
      }
  
      const apiCall = isSameProduct ? apiPay.buySameProductV2 : apiPay.generateOrder;
      const params = isSameProduct ? { work_id: workId, address_info: addressInfo } : { design_id: parseInt(designNumber), address_info: addressInfo };
      let _orderUuid;
      if (!orderUuid) {
        const res = await apiCall(params);
        _orderUuid = res?.data?.order_uuid;
        setOrderUuid(_orderUuid);
      } else {
        _orderUuid = orderUuid;
      }
      apiPay
        .purchase({ orderId: _orderUuid, amount: referencePrice || 0 })
        .then((res) => {
          const wxPayParams = res?.data;
          Taro.requestPayment({
            timeStamp: wxPayParams.timestamp, // 秒级时间戳
            nonceStr: wxPayParams.nonce_str,
            package: wxPayParams.package, // 服务端返回
            signType: wxPayParams.sign_type,
            paySign: wxPayParams.pay_sign,
            success: () => {
              Taro.getSetting({
                success: (res) => {
                  console.log(res, 'res')
                }
              })
              Taro.requestSubscribeMessage({
                tmplIds: ["KoXRoTjwgniOQfSF9WN7h-hT_mw-AYRDhwyG_9cMTgI"], // 最多3个
                entityIds: [_orderUuid], // 添加必需的 entityIds 参数
                complete: () => {
                  Taro.reLaunch({
                    url: `${pageUrls.orderDetail}?orderId=${_orderUuid}`,
                  });

                },
                success: () => {
                  Taro.reLaunch({
                    url: `${pageUrls.orderDetail}?orderId=${_orderUuid}`,
                  })
                },
                fail: () => Taro.reLaunch({
                  url: `${pageUrls.orderDetail}?orderId=${_orderUuid}`,
                })
              });
            },
            fail: (err) => console.error("支付失败", err),
          });
        });
    } catch (error) {
      console.error("error", error);
    }

    // api.userHistory
    //   .createOrder({
    //     design_id: parseInt(designNumber),
    //     price: referencePrice || 0,
    //   })
    //   .then((res) => {
    //     const { order_uuid } = res?.data || {};
    //     Taro.getSetting({
    //       success: (res) => {
    //         console.log(res, 'res')
    //       }
    //     })
    //     Taro.requestSubscribeMessage({
    //       tmplIds: ["KoXRoTjwgniOQfSF9WN7h-hT_mw-AYRDhwyG_9cMTgI"], // 最多3个
    //       entityIds: [order_uuid], // 添加必需的 entityIds 参数
    //       complete: () => {
    //         Taro.reLaunch({
    //           url: `${pageUrls.orderDetail}?orderId=${order_uuid}`,
    //         });

    //       },
    //       success: () => {
    //         Taro.reLaunch({
    //           url: `${pageUrls.orderDetail}?orderId=${order_uuid}`,
    //         })
    //       },
    //       fail: () => Taro.reLaunch({
    //         url: `${pageUrls.orderDetail}?orderId=${order_uuid}`,
    //       })
    //     });
    //   });
  }


  const handleConfirm = async () => {
    if (!address) {
      Taro.showToast({
        title: "请先添加收货地址",
        icon: "none",
        duration: 1000,
      });
      Taro.chooseAddress({
        success: (result) => {
          setAddress(result);
          doPurchase(result);
        },
      });
      return;
    }
    doPurchase(address);
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
        <View className="budget-dialog-header" style={{ padding: '32px 32px 16px 32px' }}>
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
          {address && (
            <LogisticsCard
              address={address}
              onAddressChange={setAddress}
              enableChangeAddress={true}
              logisticsStatus={undefined}
              onViewLogistics={undefined}
            />
          )}
          <View className="budget-dialog-card">
            <View className="budget-dialog-form">
              <View className="budget-dialog-budget-section">
                <View className="budget-dialog-budget-section-container">
                  <View className="budget-dialog-budget-input-area">
                    {/* {!isSameProduct && (<View className="budget-dialog-budget-header">
                      <Text className="budget-dialog-budget-label">参考价</Text>
                    </View>)} */}
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
                  {isSameProduct ?
                   <Text className="budget-dialog-notice-text">'同款制作，品质如一，价格更低' </Text> :
                   <Text className="budget-dialog-notice-text">下单后与客服确认实拍图，满意后送检发货，实拍图不满意可
                    <Text className="budget-dialog-notice-text-bold">全额退款。</Text>
                   </Text>
                  }
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
              text="确认支付"
              // icon={
              //   <Image
              //     src={rightArrowGolden}
              //     style={{ width: "16px", height: "10px" }}
              //   />
              // }
              isPrimary
            />
          </View>
          {/* {!isSameProduct && (
            <View className="creator-info-container">
              <View>
                专属客服将与您核对
              </View>
              <View className="creator-nickname">
                实拍图
              </View>
              <View>
                ，满意后发货
              </View>
            </View>
          )} */}
          {isSameProduct && (
            <View className="creator-info-container">
              <View>
                创作者
              </View>
              <View className="creator-nickname">
                {`${creatorName}`}
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default BudgetDialog;
