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
  OrderStatusMap,
} from "@/utils/orderUtils";
import CrystalButton from "@/components/CrystalButton";
import shareDesignImage from "@/assets/icons/share-design.svg";
import createBeadImage from "@/assets/icons/create-bead.svg";
import StatusBadge, { StatusBadgeType } from "@/components/StatusBadge";

const OrderDetail: React.FC = () => {
  const beadData = [
    { name: "水晶弹力线", size: "透明", quantity: 1 },
    { name: "粉水晶", size: "8mm", quantity: 12 },
    { name: "海蓝宝", size: "8mm", quantity: 6 },
    { name: "海蓝宝", size: "8mm", quantity: 6 },
    { name: "海蓝宝", size: "8mm", quantity: 6 },
    { name: "海蓝宝", size: "8mm", quantity: 6 },
    { name: "紫水晶", size: "8mm", quantity: 6 },
    { name: "紫水晶", size: "8mm", quantity: 6 },
    { name: "紫水晶", size: "8mm", quantity: 6 },
    { name: "紫水晶", size: "8mm", quantity: 6 },
    { name: "紫水晶", size: "8mm", quantity: 6 },
  ];

  const orderStatus = OrderStatusEnum.InService;

  return (
    <CrystalContainer
      style={{
        display: "flex",
        flexDirection: "column",
      }}
      disablePaddingBottom
    >
      <View style={{ padding: "24px 24px 0 24px" }}>
        <OrderStatus status={orderStatus} />
      </View>
      <View
        className="order-detail-container"
        style={{
          height: processingOrderStatus.includes(orderStatus)
            ? `calc(100% - 120px - 70px)`
            : `calc(100% - 120px - 20px)`,
          overflowY: "auto",
        }}
      >
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
          onRemark={console.log}
          isCanceled={orderStatus === OrderStatusEnum.Cancelled}
          showRemark={orderStatus === OrderStatusEnum.Completed}
          showHistory={orderStatus !== OrderStatusEnum.Cancelled}
          showRemind={orderStatus === OrderStatusEnum.PendingAcceptance}
        />
        <BraceletInfo
          orderNumber="ADX2333"
          productName="夏日睡莲"
          productNumber="NO.0001"
          quantity={24}
          price={299.0}
          productImage="https://zhuluoji.cn-sh2.ufileos.com/images-frontend/bead-ring.png"
          beads={beadData}
          orderAction={processingOrderStatus.includes(orderStatus) ? {
            text: "取消订单",
            onClick: () => {
              console.log("取消订单");
            },
          } : undefined}
        />
      </View>

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
          style={{ marginTop: '20px', marginLeft: '24px'}}
        />
        <CrystalButton
          onClick={console.log}
          isPrimary
          text={
            processingOrderStatus.includes(orderStatus)
              ? "更换商家"
              : "重新匹配商家"
          }
          style={{ flex: 1, marginTop: '20px', marginRight: '24px'}}
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
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <Text className="order-status-title">
          {`订单${formattedOrderStatus}`}
        </Text>
        <StatusBadge
          type={
            status === OrderStatusEnum.Cancelled
              ? StatusBadgeType.Error
              : StatusBadgeType.Processing
          }
          text={OrderStatusMap[status]}
        />
      </View>
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
