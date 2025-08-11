import React from "react";
import { Image, Text, View } from "@tarojs/components";
import phoneIcon from "@/assets/icons/phone.svg";
import locationIcon from "@/assets/icons/location.svg";
import confirmOrderIcon from "@/assets/icons/confirm-order.svg";
import ImageSlider from "../ImageSlider";
import styles from "./index.module.scss";
import qrCodeIcon from "@/assets/icons/qrcode.svg";
import withDrawIcon from "@/assets/icons/withdraw.svg";

export enum ProductAction {
  ContactMerchant = "contactMerchant",  // 联系商家
  CheckLogistics = "checkLogistics",  // 查看物流
  ConfirmOrder = "confirmOrder",  // 确认收货
  WithDrawRefund = "withDrawRefund",  // 撤销退款
}

interface ProductPriceCardProps {
  name: string;
  price: number;
  productImages: string[];
  imageUploadTime: string;
  showRemind?: boolean;
  showRemark?: boolean;
  showHistory?: boolean;
  isCanceled?: boolean;
  isSelf?: boolean;
  onShowQrCode?: () => void;
  actions?: {
    [key in ProductAction]: {
      text: string;
      onClick: () => void;
    };
  } | null;
  showBuyNotice?: boolean;
  showImages?: boolean;
  isAfterSale?: boolean;
}

const ProductPriceCard: React.FC<ProductPriceCardProps> = ({
  name,
  price,
  productImages,
  imageUploadTime,
  isSelf = false,
  actions,
  onShowQrCode,
  showBuyNotice,
  showImages,
  isAfterSale,
}) => {
  return (
    <View className={styles.productPriceCard}>
      {/* 商家信息区域 */}
      <View className={styles.productPriceHeader}>
        <View className={styles.productPriceTitle}>
          {isSelf && <View className={styles.merchantTag}>自营</View>}
          <Text className={styles.merchantName}>{name}</Text>
        </View>
        <Image src={qrCodeIcon} style={{ width: "14px", height: "14px" }} onClick={onShowQrCode} />
      </View>

      {/* 商品最终价格区域 */}
      <View className={styles.finalPriceSection}>
        <Text className={styles.finalPriceLabel}>{isAfterSale ? "退款金额" : "商品价格"}</Text>
        <Text className={styles.finalPriceValue}>¥ {price.toFixed(2)}</Text>
      </View>

      {/* 历史成交区域 */}
      {showImages && (<View className={styles.productImageSection}>
        <View className={styles.productImageTitleContainer}>
          <Text className={styles.productImageTitle}>商家实拍图</Text>
          <Text className={styles.productImageUploadTime}>{`${imageUploadTime} 上传`}</Text>
        </View>
        <View className={styles.productImages}>
          <ImageSlider
            images={productImages}
            width={80}
            height={80}
            gap={8}
            borderRadius={10}
            showGradientMask={true}
            visibleCount={4}
          />
          {productImages.length > 3 && <View className={styles.imageFade}></View>}
        </View>
      </View>)}

      {/* 购买须知区域 */}
      {showBuyNotice && (<View className={styles.purchaseNotice}>
        <Text className={styles.purchaseNoticeText}>买单须知：定制商品商家发货后，非质量问题无法退换</Text>
      </View>)}

      {/* 操作按钮区域 */}
      {actions && Object.keys(actions).length > 0 && (
        <View className={styles.actionButtons}>
          {actions?.[ProductAction.ContactMerchant] && (
            <View className={styles.actionBtn} onClick={actions?.[ProductAction.ContactMerchant]?.onClick}>
              <Image src={phoneIcon} />
              <Text>联系商家</Text>
            </View>
          )}
          {actions?.[ProductAction.CheckLogistics] && (
            <View className={styles.actionBtn} onClick={actions?.[ProductAction.CheckLogistics]?.onClick}>
              <Image src={locationIcon} />
              <Text>查看物流</Text>
            </View>
          )}
          {actions?.[ProductAction.ConfirmOrder] && (
            <View className={styles.actionBtn + " " + styles.confirmBtn} onClick={actions?.[ProductAction.ConfirmOrder]?.onClick}>
              <Image src={confirmOrderIcon} />
              <Text>确认收货</Text>
            </View>
          )}
          {actions?.[ProductAction.WithDrawRefund] && (
            <View className={styles.actionBtn + " " + styles.confirmBtn} onClick={actions?.[ProductAction.WithDrawRefund]?.onClick}>
              <Image src={withDrawIcon} />
              <Text>撤销申请</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default ProductPriceCard;
