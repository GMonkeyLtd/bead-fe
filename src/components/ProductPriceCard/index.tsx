import React from "react";
import { Image, Text, View } from "@tarojs/components";
import phoneIcon from "@/assets/icons/phone.svg";
import locationIcon from "@/assets/icons/location.svg";
import confirmOrderIcon from "@/assets/icons/confirm-order.svg";
import ImageSlider from "../ImageSlider";
import styles from "./index.module.scss";
import qrCodeIcon from "@/assets/icons/qrcode.svg";

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
  onCheckLogistics?: () => void;
  onConfirmOrder?: () => void;
  onShowQrCode?: () => void;
}

const ProductPriceCard: React.FC<ProductPriceCardProps> = ({
  name,
  price,
  productImages,
  imageUploadTime,
  isSelf = false,
  onCheckLogistics,
  onConfirmOrder,
  onShowQrCode,
}) => {
  console.log(name, productImages, 'productImages')
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
        <Text className={styles.finalPriceLabel}>商品价格</Text>
        <Text className={styles.finalPriceValue}>¥ {price.toFixed(2)}</Text>
      </View>

      {/* 历史成交区域 */}
        <View className={styles.productImageSection}>
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
            />
            <View className={styles.imageFade}></View>
          </View>
        </View>

      {/* 购买须知区域 */}
      <View className={styles.purchaseNotice}>
        <Text className={styles.purchaseNoticeText}>买单须知：定制商品商家发货后，非质量问题无法退换</Text>
      </View>

      {/* 操作按钮区域 */}
      <View className={styles.actionButtons}>
        <View className={styles.actionBtn} onClick={onShowQrCode}>
          <Image src={phoneIcon} />
          <Text>联系商家</Text>
        </View>
        <View className={styles.actionBtn} onClick={onCheckLogistics}>
          <Image src={locationIcon} />
          <Text>查看物流</Text>
        </View>
        <View className={styles.actionBtn + " " + styles.confirmBtn} onClick={onConfirmOrder}>
          <Image src={confirmOrderIcon} />
          <Text>确认收货</Text>
        </View>
      </View>
    </View>
  );
};

export default ProductPriceCard;
