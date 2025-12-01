import React, { useEffect, useState, useCallback, useRef } from "react";
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
    pageSize: 20,
    fetchData: useCallback(async (page: number, pageSize: number) => {
      const res = await api.userHistory.getOrderList({ page, size_size: pageSize }, { showLoading: false });
      console.log(res, 'res');
      const resData = ((res as any)?.data?.orders || []).map(item => {
        return {
        id: item.order_uuid,
        orderNumber: item.order_uuid,
        status: item.order_status,
        orderType: item.order_type,
        merchantName: item.merchant_info?.name,
        productName: item.design_info?.name || item.product_info?.name,
        orderImage: item.design_info?.image_url || item.product_info?.image_urls[0],
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


  // useEffect(() => {
  //   if (orderHasMore) {
  //     loadMoreOrders();
  //   }
  // }, [orderHasMore, orders]);

  useDidShow(() => {
    refreshOrders();
  });

  usePullDownRefresh(() => {
    refreshOrders();
  });

  // 使用 IntersectionObserver 监听元素进入视口
  const observerRef = useRef<IntersectionObserver | null>(null);
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRefs = useRef<Set<NodeJS.Timeout>>(new Set());

  const setupScrollListener = useCallback(() => {
    // 清理现有的观察器和定时器
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }

    const targetId = "my-order-more-tag";

    // 优先使用 IntersectionObserver
    if (typeof IntersectionObserver !== "undefined") {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              if (orderHasMore) {
                loadMoreOrders();
              }
            }
          });
        },
        {
          root: null, // 相对于视口
          rootMargin: "100px", // 提前100px开始加载
          threshold: 0.1, // 10%的元素可见时触发
        }
      );

      // 查找目标元素并开始观察
      Taro.createSelectorQuery()
        .select(`#${targetId}`)
        .node()
        .exec((res) => {
          // 检查组件是否仍然存在，避免在组件卸载后执行
          if (res && res[0] && res[0].node && observerRef.current) {
            observerRef.current.observe(res[0].node);
          } else if (observerRef.current) {
            // 如果获取节点失败，使用降级方案
            console.warn("Failed to get target node, using fallback method");
            useFallbackMethod(targetId);
          }
        });
    } else {
      // 降级到定时器方案
      console.warn("IntersectionObserver not supported, using fallback method");
      useFallbackMethod(targetId);
    }
  }, [orderHasMore, loadMoreOrders]);

  // 降级方案：使用定时器轮询
  const useFallbackMethod = useCallback(
    (targetId: string) => {
      const checkElementStatus = () => {
        Taro.createSelectorQuery()
          .select(`#${targetId}`)
          .boundingClientRect()
          .exec((res) => {
            if (res && res[0]) {
              const rect = res[0];
              try {
                const windowInfo = Taro.getWindowInfo();
                if (rect.top < windowInfo.windowHeight && rect.bottom > 0) {
                  if (orderHasMore) {
                    loadMoreOrders();
                  }
                }
              } catch (error) {
                console.warn("Failed to get window info:", error);
                const fallbackHeight = 667;
                if (rect.top < fallbackHeight && rect.bottom > 0) {
                  if (orderHasMore) {
                    loadMoreOrders();
                  }
                }
              }
            }
          });
      };

      fallbackIntervalRef.current = setInterval(checkElementStatus, 500); // 降级方案使用较低频率
    },
    [orderHasMore, loadMoreOrders]
  );

  // 设置滚动监听
  useEffect(() => {
    setupScrollListener();

    return () => {
      // 清理观察器和定时器
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
      // 清理所有未完成的 timeout
      timeoutRefs.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      timeoutRefs.current.clear();
    };
  }, [setupScrollListener]);

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
          <View style={{ marginTop: "8px", fontSize: "12px", color: "gray", textAlign: "center" }} id="my-order-more-tag">
            更多订单加载中...
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
