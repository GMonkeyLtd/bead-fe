import React, { useEffect, useState } from "react";
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
import Taro from "@tarojs/taro";
import api, { userApi, userHistoryApi } from "@/utils/api";

const OrderDetail: React.FC = () => {
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const instance = Taro.getCurrentInstance();
    const params = instance.router?.params;
    const orderId = params?.orderId;
    api.userHistory.getOrderById(orderId || "").then((res) => {
      const _order = res?.data?.orders?.[0];
      setOrder(_order);
    });
  }, []);

  const orderStatus = order?.order_status;

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
        {order?.merchant_info && <MerchantCard
          name={order?.merchant_info?.name}
          status="已接单"
          address={order?.merchant_info?.address}
          rating={order?.merchant_info?.rating || 100}
          dealRate={order?.merchant_info?.transaction_rate}
          responseRate={order?.merchant_info?.response_rate}
          historyCount={order?.merchant_info?.transaction_rate?.length}
          historyImages={order?.merchant_info?.transaction_history?.images_url || []}
          onCall={console.log}
          onWechat={console.log}
          onRemind={console.log}
          onRemark={console.log}
          isCanceled={orderStatus === OrderStatusEnum.Cancelled}
          showRemark={orderStatus === OrderStatusEnum.Completed}
          showHistory={orderStatus !== OrderStatusEnum.Cancelled}
          showRemind={orderStatus === OrderStatusEnum.PendingAcceptance}
        />}
        {order?.design_info && (
        <BraceletInfo
          orderNumber={order?.order_uuid}
          productName={order?.design_info?.word_info?.bracelet_name}
          productNumber={order?.design_info?.design_id}
          quantity={order?.design_info?.beads_info?.length}
          price={order?.price}
          productImage={order?.design_info?.image_url}
          beads={order?.design_info?.beads_info || []}
          orderAction={
            processingOrderStatus.includes(orderStatus)
              ? {
                  text: "取消订单",
                  onClick: () => {
                    userHistoryApi.cancelOrder(order?.order_uuid).then(() => {
                      Taro.showToast({
                        title: "取消订单成功",
                        icon: "success",
                      });
                      Taro.navigateBack();
                    });
                  },
                }
              : undefined
          }
        />)}
      </View>

      {/* <View className="order-action-container">
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
          style={{ marginTop: "20px", marginLeft: "24px" }}
        />
        <CrystalButton
          onClick={console.log}
          isPrimary
          text={
            processingOrderStatus.includes(orderStatus)
              ? "更换商家"
              : "重新匹配商家"
          }
          style={{ flex: 1, marginTop: "20px", marginRight: "24px" }}
          prefixIcon={
            <Image
              src={createBeadImage}
              mode="widthFix"
              style={{ width: "24px", height: "24px" }}
            />
          }
        />
      </View> */}
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
