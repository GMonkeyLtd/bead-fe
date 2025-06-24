import React from "react";
import { View, Text, Image } from "@tarojs/components";
import "./index.scss";
import CrystalContainer from "@/components/CrystalContainer";
import BraceletInfo from "@/components/BraceletInfo";
import MerchantCard from "@/components/MerchantCard";
import connectIcon from "@/assets/icons/connect.svg";
import {
  formatOrderStatus,
  OrderStatus as OrderStatusEnum,
  processingOrderStatus,
} from "@/utils/orderUtils";
import CrystalButton from "@/components/CrystalButton";
import shareDesignImage from "@/assets/icons/share-design.svg";
import createBeadImage from "@/assets/icons/create-bead.svg";

const OrderDetail: React.FC = () => {
  const beadData = [
    { name: "水晶弹力线", size: "透明", quantity: 1 },
    { name: "粉水晶", size: "8mm", quantity: 12 },
    { name: "海蓝宝", size: "8mm", quantity: 6 },
    { name: "紫水晶", size: "8mm", quantity: 6 },
    { name: "紫水晶", size: "8mm", quantity: 6 },
    { name: "紫水晶", size: "8mm", quantity: 6 },
    { name: "紫水晶", size: "8mm", quantity: 6 },
    { name: "紫水晶", size: "8mm", quantity: 6 },
  ];

  const orderStatus = OrderStatusEnum.PendingDispatch;

  return (
    <CrystalContainer
      style={{
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <View className="order-title-container">
        <OrderStatus status={orderStatus} />
        {processingOrderStatus.includes(orderStatus) && (
          <View className="order-title" onClick={() => {}}>
            取消订单
          </View>
        )}
      </View>
      <MerchantCard
        name="东海县亿特珠宝有限公司"
        status="已接单"
        address="江苏省连云港市东海县牛山镇北城西路60号"
        rating={4.9}
        dealRate={88}
        responseRate={62}
        historyCount={20}
        historyImages={[
          "https://zhuluoji.cn-sh2.ufileos.com/images-frontend/bead-ring.png",
          "https://zhuluoji.cn-sh2.ufileos.com/images-frontend/bead-ring.png",
          "https://zhuluoji.cn-sh2.ufileos.com/images-frontend/bead-ring.png",
          "https://zhuluoji.cn-sh2.ufileos.com/images-frontend/bead-ring.png",
          "https://zhuluoji.cn-sh2.ufileos.com/images-frontend/bead-ring.png",
        ]}
        onCall={console.log}
        onWechat={console.log}
        onRemind={console.log}
      />
      <BraceletInfo
        orderNumber="ADX2333"
        productName="夏日睡莲"
        productNumber="NO.0001"
        quantity={24}
        price={299.0}
        productImage="https://zhuluoji.cn-sh2.ufileos.com/images-frontend/bead-ring.png"
        onMoreClick={() => {}}
        beads={beadData}
      />

      <View className="order-action-container">
        <CrystalButton
          onClick={console.log}
          text="分享"
          prefixIcon={
            <Image
              src={shareDesignImage}
              mode="widthFix"
              style={{ width: "24px", height: "24px" }}
            />
          }
        />
        <CrystalButton
          onClick={console.log}
          isPrimary
          text={
            processingOrderStatus.includes(orderStatus)
              ? "更换商家"
              : "重新匹配商家"
          }
          style={{ flex: 1 }}
          prefixIcon={
            <Image
              src={createBeadImage}
              mode="widthFix"
              style={{ width: "24px", height: "24px" }}
            />
          }
        />
      </View>
    </CrystalContainer>
  );
};

export default OrderDetail;

// 订单状态组件
const OrderStatus: React.FC<{ status: OrderStatusEnum }> = ({ status }) => {
  const formattedOrderStatus = formatOrderStatus(status);
  return (
    <View className="order-status">
      <Text className="order-status-title">{`订单${formattedOrderStatus}`}</Text>
      {processingOrderStatus.includes(status) && (
        <View className="order-status-content">
          <View className="chat-icon">
            <Image src={connectIcon} />
          </View>
          <Text className="status-text">稍后商家将主动与您联系</Text>
        </View>
      )}
    </View>
  );
};
