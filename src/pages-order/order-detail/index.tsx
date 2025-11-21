import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
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
  getOrderStatusDescription,
  getOrderStatusTip,
  showReferencePrice,
  getStatusBadgeType,
  AfterSaleStatus,
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
import JoinGroupQrcode from "@/components/JoinGroupChat/JoinGroupQrcode";
import { useOrderPolling } from "@/hooks/useOrderPolling";
import { SERVICE_QRCODE_IMAGE_URL } from "@/config";
import { pageUrls } from "@/config/page-urls";

enum PaymentStatus {
  Processing = 0,
  Success = 1,
  Failed = 2,
  Canceled = 3,
}

const OrderDetail: React.FC = () => {
  // const [order, setOrder] = useState<any>(null);
  const [address, setAddress] = useState<AddressInfo | undefined>(undefined);
  const [qrCodeVisible, setQrCodeVisible] = useState<boolean>(false);
  const [cancelDialogVisible, setCancelDialogVisible] =
    useState<boolean>(false);
  const [addressLoading, setAddressLoading] = useState<boolean>(false);
  const plugin = requirePlugin("logisticsPlugin");
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showJoinGroupQrcode, setShowJoinGroupQrcode] =
    useState<boolean>(false);
  const instance = Taro.getCurrentInstance();
  const { orderId } = instance.router?.params || {};
  const { from } = instance.router?.params || {};

  const {
    orderInfo: order,
    startPolling: startOrderPolling,
    stopPolling: stopOrderPolling,
    isPolling: isOrderPolling,
  } = useOrderPolling({
    orderId: orderId,
    interval: 3000, // 5秒轮询间隔
    autoRedirect: false, // 禁用自动跳转
    shouldStopPolling: (status, _order) => {
      return [
        OrderStatusEnum.Completed,
        OrderStatusEnum.Cancelled,
        OrderStatusEnum.MerchantCancelled,
      ].includes(status) || (status === OrderStatusEnum.AfterSale && [AfterSaleStatus.Refunded].includes(_order?.after_sale_status));
    },
    onStatusChange: (newStatus) => {
      // 可以在这里添加状态变化时的额外逻辑
    },
  });

  const getOrderDetail = () => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
    }
    startOrderPolling();
  };

  useEffect(() => {
    if (order?.address) {
      const newAddress = {
        detailInfo: order?.address?.detail_info,
        provinceName: order?.address?.province_name,
        cityName: order?.address?.city_name,
        countyName: order?.address?.county_name,
        telNumber: order?.address?.tel_number,
        userName: order?.address?.user_name,
        nationalCode: order?.address?.national_code,
        postalCode: order?.address?.postal_code,
      };
      setAddress(newAddress);
    }
  }, [order?.address]);

  useEffect(() => {
    getOrderDetail();
    return () => {
      stopOrderPolling();
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
  }, []);

  const orderStatus = order?.order_status;

  const showMerchantCard = useMemo(() => {
    return [
      OrderStatusEnum.InProgress,
      OrderStatusEnum.Negotiating,
      OrderStatusEnum.Cancelled,
      OrderStatusEnum.MerchantCancelled,
    ].includes(orderStatus);
  }, [orderStatus]);

  const showLogistics = useMemo(() => {
    return [
      OrderStatusEnum.PendingPayment,
      OrderStatusEnum.PendingShipment,
      OrderStatusEnum.Shipped,
      OrderStatusEnum.Received,
      OrderStatusEnum.Completed,
    ].includes(orderStatus);
  }, [orderStatus]);

  const isSptRefund = useMemo(() => {
    return [OrderStatusEnum.PendingShipment].includes(orderStatus);
  }, [orderStatus]);

  const showBuyTip = useMemo(() => {
    return [
      OrderStatusEnum.InProgress,
      OrderStatusEnum.Negotiating,
      OrderStatusEnum.PendingPayment,
      OrderStatusEnum.PendingShipment,
    ].includes(orderStatus);
  }, [orderStatus]);

  const showJoinGroupChat = useMemo(() => {
    if (orderStatus === OrderStatusEnum.AfterSale) {
      return [AfterSaleStatus.Refunding, AfterSaleStatus.Refunded].includes(
        order?.after_sale_status
      );
    }
    return [OrderStatusEnum.Received, OrderStatusEnum.Completed].includes(
      orderStatus
    );
  }, [orderStatus]);

  const isSptCancel = useMemo(() => {
    return [
      OrderStatusEnum.InProgress,
      OrderStatusEnum.Negotiating,
      OrderStatusEnum.PendingPayment,
    ].includes(orderStatus);
  }, [orderStatus]);

  const shouldStopPolling = (status: PaymentStatus) => {
    return status !== PaymentStatus.Processing;
  };

  const queryPaymentStatus = async (): Promise<boolean> => {
    try {
      const res = await payApi.queryPayStatus({ orderId: order?.order_uuid });

      // 根据实际 API 返回结构调整数据获取方式，使用类型断言
      const status = res?.data?.trade_status as PaymentStatus;

      // 检查是否应该停止轮询
      if (status !== undefined && shouldStopPolling(status)) {
        console.log("订单状态已变更，停止轮询");
        if (status === PaymentStatus.Success) {
          getOrderDetail();
        }
        if (status === PaymentStatus.Failed) {
          Taro.showToast({
            title: "支付失败",
            icon: "none",
          });
        }
        if (status === PaymentStatus.Canceled) {
          Taro.showToast({
            title: "支付已取消",
            icon: "none",
          });
        }
        return false; // 表示轮询应该停止
      }

      return true; // 表示轮询应该继续
    } catch (error) {
      console.error("查询订单失败:", error);
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
      return true; // 出错时继续轮询
    }
  };

  const startPollingPaymentStatus = () => {
    console.log("开始轮询支付状态");
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
    }

    // 先立即查询一次
    // queryPaymentStatus();

    // 设置定时器，每指定间隔查询一次
    pollingTimerRef.current = setInterval(async () => {
      const shouldContinue = await queryPaymentStatus();
      if (!shouldContinue) {
        Taro.showToast({
          title: "支付成功",
          icon: "success",
        });
        getOrderDetail();
        clearInterval(pollingTimerRef.current as NodeJS.Timeout);
      }
    }, 3000);
  };

  const onCancelOrRefund = useCallback(
    (type: "cancel" | "refund", reason: string) => {
      if (type === "cancel") {
        userHistoryApi
          .cancelOrder(order?.order_uuid, reason)
          .then(() => {
            Taro.showToast({
              title: "取消订单成功",
              icon: "success",
            });
            setCancelDialogVisible(false);
            getOrderDetail();
          })
          .catch((error) => {
            console.error("取消订单失败:", error);
            Taro.showToast({
              title: "取消订单失败",
              icon: "none",
            });
          });
      } else {
        payApi
          .applyRefund({ orderId: order?.order_uuid, reason })
          .then(() => {
            setCancelDialogVisible(false);
            getOrderDetail();
          })
          .catch((error) => {
            console.error("退款申请提交失败:", error);
            Taro.showToast({
              title: "退款申请提交失败",
              icon: "none",
            });
          });
      }
    },
    [order?.order_uuid]
  );

  const onWithDrawRefund = () => {
    payApi
      .withdrawRefund({ orderId: order?.order_uuid })
      .then(() => {
        Taro.showToast({
          title: "撤销申请成功",
          icon: "success",
        });
        getOrderDetail();
      })
      .catch((error) => {
        console.error("撤销申请失败:", error);
      });
  };

  const onViewLogistics = () => {
    payApi.getWaybillToken({ order_id: order?.order_uuid }).then((res) => {
      const waybill_token = res?.data?.waybill_token;
      console.log(waybill_token, plugin?.openWaybillTracking, "waybill_token");
      plugin?.openWaybillTracking({
        waybillToken: waybill_token,
      });
    });
  };

  const onConfirmOrder = () => {
    payApi
      .confirmOrder({ order_id: order?.order_uuid })
      .then((res) => {
        const { transaction_id, merchant_id, merchant_trade_no } = res?.data;
        if (wx?.openBusinessView) {
          wx?.openBusinessView({
            businessType: "weappOrderConfirm",
            extraData: {
              merchant_id,
              merchant_trade_no,
              transaction_id,
            },
            success(res) {
              if (res.extraData.status === 'success') {
                payApi
                  .confirmOrderCallback({ orderId: order?.order_uuid })
                  .then(() => {
                    getOrderDetail();
                  });
              }
            },
            fail() {
              console.log("fail");
            },
            complete() {
              getOrderDetail();
            },
          });
        } else {
          //引导用户升级微信版本
        }
      })
      .catch((e) => {
        console.log(e, e.message, "e");
        Taro.showToast({
          title: e?.message || "确认收货失败",
          icon: "none",
        });
      });
  };

  const getProductActionsByStatus = () => {
    if ([OrderStatusEnum.PendingPayment].includes(orderStatus)) {
      return null;
    }
    if (
      [OrderStatusEnum.Shipped, OrderStatusEnum.Received].includes(orderStatus)
    ) {
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
        },
      };
    }
    if (
      orderStatus === OrderStatusEnum.AfterSale &&
      order?.after_sale_status === AfterSaleStatus.RefundReviewing
    ) {
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
      };
    }
    return null;
  };

  const handleAddressChange = (
    _address: AddressInfo,
    callback?: () => void
  ) => {
    setAddressLoading(true);
    payApi
      .addAddressToOrder({
        order_uuid: order?.order_uuid,
        detail_info: _address?.detailInfo,
        province_name: _address?.provinceName,
        city_name: _address?.cityName,
        county_name: _address?.countyName,
        tel_number: _address?.telNumber,
        user_name: _address?.userName,
        national_code: _address?.nationalCode,
        postal_code: _address?.postalCode,
      })
      .then(() => {
        setAddress(_address);
        callback?.();
      })
      .catch((e) => {
        Taro.showToast({
          title: e?.message || "添加地址失败",
          icon: "none",
        });
        console.error("error", e);
      })
      .finally(() => {
        setAddressLoading(false);
      });
  };

  const purchase = () => {
    payApi
      .purchase({ orderId: order?.order_uuid, amount: order?.price })
      .then((res) => {
        const wxPayParams = res?.data;
        startPollingPaymentStatus();
        Taro.requestPayment({
          timeStamp: wxPayParams.timestamp, // 秒级时间戳
          nonceStr: wxPayParams.nonce_str,
          package: wxPayParams.package, // 服务端返回
          signType: wxPayParams.sign_type,
          paySign: wxPayParams.pay_sign,
          success: () => {
            Taro.showToast({
              title: "支付成功",
              icon: "success",
              duration: 2000,
            });
          },
          fail: (err) => console.error("支付失败", err),
        });
      });
  };

  const handleOnPurchase = () => {
    if (addressLoading) {
      return;
    }
    if (!address) {
      Taro.showToast({
        title: "请先添加收货地址",
        icon: "none",
        duration: 1000,
      });
      Taro.chooseAddress({
        success: (result) => {
          handleAddressChange(result, purchase);
        },
      });
      return;
    }
    purchase();
  };

  const getProductImages = () => {
    if (
      order?.actual_images?.length > 0 ||
      order?.certificate_images?.length > 0
    ) {
      return [
        ...(order?.actual_images || []),
        ...(order?.certificate_images || []),
      ];
    }
    return order?.merchant_info?.transaction_history?.images_url || [];
  };

  return (
    <CrystalContainer
      style={{
        display: "flex",
        flexDirection: "column",
      }}
      disablePaddingBottom
      onBack={() => {
        if (Taro.getCurrentPages().length === 1) {
          if (from === 'result') {
            Taro.redirectTo({
              url: pageUrls.result + `?designBackendId=${order?.design_info?.design_id}`,
            });
          } else {
            Taro.redirectTo({
              url: pageUrls.orderList,
            });
          }
        } else {
          Taro.navigateBack();
        }
      }}
    >
      <View style={{ padding: "24px 24px 0 24px" }}>
        <OrderStatus
          status={orderStatus}
          afterSaleStatus={order?.after_sale_status}
          isSame={order?.community_info}
        />
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
        {showLogistics && (
          <LogisticsCard
            address={address}
            onAddressChange={handleAddressChange}
            enableChangeAddress={orderStatus === OrderStatusEnum.PendingPayment || orderStatus === OrderStatusEnum.PendingShipment}
            logisticsStatus={
              orderStatus === OrderStatusEnum.Shipped
                ? order?.waybill_status
                : undefined
            }
            onViewLogistics={onViewLogistics}
          />
        )}
        {showMerchantCard ? (
          <MerchantCard
            isCanceled={
              orderStatus === OrderStatusEnum.Cancelled ||
              orderStatus === OrderStatusEnum.MerchantCancelled
            }
            name={order?.merchant_info?.name}
            isSelf={order?.merchant_info?.is_self_operated}
            historyImages={
              order?.merchant_info?.transaction_history?.images_url || []
            }
          />
        ) : (
          <ProductPriceCard
            name={order?.merchant_info?.name}
            showPrice
            price={order?.price || 0}
            isSelf={order?.merchant_info?.is_self_operated}
            showImages={
              !(
                orderStatus === OrderStatusEnum.AfterSale &&
                [AfterSaleStatus.Refunding, AfterSaleStatus.Refunded].includes(
                  order?.after_sale_status
                )
              )
            }
            productImages={getProductImages()}
            imageUploadTime={order?.upload_time}
            onShowQrCode={() => {
              setQrCodeVisible(true);
            }}
            isAfterSale={orderStatus === OrderStatusEnum.AfterSale}
            showBuyNotice={showBuyTip}
            actions={getProductActionsByStatus()}
          />
        )}
        {showJoinGroupChat && <JoinGroupChat />}
        {order?.design_info && (
          <BraceletInfo
            orderNumber={order?.order_uuid}
            productName={order?.design_info?.name}
            productNumber={order?.design_info?.design_id}
            quantity={order?.design_info?.items?.length}
            price={order?.price || 0}
            showPrice={showReferencePrice(orderStatus) && order?.tier != 0}
            productImage={order?.design_info?.image_url}
            beads={order?.design_info?.items || []}
            isSameBuy={order?.community_info}
            priceTier={order?.tier}
            orderAction={
              isSptCancel
                ? {
                  text: "取消订单",
                  onClick: () => {
                    setCancelDialogVisible(true);
                  },
                }
                : isSptRefund
                  ? {
                    text: "申请退款",
                    onClick: () => {
                      setCancelDialogVisible(true);
                    },
                  }
                  : undefined
            }
          />
        )}
      </View>

      {OrderStatusEnum.PendingPayment === orderStatus && (
        <View className="order-action-container">
          <CrystalButton
            onClick={handleOnPurchase}
            text={`确认支付 ¥${order?.price}`}
            style={{ margin: "20px 24px", width: "100%" }}
            isPrimary
          />
        </View>
      )}
      {[OrderStatusEnum.InProgress, OrderStatusEnum.Negotiating].includes(
        orderStatus
      ) && (
          <View className="order-action-container">
            <CrystalButton
              onClick={() => setShowJoinGroupQrcode(true)}
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
              onClick={() => setQrCodeVisible(true)}
              isPrimary
              text="联系商家"
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
        type={isSptRefund ? "refund" : "cancel"}
        onConfirm={onCancelOrRefund}
      />

      <JoinGroupQrcode
        groupInfo={{
          name: "璞光集官方服务号",
          qrCodeUrl: SERVICE_QRCODE_IMAGE_URL
        }}
        showQRCode={showJoinGroupQrcode}
        onClose={() => setShowJoinGroupQrcode(false)}
      />
    </CrystalContainer>
  );
};

export default OrderDetail;

// 订单状态组件
export const OrderStatus: React.FC<{
  status: OrderStatusEnum;
  afterSaleStatus: AfterSaleStatus;
  isSame: boolean;
}> = ({ status, afterSaleStatus, isSame }) => {
  const orderStatusTip = getOrderStatusTip(status, afterSaleStatus);
  const orderStatusDescription = getOrderStatusDescription(status, afterSaleStatus);
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
          {isSame ? orderStatusDescription.replace('定制', '发货'): orderStatusDescription}
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
