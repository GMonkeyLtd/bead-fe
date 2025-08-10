import { useState, useEffect, useMemo } from "react";
import { View, Text } from "@tarojs/components";
import Taro, { showToast, useDidShow, usePullDownRefresh } from "@tarojs/taro";
import "./index.scss";
import MerchantHeader from "@/components/MerchantHeader";
import OrderList from "@/components/OrderList";
import merchantApi from "@/utils/api-merchant";
import { AfterSaleStatus, formatOrderStatus, OrderStatus } from "@/utils/orderUtils";
import TabBar from "@/components/TabBar";

interface Order {
  id: string;
  orderNo: string;
  status: "已接单" | "已完成" | "已取消";
  price: number;
  createTime: string;
  image: string;
  userPhone: string;
  description: string;
}

export default function OrderManagement() {
  const [activeTab, setActiveTab] = useState<OrderStatus>(OrderStatus.Negotiating);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderStatusList, setOrderStatusList] = useState<any[]>([]);

  const getOrdersByStatus = (statusItem: any) => {
    Taro.showLoading({
      title: "加载中...",
      mask: true,
    });
    const status = statusItem.parent_status ? statusItem.parent_status : statusItem.status;
    const afterSaleStatus = statusItem.parent_status ? statusItem.status : null;
    merchantApi.user.getOrderList({
      order_status: status,
      after_sale_status: afterSaleStatus,
      page: 0,
      page_size: 100,
    }).then((res: any) => {
      const orders = res.data.orders || [];
      setOrders(orders);
    }).catch((err) => {
      console.log(err, 'err');
    }).finally(() => {
      Taro.hideLoading();
      Taro.stopPullDownRefresh()
    });
  }

  const loadOrderStatusList = async () => {
    Taro.showLoading({
      title: "加载中...",
      mask: true,
    });
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
      setActiveTab(curStatus.status as OrderStatus);
      getOrdersByStatus(curStatus);
    } catch (error) {
      showToast({
        title: "获取订单状态列表失败",
        icon: "none",
      });
    }
  };

  useDidShow(() => {
    loadOrderStatusList();
  });

  usePullDownRefresh(() => {
    loadOrderStatusList()
  });

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
              getOrdersByStatus(status);
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
      />
      <TabBar isMerchant={true} />
    </View>
  );
}
