import React, { useEffect, useState } from "react";
import Taro, { useDidShow, usePullDownRefresh } from "@tarojs/taro";
import { View } from "@tarojs/components";
import { OrderStatus } from "@/utils/orderUtils";
import OrderListComp, { OrderItem } from "@/components/OrderListComp";
import api from "@/utils/api";
import { pageUrls } from "@/config/page-urls";
import PageContainer from "@/components/PageContainer";

const OrderListDemo: React.FC = () => {
  const [orders, setOrders] = useState<OrderItem[]>([]);

  const getOrderList = () => {
    // console.log('getOrderList', api.userHistory);
    api.userHistory.getOrderList().then((res) => {
      const _orders = (res?.data?.orders || []).filter(item => !!item.design_info).map(item => {
        return {
          id: item.order_uuid,
          orderNumber: item.order_uuid,
          status: item.order_status,
          merchantName: item.merchant_info?.name,
          productName: item.design_info?.name,
          orderImage: item.design_info?.image_url,
          budget: item.price || 0,
          createTime: item.created_at,
          afterSaleStatus: item.after_sale_status,
          communityInfo: item.community_info,
          tier: item.tier,
        }
      })
      setOrders(_orders);
    });
  }

  useDidShow(() => {
    getOrderList();
  });

  usePullDownRefresh(() => {
    getOrderList();
  });

  const handleEvaluate = (orderId: string) => {
    console.log("评价订单:", orderId);
    // 跳转到评价页面
  };

  const handleReorder = (orderId: string) => {
    console.log("再来一单:", orderId);
    // 重新下单逻辑
  };

  const handleItemClick = (order: OrderItem) => {
    Taro.navigateTo({
      url: `${pageUrls.orderDetail}?orderId=${order.id}`,
    });
  };

  return (
    <PageContainer
      className="crystal-common-container"
      headerExtraContent="订单列表"
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
          // onContactMerchant={handleContactMerchant}
          // onEvaluate={handleEvaluate}
          // onReorder={handleReorder}
          onItemClick={handleItemClick}
        />
      </View>
    </PageContainer>
  );
};

export default OrderListDemo;
