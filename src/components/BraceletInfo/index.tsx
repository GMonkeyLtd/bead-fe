import React from "react";
import { View, Text, Image } from "@tarojs/components";
import copyIcon from "@/assets/icons/copy.svg";
import "./index.scss";
import Taro from "@tarojs/taro";

interface BraceletCardProps {
  orderNumber: string;
  productName: string;
  productNumber: string;
  quantity: number;
  price: number;
  productImage: string;
  showPrice?: boolean;
  onMoreClick?: () => void;
  className?: string;
  orderAction?: {
    text: string;
    onClick: () => void;
  };
}

const BraceletOrderInfo: React.FC<BraceletCardProps> = ({
  orderNumber,
  productName,
  productNumber,
  quantity,
  price,
  productImage,
  className = "",
  orderAction,
  showPrice = false,
  isSameBuy = false,
  priceTier = 0
}) => {

  const handleCopyImageUrl = (orderNumber: string) => {
    Taro.setClipboardData({
      data: orderNumber,
      success: () => {
        Taro.showToast({
          title: '复制成功',
          icon: 'none',
        })
      }
    })
  }
  return (
    <View className={`bracelet-info ${className}`}>
      {/* 订单编号和复制 */}
      <View className="order-info-container">
        <View className="order-info">
          <Text className="order-number">订单号：{orderNumber}</Text>
          <Image
            src={copyIcon}
            style={{ width: "16px", height: "16px" }}
            onClick={() => handleCopyImageUrl(orderNumber)}
          />
        </View>
        {orderAction?.text && (
          <View className="order-action" onClick={orderAction.onClick}>
            {orderAction.text}
          </View>
        )}
      </View>

      {/* 分割线 */}
      <View className="divider" />

      {/* 商品信息 */}
      <View className="product-info">
        <View className="product-main">
          {/* 商品图片 */}
          <Image
            className="product-image"
            src={productImage}
            mode="aspectFill"
          />

          {/* 商品详情 */}
          <View className="product-details">
            <View className="product-title-section">
              <Text className="product-name">{productName}</Text>
              <Text className="product-number">{productNumber}</Text>
            </View>
            <Text className="product-quantity">数量：{quantity}颗</Text>
          </View>
        </View>

        {/* 价格 */}
        {showPrice &&
          <View className="price-section">
            <View className="price-label">
              {!isSameBuy && (<View className="price-label-text">价格：</View>)}
              {/* <Text className={`price ${priceTier == 0 ? 'price-tier-0' : ''}`}>{priceTier == 0 ? '暂无' : `¥${price.toFixed(2)}`}</Text> */}
              <Text className={`price ${priceTier == 0 ? 'price-tier-0' : ''}`}>{`¥${price.toFixed(2)}`}</Text>
            </View>
          </View>}
      </View>
    </View>
  );
};

interface BeadItem {
  name: string;
  size: string;
  quantity: number;
}

interface BeadDetailListProps {
  beads: BeadItem[];
  className?: string;
}

export const BeadDetailList: React.FC<BeadDetailListProps> = ({
  beads,
  className = "",
}) => {

  const beadsData = (beads || [])?.reduce((acc: any[], item: any) => {
    const existingBead = acc.find(bead => bead.name === item?.name && bead.size === item?.diameter);
    if (existingBead) {
      existingBead.quantity += item?.quantity || 1;
    } else {
      acc.push({
        name: item?.name,
        size: item?.diameter,
        quantity: item?.quantity || 1,
      });
    }
    return acc;
  }, []);

  return (
    <View className={`bead-detail-list ${className}`}>
      {/* 表头 */}
      <View className="table-header">
        <Text className="header-name">名称</Text>
        <Text className="header-size">尺寸/规格</Text>
        <Text className="header-quantity">数量</Text>
      </View>

      {/* 珠子列表 */}
      <View className="table-body">
        {beadsData.map((bead, index) => (
          <View
            key={index}
            className="table-row"
            style={{ background: index % 2 === 0 ? "" : "#E6DED133" }}
          >
            <Text className="cell-name">{bead.name}</Text>
            <Text className="cell-size">{`${bead.size}mm`}</Text>
            <Text className="cell-quantity">x{bead.quantity}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export interface BraceletInfoProps extends BraceletCardProps {
  beads?: BeadItem[];
  showPrice?: boolean;
  style?: React.CSSProperties;
  isSameBuy?: boolean;
  priceTier: number;
}
const BraceletInfo: React.FC<BraceletInfoProps> = ({
  orderNumber,
  productName,
  productNumber,
  quantity,
  price,
  productImage,
  showPrice = false,
  style = {},
  beads,
  orderAction,
  isSameBuy = false,
  priceTier = 0
}) => {

  return (
    <View
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        ...style,
      }}
    >
      <BraceletOrderInfo
        orderNumber={orderNumber}
        productName={productName}
        productNumber={productNumber}
        quantity={quantity}
        price={price}
        productImage={productImage}
        orderAction={orderAction}
        showPrice={showPrice}
        isSameBuy={isSameBuy}
      />

      {beads && beads?.length > 0 && <BeadDetailList beads={beads} />}
    </View>
  );
};

export default BraceletInfo;
