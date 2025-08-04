import React, { useEffect, useState, useMemo } from "react";
import { View, Text, Image } from "@tarojs/components";
import "./index.scss";
import CrystalContainer from "@/components/CrystalContainer";
import BraceletInfo from "@/components/BraceletInfo";
import MerchantCard from "@/components/MerchantCard";
import ProductPriceCard from "@/components/ProductPriceCard";
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
import LogisticsCard, { AddressInfo } from "@/components/LogisticsCard";
import QrCodeDialog from "@/components/QrCodeDialog";
import CancelOrderDialog from "@/components/CancelOrderDialog";

const OrderDetail: React.FC = () => {
  const [order, setOrder] = useState<any>(null);
  const [tradePrice, setTradePrice] = useState<number>(0);
  const [address, setAddress] = useState<AddressInfo | undefined>(undefined);
  const [qrCodeVisible, setQrCodeVisible] = useState<boolean>(false);
  const [cancelDialogVisible, setCancelDialogVisible] = useState<boolean>(false);

  useEffect(() => {
    const instance = Taro.getCurrentInstance();
    const params = instance.router?.params;
    const orderId = params?.orderId;
    console.log(orderId, 'orderId')
    api.userHistory.getOrderById(orderId || "").then((res) => {
      const _order = res?.data?.orders?.[0];
      _order.order_status = OrderStatusEnum.OrderStatusInProgress;
      if (_order?.address) {
        const newAddress = {
          detailInfo: _order?.address?.detail_info,
          provinceName: _order?.address?.province_name,
          cityName: _order?.address?.city_name,
          countyName: _order?.address?.county_name,
          telNumber: _order?.address?.tel_number,
          userName: _order?.address?.user_name,
          nationalCode: _order?.address?.national_code,
          postalCode: _order?.address?.postal_code,
        }
        setAddress(newAddress);
      }
      setOrder(_order);
    });
  }, []);

  const orderStatus = OrderStatusEnum.OrderStatusPendingPayment; // order?.order_status;

  const showMerchantCard = useMemo(() => {
    return [OrderStatusEnum.OrderStatusInProgress, OrderStatusEnum.OrderStatusNegotiating].includes(orderStatus);
  }, [orderStatus]);

  const showLogistics = useMemo(() => {
    return [OrderStatusEnum.OrderStatusPendingPayment].includes(orderStatus);
  }, [orderStatus]);

  const handlOnPurchase = () => {
        
  };

      console.log(order, 'res')

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
        {showLogistics && <LogisticsCard address={address} onAdressChange={setAddress} />}
        {showMerchantCard ? <MerchantCard
          name={order?.merchant_info?.name}
          isSelf={order?.merchant_info?.is_self_operated}
          historyImages={order?.merchant_info?.transaction_history?.images_url || []}
        /> : <ProductPriceCard
          name={order?.merchant_info?.name}
          price={order?.price || 0}
          isSelf={order?.merchant_info?.is_self_operated}
          productImages={order?.product_photos?.images_url || order?.merchant_info?.transaction_history?.images_url || []}
          imageUploadTime={order?.product_photos?.upload_time}
          onShowQrCode={() => {
            setQrCodeVisible(true);
          }}
        />}
        {order?.design_info && (
          <BraceletInfo
            orderNumber={order?.order_uuid}
            productName={order?.design_info?.word_info?.bracelet_name}
            productNumber={order?.design_info?.design_id}
            quantity={order?.design_info?.beads_info?.length}
            price={order?.price || 0}
            productImage={order?.design_info?.image_url}
            beads={order?.design_info?.beads_info || []}
            orderAction={
              processingOrderStatus.includes(orderStatus)
                ? {
                  text: "取消订单",
                  onClick: () => {
                    setCancelDialogVisible(true);
                  },
                }
                : undefined
            }
          />)}
      </View>

      {OrderStatusEnum.OrderStatusPendingPayment === orderStatus && (
        <View className="order-action-container">
          <CrystalButton onClick={console.log} text={`确认支付 ¥${order?.price}元`} style={{ margin: "20px 24px", width: "100%" }} isPrimary />
        </View>
      )}
      {[OrderStatusEnum.OrderStatusInProgress, OrderStatusEnum.OrderStatusNegotiating].includes(orderStatus) && (
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
        </View>
      )}
      
      <QrCodeDialog
        visible={qrCodeVisible}
        qrCodeUrl={order?.merchant_info?.qr_code || ""}
        // merchantName={order?.merchant_info?.name || ""}
        onClose={() => setQrCodeVisible(false)}
      />
      
      <CancelOrderDialog
        visible={cancelDialogVisible}
        onClose={() => setCancelDialogVisible(false)}
        onConfirm={(reason: string) => {
          userHistoryApi.cancelOrder(order?.order_uuid).then(() => {
            Taro.showToast({
              title: "取消订单成功",
              icon: "success",
            });
            setCancelDialogVisible(false);
            Taro.navigateBack();
          }).catch((error) => {
            Taro.showToast({
              title: "取消订单失败",
              icon: "none",
            });
          });
        }}
      />
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
            status === OrderStatusEnum.OrderStatusCancelled
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
