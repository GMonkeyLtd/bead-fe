import React, { useCallback, useEffect, useState } from "react";
import { View, Text, Input, Image, ScrollView } from "@tarojs/components";
import Taro from "@tarojs/taro";
import styles from "./index.module.scss";
import CrystalButton from "../CrystalButton";
import closeIcon from "@/assets/icons/close.svg";
import rightArrowGolden from "@/assets/icons/right-arrow-golden.svg";
import apiMerchant from "@/utils/api-merchant";
import { BeadItem } from "@/utils/api-session";
import { usePageQuery } from "@/hooks/usePageQuery";
import { beadsApi } from "@/utils/api";
import { SPU_TYPE } from "@/pages-design/custom-design";
import CrystalBeadList, { CrystalBeadListItem } from "../CrystalBeadList";


interface ProductPriceFormProps {
  visible: boolean;
  orderNumber?: string;
  productName?: string;
  productImage?: string;
  wristSize?: string;
  onClose?: () => void;
  onConfirm?: () => void;
  beadsInfo?: BeadItem[];
  referencePrice?: number;
}

export interface BeadItemWithCount extends BeadItem {
  count: number;
}

const ProductPriceForm: React.FC<ProductPriceFormProps> = ({
  visible,
  orderNumber,
  productName,
  productImage,
  beadsInfo,
  wristSize,
  referencePrice,
  onClose,
  onConfirm,
}) => {
  const [price, setPrice] = useState<string>(referencePrice?.toString() || "");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [beadsData, setBeadsData] = useState<BeadItemWithCount[]>(() => {
    if (beadsInfo) {
      // 按sku_id进行聚合统计
      const groupedBeads = {}
      beadsInfo.forEach((item) => {
        const skuId = item.sku_id;
        if (groupedBeads[skuId]) {
          groupedBeads[skuId].count += 1;
        } else {
          groupedBeads[skuId] = {
            ...item,
            count: 1,
          };
        }
      });
      return Object.values(groupedBeads) as BeadItemWithCount[];
    }
    return [];
  });
  const [spuList, setSpuList] = useState<CrystalBeadListItem[]>([]);
  const [wristSizeValue, setWristSizeValue] = useState<string>(wristSize || "");
  if (!visible) {
    return null;
  }

  // 使用无限滚动hook获取sku列表
  const {
    data: skuList,
    loading: skuLoading,
    error: skuError,
    hasMore: skuHasMore,
    refresh: refreshSkuList,
    loadMore: loadMoreSku,
  } = usePageQuery<BeadItem>({
    listKey: "skuList",
    initialPage: 1,
    pageSize: 100,
    fetchData: useCallback(async (page: number, pageSize: number) => {
      const res = await beadsApi.getSkuList({ page, size: pageSize }, { showLoading: false });
      const resData: BeadItem[] = (res.data as any)?.items || [];
      const totalCount = (res.data as any)?.total || 0;
      return {
        data: resData,
        hasMore: resData.length + (page - 1) * pageSize < totalCount,
        total: totalCount,
      };
    }, [beadsApi]),
    queryItem: useCallback(async (item: BeadItem) => {
      // 这里可以根据需要实现单个item的查询逻辑
      return item;
    }, []),
    enabled: true,
  });
  console.log(beadsData, 'beadsData')

  useEffect(() => {
    Taro.showLoading({
      title: '加载中...',
    })
    if (skuHasMore) {
      loadMoreSku()
    } else if (skuList?.length > 0 && !skuHasMore) {

      const beads = skuList?.filter((item) => item.spu_type === SPU_TYPE.BEAD);
      const accessories = skuList?.filter((item) => item.spu_type === SPU_TYPE.ACCESSORY);

      // 对beads按spu_id分组
      const beadsGrouped = beads?.reduce((acc, item) => {
        const spuId = item.spu_id;
        if (!acc[spuId]) {
          acc[spuId] = [];
        }
        acc[spuId].push(item);
        return acc;
      }, {} as Record<number, BeadItem[]>);

      // 对accessories按spu_id分组
      const accessoriesGrouped = accessories?.reduce((acc, item) => {
        const spuId = item.spu_id;
        if (!acc[spuId]) {
          acc[spuId] = [];
        }
        acc[spuId].push(item);
        return acc;
      }, {} as Record<number, BeadItem[]>);

      // 转换为数组格式，每个元素为一个对象，key为spu_id，value为BeadItem[]
      const groupedBeadsData: CrystalBeadListItem[] = beadsGrouped ? Object.entries(beadsGrouped).map(([spuId, items]) => ({
        spuId: Number(spuId),
        items: items as BeadItem[],
        name: (items as BeadItem[])[0]?.name || '',
      })) : [];

      const groupedAccessoriesData: CrystalBeadListItem[] = accessoriesGrouped ? Object.entries(accessoriesGrouped).map(([spuId, items]) => ({
        spuId: Number(spuId),
        items: items as BeadItem[],
        name: (items as BeadItem[])[0]?.name || '',
      })) : [];

      // 更新状态
      setSpuList([...groupedBeadsData, ...groupedAccessoriesData])
      Taro.hideLoading()
    }
  }, [skuList, skuHasMore]);


  // 处理水晶珠列表变化
  const handleBeadListChange = (newData: BeadItemWithCount[]) => {
    setBeadsData(newData);
  };

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

        // 将图片转换为base64格式
        const base64Promises = res.tempFilePaths.map(async (filePath) => {
          try {
            // 压缩图片
            const compressedRes = await Taro.compressImage({
              src: filePath,
              quality: 70, // 压缩质量，取值范围0-100
            });
            const compressedFilePath = compressedRes.tempFilePath;

            // 读取压缩后的文件并转换为base64
            const fileRes = await new Promise<string>((resolve, reject) => {
              Taro.getFileSystemManager().readFile({
                filePath: compressedFilePath,
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

        setImages(prev => [...prev, ...validImages]);
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

    const skuIds: number[] = [];
    beadsData.forEach(item => {
      for (let i = 0; i < item.count; i++) {
        skuIds.push(Number(item.ID || item.sku_id));
      }
    })

    apiMerchant.user.submitPrice(orderNumber || "", parseFloat(price), images, skuIds, wristSizeValue).then((res: any) => {
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

  const handleWristSizeChange = (value: string) => {
    setWristSizeValue(value);
  };

  console.log(wristSize, price, 'wristSize')

  return (
    <View className={styles["product-price-form-overlay"]} onClick={handleOverlayClick}>
      <View className={styles["product-price-form"]} onClick={handleDialogClick}>
        {/* 头部 */}
        <View className={styles["form-header"]}>
          <View className={styles["header-content"]}>
            <Text className={styles["form-title"]}>提交商品支付信息</Text>
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
        )}

        <ScrollView className={styles["form-content"]} scrollY>
          <View className={styles["beads-section"]}>
            <View className={styles["section-header"]}>
              <Text className={styles["section-title"]}>水晶明细</Text>
              <Text className={styles["required"]}>*</Text>
            </View>
            {/* 水晶珠明细列表 */}
            {beadsData.length && spuList.length > 0 && (
              <View className={styles["beads-section"]}>
                <CrystalBeadList
                  data={beadsData}
                  spuList={spuList}
                  onChange={handleBeadListChange}
                />
              </View>
            )}
          </View>

          {/* 参考价 */}
          <View className={styles["price-section"]}>
            <View className={styles["section-header"]}>
              <Text className={styles["section-title"]}>成本价</Text>
            </View>
            <View className={styles["cost-price-container"]}>
              <Text className={styles["currency-symbol"]}>¥</Text>
              {beadsData.length > 0 && (beadsData.reduce((acc, item) => acc + (item.cost_price * item.count), 0) / 100).toFixed(2)}

            </View>
          </View>

          {/* 价格输入 */}
          <View className={styles["price-section"]}>
            <View className={styles["section-header"]}>
              <Text className={styles["section-title"]}>商品定价</Text>
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
                defaultValue={price}
              />
            </View>
          </View>

          {/* 价格输入 */}
          <View className={styles["price-section"]}>
            <View className={styles["section-header"]}>
              <Text className={styles["section-title"]}>手围</Text>
              <Text className={styles["required"]}>*</Text>
            </View>
            <View className={styles["price-input-container"]}>
              <Input
                className={styles["price-input"]}
                type="digit"
                placeholder="请输入手围"
                value={wristSizeValue}
                defaultValue={wristSize}
                onInput={(e) => handleWristSizeChange(e.detail.value)}
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
                {images.map((image, index) => (
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
                      onClick={() => handleRemoveImage(index)}
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

export default ProductPriceForm;
