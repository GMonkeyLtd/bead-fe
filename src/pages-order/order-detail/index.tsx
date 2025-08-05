import React, { useEffect, useState, useMemo } from "react";
import { View, Text, Image } from "@tarojs/components";
import "./index.scss";
import CrystalContainer from "@/components/CrystalContainer";
import BraceletInfo from "@/components/BraceletInfo";
import MerchantCard from "@/components/MerchantCard";
import ProductPriceCard, { ProductAction } from "@/components/ProductPriceCard";
import connectIcon from "@/assets/icons/connect.svg";
import {
  formatOrderStatus,
  OrderStatus as OrderStatusEnum,
  processingOrderStatus,
  OrderStatusMap,
  getOrderStatusDescription,
  getOrderStatusTip,
  showReferencePrice,
  getStatusBadgeType,
  AfterSaleStatus
} from "@/utils/orderUtils";
import CrystalButton from "@/components/CrystalButton";
import shareDesignImage from "@/assets/icons/share-design.svg";
import createBeadImage from "@/assets/icons/create-bead.svg";
import StatusBadge, { StatusBadgeType } from "@/components/StatusBadge";
import Taro, { requirePlugin } from "@tarojs/taro";
import api, { userApi, userHistoryApi } from "@/utils/api";
import LogisticsCard, { AddressInfo } from "@/components/LogisticsCard";
import QrCodeDialog from "@/components/QrCodeDialog";
import CancelOrderDialog from "@/components/CancelOrderDialog";
import payApi from "@/utils/api-pay";
import JoinGroupChat from "@/components/JoinGroupChat";

