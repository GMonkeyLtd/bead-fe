import React, { useState } from "react";
import { View, Text, Input, Image, ScrollView } from "@tarojs/components";
import Taro from "@tarojs/taro";
import styles from "./index.module.scss";
import CrystalButton from "../CrystalButton";
import closeIcon from "@/assets/icons/close.svg";
import rightArrowGolden from "@/assets/icons/right-arrow-golden.svg";
import { http } from "@/utils/request";

interface ProductPriceFormProps {
  visible: boolean;
  orderNumber?: string;
  productName?: string;
  productImage?: string;
  onClose?: () => void;
  onConfirm?: (price: number, images: string[]) => void;
}

const ProductPriceForm: React.FC<ProductPriceFormProps> = ({
  visible,
  orderNumber,
  productName,
  productImage,
  onClose,
  onConfirm,
}) => {
  const [price, setPrice] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  if (!visible) {
    return null;
  }

  const handlePriceChange = (value: string) => {
    // 只允许输入数字和小数点
    const numericValue = value.replace(/[^\d.]/g, "");
    // 确保只有一个小数点
    const parts = numericValue.split(".");
    if (parts.length > 2) {
      return;
    }
    // 限制小数点后两位
    if (parts.length === 2 && parts[1].length > 2) {
      return;
    }
    setPrice(numericValue);
  };

  const handleChooseImage = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 9 - images.length,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
      });

      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        setUploading(true);
        
        const uploadPromises = res.tempFilePaths.map(async (filePath) => {
          try {
            const uploadRes = await http.upload("/upload", filePath);
            return uploadRes.data?.url || uploadRes.url;
          } catch (error) {
            console.error("图片上传失败:", error);
            Taro.showToast({
              title: "图片上传失败",
              icon: "none",
            });
            return null;
          }
        });

        const uploadedUrls = await Promise.all(uploadPromises);
        const validUrls = uploadedUrls.filter(url => url !== null);
        
        setImages(prev => [...prev, ...validUrls]);
        setUploading(false);
      }
    } catch (error) {
      console.error("选择图片失败:", error);
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (!price || parseFloat(price) <= 0) {
      Taro.showToast({
        title: "请输入有效价格",
        icon: "none",
      });
      return;
    }

    if (images.length === 0) {
      Taro.showToast({
        title: "请至少上传一张实拍图",
        icon: "none",
      });
      return;
    }

    onConfirm?.(parseFloat(price), images);
  };

  const handleOverlayClick = () => {
    onClose?.();
  };

  const handleDialogClick = (e: any) => {
    e.stopPropagation();
  };

  return (
    <View className={styles["product-price-form-overlay"]} onClick={handleOverlayClick}>
      <View className={styles["product-price-form"]} onClick={handleDialogClick}>
        {/* 头部 */}
        <View className={styles["form-header"]}>
          <View className={styles["header-content"]}>
            <Text className={styles["form-title"]}>提交商品价格</Text>
            {orderNumber && (
              <Text className={styles["order-number"]}>订单号：{orderNumber}</Text>
            )}
          </View>
          <View className={styles["close-btn"]} onClick={onClose}>
            <Image src={closeIcon} mode="aspectFit" style={{ width: "20px", height: "20px" }} />
          </View>
        </View>

        {/* 产品信息 */}
        {productImage && productName && (
          <View className={styles["product-info"]}>
            <Image className={styles["product-image"]} src={productImage} mode="aspectFill" />
            <View className={styles["product-details"]}>
              <Text className={styles["product-name"]}>{productName}</Text>
            </View>
          </View>
        )}

        <ScrollView className={styles["form-content"]} scrollY>
          {/* 价格输入 */}
          <View className={styles["price-section"]}>
            <View className={styles["section-header"]}>
              <Text className={styles["section-title"]}>商品价格</Text>
              <Text className={styles["required"]}>*</Text>
            </View>
            <View className={styles["price-input-container"]}>
              <Text className={styles["currency-symbol"]}>¥</Text>
              <Input
                className={styles["price-input"]}
                type="digit"
                placeholder="请输入价格"
                value={price}
                onInput={(e) => handlePriceChange(e.detail.value)}
              />
            </View>
          </View>

          {/* 实拍图上传 */}
          <View className={styles["images-section"]}>
            <View className={styles["section-header"]}>
              <Text className={styles["section-title"]}>实拍图</Text>
              <Text className={styles["required"]}>*</Text>
            </View>
            <Text className={styles["section-subtitle"]}>请上传商品实拍图，最多9张</Text>
            
            <View className={styles["images-container"]}>
              <View className={styles["images-grid"]}>
                {images.map((image, index) => (
                  <View key={index} className={styles["image-item"]}>
                    <Image
                      src={image}
                      className={styles["uploaded-image"]}
                      mode="aspectFill"
                    />
                    <View
                      className={styles["remove-image-btn"]}
                      onClick={() => handleRemoveImage(index)}
                    >
                      <Text className={styles["remove-icon"]}>×</Text>
                    </View>
                  </View>
                ))}
                
                {images.length < 9 && (
                  <View 
                    className={`${styles["add-image-btn"]} ${uploading ? styles["uploading"] : ''}`} 
                    onClick={handleChooseImage}
                  >
                    {uploading ? (
                      <Text className={styles["uploading-text"]}>上传中...</Text>
                    ) : (
                      <>
                        <Text className={styles["add-icon"]}>+</Text>
                        <Text className={styles["add-text"]}>添加图片</Text>
                      </>
                    )}
                  </View>
                )}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* 底部按钮 */}
        <View className={styles["form-footer"]}>
          <CrystalButton
            text="取消"
            onClick={onClose || (() => {})}
            style={{ flex: 1, marginRight: "12px" }}
          />
          <CrystalButton
            text="确认提交"
            onClick={handleConfirm}
            isPrimary
            icon={<Image src={rightArrowGolden} mode="aspectFit" style={{ width: "16px", height: "16px" }} />}
            style={{ flex: 1, marginLeft: "12px" }}
          />
        </View>
      </View>
    </View>
  );
};

export default ProductPriceForm;
