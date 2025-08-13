import React, { useState } from "react";
import { View, Text, Input, Image, ScrollView } from "@tarojs/components";
import Taro from "@tarojs/taro";
import styles from "./index.module.scss";
import CrystalButton from "../CrystalButton";
import closeIcon from "@/assets/icons/close.svg";
import rightArrowGolden from "@/assets/icons/right-arrow-golden.svg";
import apiMerchant from "@/utils/api-merchant";

interface ProductImageUploadProps {
  visible: boolean;
  orderId?: string;
  productName?: string;
  productImage?: string;
  certificateImages?: string[];
  onClose?: () => void;
  onConfirm?: () => void;
}

const ProductImageUpload: React.FC<ProductImageUploadProps> = ({
  visible,
  orderId,
  productName,
  productImage,
  onClose,
  onConfirm,
}) => {
  const [realImages, setRealImages] = useState<string[]>([]);
  const [certificateImages, setCertificateImages] = useState<string[]>([]);

  const [uploading, setUploading] = useState(false);

  if (!visible) {
    return null;
  }


  // 根据文件扩展名确定MIME类型
  const getMimeType = (path: string) => {
    const ext = path.toLowerCase().split('.').pop();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      default:
        return 'image/jpeg';
    }
  };


  const handleChooseProductImage = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 9 - realImages.length,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
      });

      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        setUploading(true);

        // 将图片转换为base64格式
        const base64Promises = res.tempFilePaths.map(async (filePath) => {
          try {
            // 读取文件并转换为base64
            const fileRes = await new Promise<string>((resolve, reject) => {
              Taro.getFileSystemManager().readFile({
                filePath: filePath,
                encoding: 'base64',
                success: (res) => {
                  if (typeof res.data === 'string') {
                    resolve(res.data);
                  } else {
                    reject(new Error('Failed to read file as string'));
                  }
                },
                fail: reject
              });
            });

            const mimeType = getMimeType(filePath);
            const base64Data = `data:${mimeType};base64,${fileRes}`;

            return base64Data;
          } catch (error) {
            console.error("图片转换失败:", error);
            Taro.showToast({
              title: "图片转换失败",
              icon: "none",
            });
            return null;
          }
        });

        const base64Images = await Promise.all(base64Promises);
        const validImages = base64Images.filter(img => img !== null);

        setRealImages(prev => [...prev, ...validImages]);
        setUploading(false);
      }
    } catch (error) {
      console.error("选择图片失败:", error);
      setUploading(false);
    }
  };

  const handleChooseCertificateImage = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 2 - certificateImages.length,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
      });

      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        setUploading(true);

        // 将图片转换为base64格式
        const base64Promises = res.tempFilePaths.map(async (filePath) => {
          try {
            // 读取文件并转换为base64
            const fileRes = await new Promise<string>((resolve, reject) => {
              Taro.getFileSystemManager().readFile({
                filePath: filePath,
                encoding: 'base64',
                success: (res) => {
                  if (typeof res.data === 'string') {
                    resolve(res.data);
                  } else {
                    reject(new Error('Failed to read file as string'));
                  }
                },
                fail: reject
              });
            });

            const mimeType = getMimeType(filePath);
            const base64Data = `data:${mimeType};base64,${fileRes}`;

            return base64Data;
          } catch (error) {
            console.error("图片转换失败:", error);
            Taro.showToast({
              title: "图片转换失败",
              icon: "none",
            });
            return null;
          }
        });

        const base64Images = await Promise.all(base64Promises);
        const validImages = base64Images.filter(img => img !== null);

        setCertificateImages(prev => [...prev, ...validImages]);
        setUploading(false);
      }
    } catch (error) {
      console.error("选择图片失败:", error);
      setUploading(false);
    }
  }

  const handleRemoveProductImage = (index: number) => {
    setRealImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveCertificateImage = (index: number) => {
    setCertificateImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (!orderId) {
      Taro.showToast({
        title: "订单号不能为空",
        icon: "none",
      });
      return;
    }

    if (realImages.length === 0 && certificateImages.length === 0) {
      Taro.showToast({
        title: "请至少上传一张实拍图",
        icon: "none",
      });
      return;
    }

    apiMerchant.user.updateOrderImages(orderId || "", realImages, certificateImages).then((res: any) => {
      if (res.code === 200) {
        onClose?.();
        Taro.showToast({
          title: "提交成功",
          icon: "success",
        });
        onConfirm?.();
      }
    }).catch((err: any) => {
      Taro.showToast({
        title: "提交失败" + err.message,
        icon: "none",
      });
    });
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
            <Text className={styles["form-title"]}>上传商品图片</Text>
            {orderId && (
              <Text className={styles["order-number"]}>订单号：{orderId}</Text>
            )}
          </View>
          <View className={styles["close-btn"]} onClick={onClose}>
            <Image src={closeIcon} mode="aspectFit" style={{ width: "20px", height: "20px" }} />
          </View>
        </View>

        {/* 产品信息 */}
        {/* {productImage && productName && (
          <View className={styles["product-info"]}>
            <Image className={styles["product-image"]} src={productImage} mode="aspectFill" onClick={() => {
              Taro.previewImage({
                current: productImage,
                urls: [productImage],
              });
            }} />
            <View className={styles["product-details"]}>
              <Text className={styles["product-name"]}>{productName}</Text>
            </View>
          </View>
        )} */}

        <ScrollView className={styles["form-content"]} scrollY>
          {/* 证书图上传 */}
          <View className={styles["images-section"]}>
            <View className={styles["section-header"]}>
              <Text className={styles["section-title"]}>证书图</Text>
              <Text className={styles["required"]}>*</Text>
            </View>
            <Text className={styles["section-subtitle"]}>请上传商品证书图，最多2张</Text>
            <View className={styles["images-container"]}>
              <View className={styles["images-grid"]}>
                {certificateImages.length < 2 && (
                  <View
                    className={`${styles["add-image-btn"]} ${uploading ? styles["uploading"] : ''}`}
                    onClick={handleChooseCertificateImage}
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
                {certificateImages.map((image, index) => (
                  <View key={index} className={styles["image-item"]}>
                    <Image
                      src={image}
                      className={styles["uploaded-image"]}
                      mode="aspectFill"
                      onClick={() => {
                        Taro.previewImage({
                          current: image,
                          urls: [image],
                        });
                      }}
                    />
                    <View
                      className={styles["remove-image-btn"]}
                      onClick={() => handleRemoveCertificateImage(index)}
                    >
                      <Text className={styles["remove-icon"]}>×</Text>
                    </View>
                  </View>
                ))}
              </View>
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
                {realImages.length < 9 && (
                  <View
                    className={`${styles["add-image-btn"]} ${uploading ? styles["uploading"] : ''}`}
                    onClick={handleChooseProductImage}
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
                {realImages.map((image, index) => (
                  <View key={index} className={styles["image-item"]}>
                    <Image
                      src={image}
                      className={styles["uploaded-image"]}
                      mode="aspectFill"
                      onClick={() => {
                        Taro.previewImage({
                          current: image,
                          urls: [image],
                        });
                      }}
                    />
                    <View
                      className={styles["remove-image-btn"]}
                      onClick={() => handleRemoveProductImage(index)}
                    >
                      <Text className={styles["remove-icon"]}>×</Text>
                    </View>
                  </View>
                ))}

              </View>
            </View>
          </View>
        </ScrollView>

        {/* 底部按钮 */}
        <View className={styles["form-footer"]}>
          <CrystalButton
            text="取消"
            onClick={onClose || (() => { })}
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

export default ProductImageUpload;