const OrderDetail: React.FC = () => {
  const [order, setOrder] = useState<any>(null);
  const [tradePrice, setTradePrice] = useState<number>(0);
  const [address, setAddress] = useState<AddressInfo | undefined>(undefined);
  const [qrCodeVisible, setQrCodeVisible] = useState<boolean>(false);
  const [cancelDialogVisible, setCancelDialogVisible] = useState<boolean>(false);
  const plugin = requirePlugin('logisticsPlugin');

  const getOrderDetail = () => {
    const instance = Taro.getCurrentInstance();
    const params = instance.router?.params;
    const orderId = params?.orderId;
    console.log(orderId, 'orderId')
    api.userHistory.getOrderById(orderId || "").then((res) => {
      const _order = res?.data?.orders?.[0];
      _order.order_status = OrderStatusEnum.AfterSale;
      _order.after_sale_status = AfterSaleStatus.Refunded;
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
  }

  useEffect(() => {
    getOrderDetail();
  }, []);

  const orderStatus = order?.order_status;

  const showMerchantCard = useMemo(() => {
    return [OrderStatusEnum.InProgress, OrderStatusEnum.Negotiating, OrderStatusEnum.Cancelled, OrderStatusEnum.MerchantCancelled].includes(orderStatus);
  }, [orderStatus]);

  const showLogistics = useMemo(() => {
    return [OrderStatusEnum.PendingPayment, OrderStatusEnum.PendingShipment, OrderStatusEnum.Shipped, OrderStatusEnum.Received, OrderStatusEnum.Completed].includes(orderStatus);
  }, [orderStatus]);

  const isSptRefund = useMemo(() => {
    return [OrderStatusEnum.PendingShipment].includes(orderStatus);
  }, [orderStatus]);

  const showBuyTip = useMemo(() => {
    return [OrderStatusEnum.InProgress, OrderStatusEnum.Negotiating, OrderStatusEnum.PendingPayment, OrderStatusEnum.PendingShipment].includes(orderStatus);
  }, [orderStatus]);

  const showJoinGroupChat = useMemo(() => {
    if (orderStatus === OrderStatusEnum.AfterSale) {
      return [AfterSaleStatus.Refunding, AfterSaleStatus.Refunded].includes(order?.after_sale_status);
    }
    return [OrderStatusEnum.Completed].includes(orderStatus);
  }, [orderStatus]);

  const isSptCancel = useMemo(() => {
    return [
      OrderStatusEnum.InProgress,
      OrderStatusEnum.Negotiating,
      OrderStatusEnum.PendingPayment,
    ].includes(orderStatus);
  }, [orderStatus]);

  const handlOnPurchase = () => {

  };

  const onWithDrawRefund = () => {

  };
  
  const onViewLogistics = () => {
    payApi.getWaybillToken({ order_id: order?.order_uuid }).then((res) => {
      const waybill_token = res?.data?.waybill_token;
      plugin?.openWaybillTracking({
        waybillToken: waybill_token,
      })
    })
  }

  const onConfirmOrder = () => {
    payApi.confirmOrder({ order_id: order?.order_uuid }).then((res) => {
      const { transaction_id, merchant_id, merchant_trade_no } = res?.data;
      if (wx.miniapp?.openBusinessView) {
        wx.miniapp.openBusinessView({
          businessType: 'weappOrderConfirm',
          extraData: {
            merchant_id,
            merchant_trade_no,
            transaction_id
          },
          success() {
            getOrderDetail();
          },
          fail() {
            getOrderDetail();
          },
          complete() {
            getOrderDetail();
          }
        });
      } else {
        //引导用户升级微信版本
      }
    })
  }

  const getProductActionsByStatus = () => {
    if ([OrderStatusEnum.PendingPayment].includes(orderStatus)) {
      return null;
    }
    if ([OrderStatusEnum.Shipped, OrderStatusEnum.Received].includes(orderStatus)) {
      return {
        [ProductAction.ContactMerchant]: {
          text: "联系商家",
          onClick: () => {
            setQrCodeVisible(true);
          },
        },
        [ProductAction.CheckLogistics]: {
          text: "查看物流",
          onClick: onViewLogistics,
        },
        [ProductAction.ConfirmOrder]: {
          text: "确认收货",
          onClick: onConfirmOrder,
        }
      }
    };
    if (orderStatus === OrderStatusEnum.AfterSale && order?.after_sale_status === AfterSaleStatus.RefundReviewing) {
      return {
        [ProductAction.ContactMerchant]: {
          text: "联系商家",
          onClick: () => {
            setQrCodeVisible(true);
          },
        },
        [ProductAction.WithDrawRefund]: {
          text: "撤销申请",
          onClick: onWithDrawRefund,
        },
      }
    }
    return null;
  }

  return (
    <CrystalContainer
      style={{
        display: "flex",
        flexDirection: "column",
      }}
      disablePaddingBottom
    >
      <View style={{ padding: "24px 24px 0 24px" }}>
        <OrderStatus status={orderStatus} afterSaleStatus={order?.after_sale_status} />
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
        {showLogistics && <LogisticsCard address={address} onAdressChange={setAddress} enableChangeAddress={orderStatus === OrderStatusEnum.PendingPayment} logisticsStatus={order?.waybill_status} onViewLogistics={onViewLogistics} />}
        {showMerchantCard ? <MerchantCard
          isCanceled={orderStatus === OrderStatusEnum.Cancelled || orderStatus === OrderStatusEnum.MerchantCancelled}
          name={order?.merchant_info?.name}
          isSelf={order?.merchant_info?.is_self_operated}
          historyImages={order?.merchant_info?.transaction_history?.images_url || []}
        /> : <ProductPriceCard
          name={order?.merchant_info?.name}
          price={order?.price || 0}
          isSelf={order?.merchant_info?.is_self_operated}
          showImages={!(orderStatus === OrderStatusEnum.AfterSale && [AfterSaleStatus.Refunding, AfterSaleStatus.Refunded].includes(order?.after_sale_status))}
          productImages={order?.product_photos?.images_url || order?.merchant_info?.transaction_history?.images_url || []}
          imageUploadTime={order?.product_photos?.upload_time}
          onShowQrCode={() => {
            setQrCodeVisible(true);
          }}
          isAfterSale={orderStatus === OrderStatusEnum.AfterSale}
          showBuyNotice={showBuyTip}
          actions={getProductActionsByStatus()}
        />}
        {showJoinGroupChat && (
          <JoinGroupChat />
        )}
        {order?.design_info && (
          <BraceletInfo
            orderNumber={order?.order_uuid}
            productName={order?.design_info?.word_info?.bracelet_name}
            productNumber={order?.design_info?.design_id}
            quantity={order?.design_info?.beads_info?.length}
            price={order?.price || 0}
            showPrice={showReferencePrice(orderStatus)}
            productImage={order?.design_info?.image_url}
            beads={order?.design_info?.beads_info || []}
            orderAction={
              isSptCancel
                ? {
                  text: "取消订单",
                  onClick: () => {
                    setCancelDialogVisible(true);
                  },
                }
                : isSptRefund ? {
                  text: "申请退款",
                  onClick: () => {
                    setCancelDialogVisible(true);
                  },
                } : undefined
            }
          />)}
      </View>

      {OrderStatusEnum.PendingPayment === orderStatus && (
        <View className="order-action-container">
          <CrystalButton onClick={console.log} text={`确认支付 ¥${order?.price}`} style={{ margin: "20px 24px", width: "100%" }} isPrimary />
        </View>
      )}
      {[OrderStatusEnum.InProgress, OrderStatusEnum.Negotiating].includes(orderStatus) && (
        <View className="order-action-container">
          <CrystalButton
            onClick={console.log}
            text="社群"
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
        type={isSptRefund ? 'refund' : 'cancel'}
        onConfirm={(reason: string) => {
          if (isSptCancel) {
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
          } else if (isSptRefund) {
            // userHistoryApi.refundOrder(order?.order_uuid).then(() => {
            //   Taro.showToast({
            //     title: "退款成功",
            //     icon: "success",
            //   });
            // });
          }
        }}
      />
    </CrystalContainer>
  );
};

export default OrderDetail;

// 订单状态组件
const OrderStatus: React.FC<{ status: OrderStatusEnum, afterSaleStatus: AfterSaleStatus }> = ({ status, afterSaleStatus }) => {
  const orderStatusTip = getOrderStatusTip(status, afterSaleStatus);
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
          {getOrderStatusDescription(status, afterSaleStatus)}
        </Text>
        <StatusBadge
          type={getStatusBadgeType(status)}
          text={formatOrderStatus(status, afterSaleStatus)}
        />
      </View>
      {orderStatusTip && (
        <View className="order-status-content">
          <View className="chat-icon">
            <Image src={connectIcon} />
          </View>
          <Text className="status-text">{orderStatusTip}</Text>
        </View>
      )}
    </View>
  );
};
