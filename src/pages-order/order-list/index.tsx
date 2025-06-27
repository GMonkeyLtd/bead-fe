import React, { useEffect, useState } from "react";
import Taro from "@tarojs/taro";
import { View } from "@tarojs/components";
import { OrderStatus } from "@/utils/orderUtils";
import OrderListComp, { OrderItem } from "@/components/OrderListComp";
import api from "@/utils/api";
import { pageUrls } from "@/config/page-urls";

const OrderListDemo: React.FC = () => {
  const [orders, setOrders] = useState<OrderItem[]>([]);

  useEffect(() => {
    api.userHistory.getOrderList().then((res) => {
      const _orders = (res?.data?.orders || []).filter(item => !!item.design_info?.design_id).map(item => {
        return {
          id: item.order_uuid,
          orderNumber: item.order_uuid,
          status: item.order_status,
          merchantName: item.merchant_info?.name,
          orderImage: item.design_info?.image_url,
          budget: item.price || 0,
          createTime: item.created_at,
        }
      })
      console.log('orders', _orders);
      setOrders(_orders);
    });
  }, []);

  const handleContactMerchant = () => {
    Taro.makePhoneCall({ phoneNumber: "13800138000" });
    // 可以打开联系商家弹窗或跳转到聊天页面
  };

  const handleEvaluate = (orderId: string) => {
    console.log("评价订单:", orderId);
    // 跳转到评价页面
  };

  const handleReorder = (orderId: string) => {
    console.log("再来一单:", orderId);
    // 重新下单逻辑
  };

  const handleItemClick = (order: OrderItem) => {
    if ([OrderStatus.Dispatching, OrderStatus.PendingAcceptance, OrderStatus.PendingDispatch].includes(order.status)) {
      Taro.navigateTo({
        url: `${pageUrls.orderDispatching}?orderId=${order.id}`,
      });
    } else {
      Taro.navigateTo({
        url: `${pageUrls.orderDetail}?orderId=${order.id}`,
      });
    }
    // 跳转到订单详情页
  };

  return (
    <View
      className="crystal-common-container"
      style={{
        background: "#F4F1EE",
        height: "100%",
      }}
    >
      <View
        style={{
          flex: 1,
          overflowY: "auto",
          height: "100%",
          marginBottom: "20px",
          padding: "20px",
        }}
      >
        <OrderListComp
          orders={orders}
          onContactMerchant={handleContactMerchant}
          // onEvaluate={handleEvaluate}
          // onReorder={handleReorder}
          onItemClick={handleItemClick}
        />
      </View>
    </View>
  );
};

export default OrderListDemo;
