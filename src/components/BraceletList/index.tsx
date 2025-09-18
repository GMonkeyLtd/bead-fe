import React, { useState, useCallback, useMemo } from "react";
import { View, Image, Text, ScrollView } from "@tarojs/components";
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
      const productImageBase64 = await imageToBase64(productImageUrl, true, false, 'png');
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
  
  const handleItemClick = useCallback(() => {
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
        {item.image || imageUrl ? (
          <Image
            className="bracelet-image"
            src={item.image || imageUrl}
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
});

const BraceletList: React.FC<BraceletListProps> = ({ items, onItemClick }) => {
  // 使用 useMemo 优化渲染性能
  const renderedItems = useMemo(() => {
    return items.map((item) => (
      <BraceletItem
        key={item.id}
        item={item}
        onItemClick={onItemClick}
      />
    ));
  }, [items, onItemClick]);

  return (
    <View className="bracelet-list">
      {renderedItems}
    </View>
  );
};

export default BraceletList;
