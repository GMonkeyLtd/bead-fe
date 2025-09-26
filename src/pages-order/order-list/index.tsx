import React, { useEffect, useState, useCallback } from "react";
import Taro, { useDidShow, usePullDownRefresh } from "@tarojs/taro";
import { View } from "@tarojs/components";
import { OrderStatus } from "@/utils/orderUtils";
import OrderListComp, { OrderItem } from "@/components/OrderListComp";
import api from "@/utils/api";
import { pageUrls } from "@/config/page-urls";
import PageContainer from "@/components/PageContainer";
import { usePageQuery } from "@/hooks/usePageQuery";
import LoadingIcon from "@/components/LoadingIcon";

const OrderListDemo: React.FC = () => {

   // 使用无限滚动hook获取sku列表
   const {
    loading: orderLoading,
    data: orders,
    hasMore: orderHasMore,
    refresh: refreshOrders,
    loadMore: loadMoreOrders,
  } = usePageQuery<any>({
    listKey: "orderList",
    initialPage: 1,
    pageSize: 40,
    fetchData: useCallback(async (page: number, pageSize: number) => {
      const res = await api.userHistory.getOrderList({ page, size_size: pageSize }, { showLoading: false });
      console.log(res, 'res');
      const resData = ((res as any)?.data?.orders || []).map(item => {
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
      }})
      const totalCount = (res as any)?.data?.page_info?.total || 0;
      return {
        data: resData,
        hasMore: resData.length + (page - 1) * pageSize < totalCount,
        total: totalCount,
      };
    }, []),
    queryItem: useCallback(async (item: any) => {
      // 这里可以根据需要实现单个item的查询逻辑
      return item;
    }, []),
    enabled: true,
  });

  console.log(orderHasMore, 'orderHasMore');

  useEffect(() => {
    if (orderHasMore) {
      loadMoreOrders();
    }
  }, [orderHasMore, orders]);

  useDidShow(() => {
    refreshOrders();
  });

  usePullDownRefresh(() => {
    refreshOrders();
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
        {orderHasMore &&  orders.length > 0 && 
          <View style={{ marginTop: "8px", fontSize: "12px", color: "gray", textAlign: "center" }}>
            加载中...
          </View>
        }
        {orderLoading && orders.length === 0 && 
        <View style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px", width: "100%" }}>
          <LoadingIcon />
        </View>}
      </View>
    </PageContainer>
  );
};

export default OrderListDemo;
