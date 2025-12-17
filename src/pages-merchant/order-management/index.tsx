import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { View, Text } from "@tarojs/components";
import Taro, { showToast, useDidShow, usePullDownRefresh } from "@tarojs/taro";
import "./index.scss";
import OrderList from "@/components/OrderList";
import merchantApi from "@/utils/api-merchant";
import { AfterSaleStatus, formatOrderStatus, OrderStatus } from "@/utils/orderUtils";
import TabBar from "@/components/TabBar";
import { usePageQuery } from "@/hooks/usePageQuery";

export default function OrderManagement() {
  const [activeTab, setActiveTab] = useState<OrderStatus>(OrderStatus.Negotiating);
  const [orderStatusList, setOrderStatusList] = useState<any[]>([]);
  const activeStatusItemRef = useRef<any>(null);

  // 当前激活的状态配置
  const activeStatusItem = useMemo(() => {
    return orderStatusList.find(item => item.status === activeTab);
  }, [activeTab, orderStatusList]);

  // 使用 usePageQuery 管理订单列表的分页加载
  const {
    data: orders,
    loading,
    hasMore,
    refresh,
    loadMore,
    resetData,
  } = usePageQuery<any>({
    listKey: "orderList",
    initialPage: 1,
    pageSize: 10,
    fetchData: useCallback(async (page: number, pageSize: number) => {
      if (!activeStatusItemRef.current) {
        return { data: [], hasMore: false, total: 0 };
      }
      
      const statusItem = activeStatusItemRef.current;
      const status = statusItem.parent_status ? statusItem.parent_status : statusItem.status;
      const afterSaleStatus = statusItem.parent_status ? statusItem.status : null;

      const res = await merchantApi.user.getOrderList({
        order_status: status,
        after_sale_status: afterSaleStatus,
        page: page,
        page_size: pageSize,
      });
      
      const orderList = res.data.orders || [];
      const total = res.data.total || 0;
      const hasMore = page * pageSize < total;

      return {
        data: orderList,
        hasMore,
        total,
      };
    }, []),
    queryItem: useCallback(async (item: any) => {
      // 查询单个订单详情（如果需要更新单个订单）
      return item;
    }, []),
    selector: "#order-more-tag",
  });

  const loadOrderStatusList = async () => {
    try {
      const res = await merchantApi.user.getOrderStatusList()
      const statusList: any[] = [];
      Object.keys(res.data).filter((key) => key !== "total").forEach((key) => {
        if (key === "after_sale") {
          Object.keys(res.data[key]).forEach((subKey) => {
            statusList.push(
              {
                status: subKey,
                status_text: formatOrderStatus(key as OrderStatus, subKey as AfterSaleStatus),
                count: res.data[key][subKey],
                parent_status: key,
              });
          });
        } else {
          statusList.push({
            status: key,
            status_text: formatOrderStatus(key as OrderStatus),
            count: res.data[key]
          });
        }
      })
      setOrderStatusList(statusList);
      const curStatus = statusList.find(item => item.status === activeTab) || statusList[0];
      // 只在需要时设置 activeTab（避免不必要的重新渲染）
      if (curStatus && curStatus.status !== activeTab) {
        setActiveTab(curStatus.status as OrderStatus);
      }
      activeStatusItemRef.current = curStatus;
      // 刷新订单列表
      refresh();
    } catch (error) {
      console.log(error, 'error');
      showToast({
        title: "获取订单状态列表失败",
        icon: "none",
      });
    } finally {
      Taro.stopPullDownRefresh();
    }
  };

  // 当用户切换 tab 时，先清空列表，再更新 ref 并刷新数据
  useEffect(() => {
    if (activeStatusItem && activeStatusItemRef.current?.status !== activeStatusItem.status) {
      console.log('切换订单状态：', activeStatusItemRef.current?.status, '->', activeStatusItem.status);
      // 先清空列表
      resetData();
      // 更新状态引用
      activeStatusItemRef.current = activeStatusItem;
      // 延迟一下再刷新，确保列表已清空
      setTimeout(() => {
        refresh();
      }, 50);
    }
  }, [activeStatusItem?.status, resetData, refresh]);

  useDidShow(() => {
    loadOrderStatusList();
  });

  usePullDownRefresh(() => {
    loadOrderStatusList()
  });

  // 滚动加载监听逻辑（完全参考 inspiration 页面的实现）
  const observerRef = useRef<IntersectionObserver | null>(null);
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

    const targetId = "order-more-tag";

    // 优先使用 IntersectionObserver
    if (typeof IntersectionObserver !== "undefined") {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && hasMore && !loading) {
              console.log('触发加载更多，hasMore:', hasMore, 'loading:', loading);
              loadMore();
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
  }, [hasMore, loading, loadMore]);

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
                if (rect.top < windowInfo.windowHeight && rect.bottom > 0 && hasMore && !loading) {
                  loadMore();
                }
              } catch (error) {
                console.warn("Failed to get window info:", error);
                const fallbackHeight = 667;
                if (rect.top < fallbackHeight && rect.bottom > 0 && hasMore && !loading) {
                  loadMore();
                }
              }
            }
          });
      };

      fallbackIntervalRef.current = setInterval(checkElementStatus, 500); // 降级方案使用较低频率
    },
    [hasMore, loading, loadMore]
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
    };
  }, [setupScrollListener]);

  return (
    <View className="order-management-container">
      {/* <MerchantHeader /> */}
      <View className="tabs-container">
        {orderStatusList.map((status) => (
          <View
            key={status.status}
            className={`tab-item ${activeTab === status.status ? "active" : ""}`}
            onClick={() => {
              setActiveTab(status.status as OrderStatus);
            }}
          >
            <Text className="tab-text">{`${status.status_text}(${status.count})`}</Text>
          </View>
        ))}
      </View>

      <OrderList
        orders={orders || []}
        loading={loading}
        onRefresh={loadOrderStatusList}
        style={{
          height: "calc(100vh - 260px)",
        }}
        renderFooter={() => (
          <View 
            id="order-more-tag" 
            className="order-load-more"
            style={{
              padding: "20px",
              textAlign: "center",
              fontSize: "14px",
              color: "#999",
            }}
          >
            {loading ? (
              <Text>加载中...</Text>
            ) : hasMore ? (
              <Text>上拉加载更多</Text>
            ) : orders.length > 0 ? (
              <Text>没有更多订单了</Text>
            ) : null}
          </View>
        )}
      />

      <TabBar isMerchant={true} />
    </View>
  );
}
