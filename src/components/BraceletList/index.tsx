import React, { useState } from "react";
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

const BraceletList: React.FC<BraceletListProps> = ({ items, onItemClick }) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const uploadProductImage = async (productImageUrl: string, designId: string) => {
    const productImageBase64 = await imageToBase64(productImageUrl, true, false, 'png')
    apiSession.uploadProductImage({
      design_id: designId,
      image_base64: productImageBase64,
    }).then((res) => {
      console.log(res);
    });
  }

  return (
    <View className="bracelet-list">
      {items.map((item) => (
        <View
          key={item.id}
          className="bracelet-item"
          onClick={() => onItemClick?.(item)}
        >
          <View className="bracelet-image-container">
            {item.image || imageUrl ? <Image
              className="bracelet-image"
              src={item.image || imageUrl}
              mode="aspectFill"
              lazyLoad
              fadeIn={false}
            /> : <Image
              className="bracelet-image"
              src={DESIGN_PLACEHOLDER_IMAGE_URL}
              mode="aspectFill"
              lazyLoad
              fadeIn={false}
            />}
            {!item.image && item.draftUrl && item.backgroundUrl &&
              <ProductImageGenerator
                data={{
                  bgImage: item.backgroundUrl,
                  braceletImage: item.draftUrl,
                }}
                onGenerated={async (productImageUrl) => {
                  setImageUrl(productImageUrl);
                  await uploadProductImage(productImageUrl, item.id);
                }}
                showProductImage={false}
              />
            }
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
      ))}
    </View>
  );
};

export default BraceletList;
