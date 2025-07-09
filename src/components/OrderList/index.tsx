import { useState, useEffect } from "react";
import { View, Text, Button, Image, ScrollView } from "@tarojs/components";
import Taro, { showToast, showModal } from "@tarojs/taro";
import styles from "./index.module.scss";
import StatusBadge from "../StatusBadge";
import {
  formatOrderStatus,
  getStatusBadgeType,
  OrderStatus,
} from "@/utils/orderUtils";
import BeadOrderDialog from "@/components/BeadOrderDialog";
import ContactUserDialog from "@/components/ContactUserDialog";
import phoneIcon from "@/assets/icons/phone.svg";
import api from "@/utils/api-merchant";
import { pageUrls } from "@/config/page-urls";

export interface Order {
  id: string;
  orderNo: string;
  status: OrderStatus;
  price: number;
  createTime: string;
  image: string;
  userPhone: string;
  description: string;
  braceletInfo: any;
  userInfo?: {
    default_contact: number; // 0: 电话, 1: 微信
    phone?: string;
    wechat_id?: string;
    nick_name?: string;
    avatar_url?: string;
  };
  beadsData?: any[];
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
  style
}: OrderListProps) {
  const [detailData, setDetailData] = useState<Order | null>(null);
  const [contactDialogVisible, setContactDialogVisible] = useState(false);
  const [currentUserInfo, setCurrentUserInfo] = useState<
    Order["userInfo"] | null
  >(null);

  const handleClose = () => {
    setDetailData(null);
  };

  const handleCallUser = (order: Order) => {
    if (order.userInfo) {
      setCurrentUserInfo(order.userInfo);
      setContactDialogVisible(true);
    }
  };

  const handleCloseContactDialog = () => {
    setContactDialogVisible(false);
    setCurrentUserInfo(null);
  };



  const handleAddWechat = (order: Order) => {
    showModal({
      title: "添加微信",
      content: `请添加用户微信：${order.description}`,
      showCancel: false,
    });
  };

  const handleCancelOrder = (order: Order) => {
    // 跳转到取消订单页面，传递订单信息
    Taro.navigateTo({
      url: `${pageUrls.cancelOrder}?orderId=${order.id}&orderNo=${order.orderNo}&price=${order.price}`
    });
  };

  const handleCompleteOrder = async (order: Order) => {
    const res = await showModal({
      title: "确认完成",
      content: `确定完成订单 ${order.orderNo} 吗？`,
      confirmText: "确认完成",
      cancelText: "取消",
    });

    if (res.confirm) {
      api.user.completeOrder(order.id).then((res: any) => {
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

  const handleGrabOrder = async (order: Order) => {
    const res = await showModal({
      title: "确认抢单",
      content: `确定要抢订单 ${order.orderNo} 吗？`,
      confirmText: "确认抢单",
      cancelText: "取消",
    });

    if (res.confirm && onOrderAction) {
      onOrderAction("grab", order);
    }
  };

  const handleOrderDetail = (order: Order) => {
    const beadsData = order?.braceletInfo?.beads_info?.reduce(
      (acc: any[], item: any) => {
        const existingBead = acc.find((bead) => bead.name === item?.name);
        if (existingBead) {
          existingBead.quantity += item?.quantity || 1;
        } else {
          acc.push({
            name: item?.name,
            size: item?.size,
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

  const renderActionButtons = (order: Order) => {
    if (!showActions) return null;

    if (isGrab) {
      return (
        <View className={styles.grabBtn} onClick={() => handleGrabOrder(order)}>
          立即抢单
        </View>
      );
    }

    if (order.status === OrderStatus.InService) {
      return (
        <View className={styles.orderActions}>
          <View className={styles.actionButtons}>
            <View className={styles.callBtn} onClick={() => handleCallUser(order)}>
              <Image src={phoneIcon} className={styles.phoneIcon} />
              联系用户
            </View>
            <View
              className={styles.orderCancelBtn}
              onClick={() => handleCancelOrder(order)}
            >
              取消订单
            </View>
          </View>
          <View
            className={styles.completeBtn}
            onClick={() => handleCompleteOrder(order)}
          >
            完成订单
          </View>
        </View>
      );
    }
  };

  return (
    <ScrollView
      className={`${styles.orderListContainer} ${className}`}
      scrollY
      refresherEnabled={!!onRefresh}
      refresherTriggered={loading}
      onRefresherRefresh={onRefresh}
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
          <View key={order.id} className={styles.orderCard}>
            <View className={styles.orderHeader}>
              <View className={styles.orderStatus}>
                <StatusBadge
                  type={getStatusBadgeType(order.status)}
                  text={formatOrderStatus(order.status)}
                />
                <Text className={styles.orderNo}>订单号：{order.orderNo}</Text>
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
                  src={order.image}
                  mode="aspectFill"
                  lazyLoad
                  showMenuByLongpress={false}
                />
                <View className={styles.orderDetails}>
                  <Text className={styles.orderDesc}>
                    {order.userInfo?.nick_name || "微信用户"}
                  </Text>
                  <Text className={styles.orderTime}>{order.createTime}</Text>
                </View>
              </View>
              <Text className={styles.orderPrice}>¥{order.price.toFixed(2)}</Text>
            </View>

            {showActions &&
              isGrab &&
              order.status === OrderStatus.InService && (
                <View className={styles.orderDivider}></View>
              )}

            {renderActionButtons(order)}
            {detailData && (
              <BeadOrderDialog
                visible
                orderNumber={detailData.orderNo}
                productName={
                  detailData.braceletInfo?.word_info?.bracelet_name || ""
                }
                productCode={detailData.braceletInfo?.design_id || ""}
                totalQuantity={
                  detailData.braceletInfo?.word_info?.bracelet_name || ""
                }
                budget={detailData.price.toString()}
                productImage={detailData.braceletInfo?.image_url || ""}
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


          </View>
        ))
      )}
    </ScrollView>
  );
}
