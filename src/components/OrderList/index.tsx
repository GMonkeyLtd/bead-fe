import { useState, useEffect } from "react";
import { View, Text, Button, Image, ScrollView } from "@tarojs/components";
import Taro, { showToast, showModal, requirePlugin } from "@tarojs/taro";
import styles from "./index.module.scss";
import StatusBadge from "../StatusBadge";
import {
  formatOrderStatus,
  getStatusBadgeType,
  OrderStatus,
  AfterSaleStatus,
} from "@/utils/orderUtils";
import BeadOrderDialog from "@/components/BeadOrderDialog";
import ContactUserDialog from "@/components/ContactUserDialog";
import phoneIcon from "@/assets/icons/phone.svg";
import merchantApi from "@/utils/api-merchant";
import { pageUrls } from "@/config/page-urls";
import copyIcon from "@/assets/icons/copy.svg";
import ProductPriceForm from "../ProductPriceForm";
import ProductImageUpload from "../ProductImageUpload";
import WayBillForm from "../WayBillForm";

export interface Order {
  order_uuid: string;
  order_status: OrderStatus;
  price: number;
  create_time: string;
  design_info: any;
  remark: string;
  created_at: string;
  updated_at: string;
  user_info?: {
    default_contact: number; // 0: 电话, 1: 微信
    phone?: string;
    wechat_id?: string;
    nick_name?: string;
    avatar_url?: string;
  };
  after_sale_info?: {
    after_sale_status: string;
    after_sale_status_text: string;
    pre_sales_status: string;
  }
  beadsData?: any[];
  order_details?: any;
}

export interface OrderListProps {
  orders: Order[];
  loading?: boolean;
  onRefresh?: () => void;
  onOrderAction?: (action: string, order: Order) => void;
  showActions?: boolean;
  emptyText?: string;
  className?: string;
  style?: React.CSSProperties;
  isGrab?: boolean;
}

