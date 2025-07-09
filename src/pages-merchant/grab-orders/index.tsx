import { useState, useEffect, useMemo } from "react";
import { View } from "@tarojs/components";
import Taro, { showToast, showModal } from "@tarojs/taro";
import api from "@/utils/api-merchant";
import { OrderStatus } from "@/utils/orderUtils";
import MerchantHeader from "@/components/MerchantHeader";
import OrderList from "@/components/OrderList";
import "./index.scss";
import TabBar from "@/components/TabBar";

interface DesignInfo {
  id: string;
  name: string;
  image_url: string;
}

interface Order {
  id: string;
  orderNo: string;
  status: OrderStatus;
  price: number;
  createTime: string;
  image: string;
  userPhone: string;
  description: string;
  designInfo?: DesignInfo;
  braceletInfo: any;
  userInfo?: {
    default_contact: number;
    phone?: string;
    wechat_id?: string;
    nick_name?: string;
    avatar_url?: string;
  };
}

export default function GrabOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);


  const loadOrders = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      api.user.getDispatch().then((res: any) => {
        const orderList = res.data.orders
          ?.map((item) => {
            return {
              id: item.order_uuid,
              orderNo: item.order_uuid,
              status: item.order_status,
              price: item.price,
              createTime: item.created_at,
              image: item.design_info?.image_url || "",
              userPhone: item.user_info?.phone || "暂无",
              description: item.design_info?.bracelet_name || "手串订单",
              braceletInfo: item.design_info || {},
              userInfo: item.user_info || {}
            };
          });
        setOrders(orderList);
      });
    } catch (error) {
      showToast({
        title: "加载失败",
        icon: "none",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleGrabOrder = async (order: Order) => {
      try {
        showToast({
          title: "抢单中...",
          icon: "loading",
        });

        // 模拟抢单API调用
        await api.user.grabOrder(order.id);

        showToast({
          title: "抢单成功！",
          icon: "success",
        });

        // 移除已抢的订单
        setOrders((prev) => prev.filter((item) => item.id !== order.id));

        // 跳转到订单管理页面
        Taro.switchTab({
          url: "/pages/order-management/index?tab=0",
        });
      } catch (error) {
        showToast({
          title: "抢单失败，请重试",
          icon: "none",
        });
      }
  };

  const handleOrderAction = (action: string, order: Order) => {
    if (action === "grab") {
      handleGrabOrder(order);
    } else if (action === "detail") {
      showModal({
        title: '订单详情',
        content: `订单号：${order.orderNo}\n金额：¥${order.price}\n时间：${order.createTime}\n用户：${order.description}`,
        showCancel: false
      })
    }
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedOrder(null);
  };

  const handleGrabFromModal = async () => {
    if (selectedOrder) {
      handleCloseModal();
      await handleGrabOrder(selectedOrder);
    }
  };

  return (
    <View className="grab-orders-container">
      <MerchantHeader />

      <OrderList
        orders={orders}
        loading={loading}
        onRefresh={loadOrders}
        onOrderAction={handleOrderAction}
        showActions={true}
        isGrab={true}
        emptyText="暂无订单"
        style={{
          height: "calc(100vh - 160px)",
        }}
      />

      <TabBar isMerchant={true} />
    </View>
  );
}
