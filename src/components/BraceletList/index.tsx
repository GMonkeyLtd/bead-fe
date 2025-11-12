import React, { useState, useCallback, useMemo } from "react";
import { View, Image, Text } from "@tarojs/components";
import "./index.scss";
import RightArrowIcon from "@/assets/icons/right-arrow.svg";
import ProductImageGenerator from "../ProductImageGenerator";
import apiSession from "@/utils/api-session";
import { imageToBase64 } from "@/utils/imageUtils";
import { DESIGN_PLACEHOLDER_IMAGE_URL } from "@/config";


interface BraceletItem {
  id: string;
  name: string;
  number: string;
  image: string;
  draftUrl: string;
  backgroundUrl: string;
  rating?: number; // 评级分数，用于显示评级图标
}

interface BraceletListProps {
  items: BraceletItem[];
  onItemClick?: (item: BraceletItem) => void;
}

// 单个手链项组件，解决状态共享问题
const BraceletItem: React.FC<{
  item: BraceletItem;
  onItemClick?: (item: BraceletItem) => void;
}> = React.memo(({ item, onItemClick }) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  
  const uploadProductImage = useCallback(async (productImageUrl: string, designId: string) => {
    if (isUploading) return;
    
    try {
      setIsUploading(true);
      const productImageBase64 = await imageToBase64(productImageUrl, true, false);
      const res = await apiSession.uploadProductImage({
        design_id: designId,
        image_base64: productImageBase64,
      });
      console.log('上传成功:', res);
    } catch (error) {
      console.error('上传失败:', error);
    } finally {
      setIsUploading(false);
    }
  }, [isUploading]);
  
  const handleItemClick = useCallback((e) => {
    // 阻止事件冒泡，避免与滚动事件冲突
    e?.stopPropagation?.();
    
    if (!isUploading) {
      onItemClick?.(item);
    }
  }, [item, onItemClick, isUploading]);
  
  const handleImageGenerated = useCallback(async (productImageUrl: string) => {
    setImageUrl(productImageUrl);
    await uploadProductImage(productImageUrl, item.id);
  }, [item.id, uploadProductImage]);
  
  return (
    <View
      key={item.id}
      className="bracelet-item"
      onClick={handleItemClick}
    >
      <View className="bracelet-image-container">
        {item.image || imageUrl || item.draftUrl ? (
          <Image
            className="bracelet-image"
            src={item.image || imageUrl || item.draftUrl}
            mode="aspectFill"
            lazyLoad
            fadeIn={false}
          />
        ) : (
          <Image
            className="bracelet-image"
            src={DESIGN_PLACEHOLDER_IMAGE_URL}
            mode="aspectFill"
            lazyLoad
            fadeIn={false}
          />
        )}
        {!item.image && item.draftUrl && item.backgroundUrl && !imageUrl && (
          <ProductImageGenerator
            data={{
              bgImage: item.backgroundUrl,
              braceletImage: item.draftUrl,
            }}
            onGenerated={handleImageGenerated}
                showProductImage={false}
                autoDestroy={true}
          />
        )}
      </View>
      <View className="bracelet-info">
        <View className="bracelet-header">
          <View className="bracelet-name-container">
            <Text className="bracelet-name">{item.name}</Text>
          </View>
          <Image src={RightArrowIcon} style={{ width: 15, height: 10 }} />
        </View>
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
            width: "100%",
          }}
        >
          <Text className="bracelet-number">{`NO.${item.id}`}</Text>
        </View>
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数，确保只在必要时重新渲染
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.image === nextProps.item.image &&
    prevProps.item.name === nextProps.item.name &&
    prevProps.onItemClick === nextProps.onItemClick
  );
});

const BraceletList: React.FC<BraceletListProps> = ({ items, onItemClick }) => {
  // 稳定化 onItemClick 回调，避免不必要的重新渲染
  const stableOnItemClick = useCallback((item: BraceletItem) => {
    console.log('BraceletList onItemClick triggered:', item.id);
    onItemClick?.(item);
  }, [onItemClick]);

  // 使用 useMemo 优化渲染性能
  const renderedItems = useMemo(() => {
    return items.map((item) => (
      <BraceletItem
        key={item.id}
        item={item}
        onItemClick={stableOnItemClick}
      />
    ));
  }, [items, stableOnItemClick]);

  return (
    <View className="bracelet-list">
      {renderedItems}
    </View>
  );
};

export default BraceletList;