export default function OrderList({
  orders,
  loading = false,
  onRefresh,
  onOrderAction,
  showActions = true,
  emptyText = "暂无订单",
  className = "",
  isGrab = false,
  style,
}: OrderListProps) {
  const [detailData, setDetailData] = useState<Order | null>(null);
  const [contactDialogVisible, setContactDialogVisible] = useState(false);
  const [currentUserInfo, setCurrentUserInfo] = useState<
    Order["user_info"] | null
  >(null);
  const [orderActionDialog, setOrderActionDialog] = useState<any>(null);
  const logisticsPlugin = requirePlugin("logisticsPlugin");
  const handleClose = () => {
    setDetailData(null);
  };

  const handleCloseContactDialog = () => {
    setContactDialogVisible(false);
    setCurrentUserInfo(null);
  };

  const handleCancelOrder = (order: Order) => {
    // 跳转到取消订单页面，传递订单信息
    merchantApi.user.cancelOrder(order.order_uuid).then((res: any) => {
      if (res.code === 200) {
        showToast({
          title: "取消订单成功",
          icon: "success",
        });
        onRefresh?.();
      }
    }).catch((err: any) => {
      showToast({
        title: err.message || "取消订单失败",
        icon: "error",
      });
    })
  };

  const handleCompleteOrder = async (order: Order) => {
    const res = await showModal({
      title: "确认完成",
      content: `确定完成订单 ${order.order_uuid} 吗？`,
      confirmText: "确认完成",
      cancelText: "取消",
    });

    if (res.confirm) {
      merchantApi.user.completeOrder(order.order_uuid).then((res: any) => {
        if (res.code === 200) {
          showToast({
            title: "完成订单成功",
            icon: "success",
          });
          onRefresh?.();
        }
      });
    }
  };

  const handleOrderDetail = (order: Order) => {
    const beadsData = order?.design_info?.beads_info?.reduce(
      (acc: any[], item: any) => {
        const existingBead = acc.find((bead) => bead.name === item?.name);
        if (existingBead) {
          existingBead.quantity += item?.quantity || 1;
        } else {
          acc.push({
            name: item?.name,
            size: item?.bead_diameter + "mm",
            quantity: item?.quantity || 1,
          });
        }
        return acc;
      },
      []
    );
    setDetailData({
      ...order,
      // @ts-ignore
      beadsData,
    });
  };

  const handleCopyOrderNumber = (orderNumber: string) => {
    Taro.setClipboardData({
      data: orderNumber,
    })
  }

  // 脱敏处理函数
  const maskContactInfo = (contact: string, type: 'phone' | 'wechat') => {
    if (!contact) return '';

    if (type === 'phone') {
      // 手机号脱敏：前3位 + **** + 后4位
      if (contact.length >= 7) {
        return `${contact.substring(0, 3)}****${contact.substring(contact.length - 4)}`;
      }
      return contact;
    } else {
      // 微信号脱敏：前3位 + **** + 后4位
      if (contact.length >= 7) {
        return `${contact.substring(0, 3)}****${contact.substring(contact.length - 4)}`;
      }
      return contact;
    }
  };

  const renderConnectInfo = (order: Order) => {
    let info = '', copyData = '';
    if (order.user_info?.default_contact === 0) {
      const phone = order.user_info?.phone || '';
      const maskedPhone = maskContactInfo(phone, 'phone');
      info = `电话：${maskedPhone}`;
      copyData = phone; // 复制时使用原始数据
    } else {
      const wechat = order.user_info?.wechat_id || '';
      const maskedWechat = maskContactInfo(wechat, 'wechat');
      info = `微信：${maskedWechat}`;
      copyData = wechat; // 复制时使用原始数据
    }
    return (
      <View className={styles.connectInfo} onClick={() => handleCopyOrderNumber(copyData)}>
        <Text>{info}</Text>
        <Image src={copyIcon} mode='aspectFit' className={styles.copyIcon} />
      </View>
    );
  };

  const onAgreeRefund = (order: Order) => {
    merchantApi.user.agreeRefund(order.order_uuid).then((res: any) => {
      if (res.code === 200) {
        showToast({
          title: "同意退款成功",
          icon: "success",
        });
        onRefresh?.();
      }
    }).catch((err: any) => {
      showToast({
        title: "同意退款失败" + err.message,
        icon: "none",
      });
    });
  }

  const viewChatDetail = (order: Order) => {
    const sessionId = order.design_info?.session_id;
    console.log('merchant sessionId', sessionId)
    if (!sessionId) {
      showToast({
        title: "该订单未查到沟通记录",
        icon: "error",
      });
      return;
    }
    Taro.navigateTo({
      url: `${pageUrls.chatDesign}?session_id=${sessionId}&is_merchant=true`,
    });
  }

  const renderActionButtons = (order: Order) => {
    if (!showActions) return null;

    // 2: 进行中、待支付
    if ([OrderStatus.Negotiating, OrderStatus.InProgress, OrderStatus.PendingPayment].includes(order.order_status)) {
      return (
        <View className={styles.orderActions}>
          <View className={styles.actionButtons}>
            <View
              className={styles.callBtn}
              onClick={() => viewChatDetail(order)}
            >
              沟通记录
            </View>
            <View
              className={styles.orderCancelBtn}
              onClick={() => handleCancelOrder(order)}
            >
              取消
            </View>
          </View>
          <View className={styles.actionButtons}>
            {[OrderStatus.Negotiating, OrderStatus.InProgress].includes(order.order_status) && (<View
              className={styles.completeBtn}
              onClick={() => {
                setOrderActionDialog(<ProductPriceForm
                  visible={true}
                  orderNumber={order.order_uuid}
                  productName={order.design_info?.word_info?.bracelet_name || ""}
                  productImage={order.design_info?.image_url || ""}
                  onClose={() => setOrderActionDialog(null)}
                  onConfirm={onRefresh}
                />);
              }}
            >
              发起支付
            </View>)}
          </View>
        </View>
      );
    }
    if ([OrderStatus.PendingShipment, OrderStatus.Shipped].includes(order.order_status)) {
      return (
        <View className={styles.orderActions}>
          <View className={styles.actionButtons}>
            <View
              className={styles.uploadImageBtn}
              onClick={() => {
                setOrderActionDialog(<ProductImageUpload
                  visible={true}
                  orderId={order.order_uuid}
                  productName={order.design_info?.word_info?.bracelet_name || ""}
                  productImage={order.design_info?.image_url || ""}
                  onClose={() => setOrderActionDialog(null)}
                  onConfirm={onRefresh}
                />)
              }}
            >
              上传图片
            </View>
            <View
              className={styles.callBtn}
              onClick={() => viewChatDetail(order)}
            >
              沟通记录
            </View>
          </View>
          <View className={styles.actionButtons}>
            {order?.order_details?.address_info && <View className={styles.callBtn} onClick={() => {
              const addressInfo = order?.order_details?.address_info;
              const addressInfoStr = `${addressInfo.userName}\n${addressInfo.telNumber}\n${addressInfo.provinceName}${addressInfo.cityName}${addressInfo.countyName}\n${addressInfo.detailInfo}`;
              Taro.showModal({
                title: "收货地址",
                content: addressInfoStr,
                success: (res) => {
                  if (res.confirm) {
                    Taro.setClipboardData({
                      data: addressInfoStr,
                    });
                  }
                }
              });
            }}>
              收货地址
            </View>}
            {([OrderStatus.PendingShipment].includes(order.order_status)) && (<View
              className={styles.completeBtn}
              onClick={() => {
                setOrderActionDialog(<WayBillForm
                  visible={true}
                  orderId={order.order_uuid}
                  onClose={() => setOrderActionDialog(null)}
                  submitCallback={onRefresh}
                />);
              }}
            >
              填写物流
            </View>)}
          </View>
        </View>
      )
    }
    if ([OrderStatus.AfterSale].includes(order.order_status) && order.after_sale_info?.after_sale_status === "refund_reviewing") {
      return (
        <View className={styles.orderActions}>
          <View className={styles.actionButtons}>
            <View
              className={styles.callBtn}
              onClick={() => onAgreeRefund(order)}
            >
              同意退款
            </View>
            <View
              className={styles.orderCancelBtn}
              onClick={() => {
                Taro.showToast({
                  title: "请联系客户撤单",
                  icon: "none",
                });
              }}
            >
              联系客户撤单
            </View>
          </View>
        </View>
      )
    }

  };

  const showWayBillInfo = (order: Order) => {
    if (order.order_details?.logistics_info && order.order_details?.logistics_info?.logistics_no) {
      return true;
    }
    return false;
  }

  const onViewLogistics = (order: Order) => {
    merchantApi.user.getWayBillToken(order.order_uuid).then((res: any) => {
      const waybill_token = res.data.waybill_token;
      logisticsPlugin?.openWaybillTracking({
        waybillToken: waybill_token,
      });
    });
  }

  const onScrollToLower = () => {
    console.log('onScrollToLower');
  }

  return (
    <View style={{ height: "100%" }}>
      <ScrollView
        className={`${styles.orderListContainer} ${className}`}
        scrollY
        // refresherEnabled={!!onRefresh}
        // refresherTriggered={loading}
        // onRefresherRefresh={onRefresh}
        onScrollToLower={onScrollToLower}
        style={style}
      >
        {orders.length === 0 || loading ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyText}>
              {loading ? "加载中..." : emptyText}
            </Text>
          </View>
        ) : (
          orders.map((order) => (
            <View key={order.order_uuid} className={styles.orderCard}>
              {showWayBillInfo(order) && (
                <View className={styles.wayBillInfo} onClick={() => onViewLogistics(order)}>
                  <View className={styles.wayBillNo}>{`快递单号：${order.order_details?.logistics_info?.logistics_no} ->`}</View>
                  <View className={styles.wayBillStatus}>{order.order_details?.logistics_info?.waybill_status_text}</View>
                </View>
              )}
              <View className={styles.orderHeader}>
                <View className={styles.orderStatus}>
                  <StatusBadge
                    type={getStatusBadgeType(order.order_status)}
                    text={formatOrderStatus(order.order_status, order?.after_sale_info?.after_sale_status as AfterSaleStatus)}
                  />
                  <Text className={styles.orderNo}>
                    订单号：{order.order_uuid}
                  </Text>
                </View>
                <View
                  className={styles.detailBtn}
                  onClick={() => handleOrderDetail(order)}
                >
                  明细
                </View>
              </View>
              <View className={styles.orderContent}>
                <View className={styles.orderInfo}>
                  <Image
                    className={styles.orderImage}
                    src={order.design_info?.image_url}
                    mode="aspectFill"
                    lazyLoad
                    onClick={() => {
                      Taro.previewImage({
                        current: order.design_info?.image_url,
                        urls: [order.design_info?.image_url],
                      });
                    }}
                  />
                  <View className={styles.orderDetails}>
                    {renderConnectInfo(order)}
                    {/* {order.userInfo?.nick_name || "微信用户"} */}
                    <Text className={styles.orderTime}>{order.created_at}</Text>
                  </View>
                </View>
                <Text className={styles.orderPrice}>
                  ¥{order.price.toFixed(2)}
                </Text>
              </View>

              {renderActionButtons(order)}
            </View>
          ))
        )}
      </ScrollView>
      {/* 订单明细 */}
      {detailData && (
        <BeadOrderDialog
          visible
          orderNumber={detailData.order_uuid}
          productName={
            detailData.design_info?.word_info?.bracelet_name || ""
          }
          productCode={detailData.design_info?.design_id || ""}
          realImages={detailData.order_details?.actual_images || []}
          certificateImages={detailData.order_details?.certificate_images || []}
          budget={detailData.price.toString()}
          productImage={detailData.design_info?.image_url || ""}
          materials={(detailData.beadsData || []).map((item: any) => {
            return {
              name: item.name,
              spec: item.size,
              quantity: item.quantity,
            };
          })}
          onClose={handleClose}
          onConfirm={console.log}
        />
      )}
      {/* 联系用户弹窗 */}
      {contactDialogVisible && currentUserInfo && (
        <ContactUserDialog
          visible={contactDialogVisible}
          userInfo={currentUserInfo}
          onClose={handleCloseContactDialog}
        />
      )}
      {orderActionDialog}
    </View>
  );
}
