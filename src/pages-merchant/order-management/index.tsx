import { useState, useEffect, useMemo } from "react";
import { View, Text } from "@tarojs/components";
import Taro, { showToast } from "@tarojs/taro";
import "./index.scss";
import MerchantHeader from "@/components/MerchantHeader";
import OrderList from "@/components/OrderList";
import api from "@/utils/api-merchant";
import { OrderStatus } from "@/utils/orderUtils";
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

type TabType = "进行中" | "已完成" | "已取消";
const TAB_LIST = ["进行中", "已完成", "已取消"];

export default function OrderManagement() {
  const [activeTab, setActiveTab] = useState<TabType>("进行中");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const tab = Taro.getCurrentInstance().router?.params?.tab;
  console.log(tab, "tab");

  useEffect(() => {
    const index = tab ? Number(tab) : 0;
    setActiveTab(TAB_LIST[index] as TabType);
  }, [tab]);

  const loadOrders = async () => {
    setLoading(true);
    Taro.showLoading();
    try {
      // 模拟API调用
      api.user.getOrderList().then((res: any) => {
        console.log(res.data.orders, "res.data.orders");
        const orderList = res.data.orders?.map((item) => {
          return {
            id: item.order_uuid,
            orderNo: item.order_uuid,
            status: item.order_status,
            price: item.price,
            createTime: item.created_at,
            image: item.design_info?.image_url || "",
            userPhone: item.user_info?.phone || "暂无",
            braceletInfo: item.design_info || {},
            userInfo: item.user_info || {},
          };
        });
        setOrders(orderList || []);
      });
    } catch (error) {
      showToast({
        title: "加载失败",
        icon: "none",
      });
    } finally {
      setLoading(false);
      Taro.hideLoading();
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const currentOrders = useMemo(() => {
    console.log(orders, activeTab, "useMemo orders, activeTab");
    if (activeTab === "进行中") {
      return orders.filter(
        (item) => (item.status as OrderStatus) === OrderStatus.InService
      );
    } else if (activeTab === "已完成") {
      return orders.filter(
        (item) => (item.status as OrderStatus) === OrderStatus.Completed
      );
    } else if (activeTab === "已取消") {
      return orders.filter((item) =>
        [OrderStatus.Cancelled, OrderStatus.MerchantCancel].includes(
          item.status as OrderStatus
        )
      );
    }
  }, [orders, activeTab]);

  console.log(currentOrders, "currentOrders");

  return (
    <View className="order-management-container">
      <MerchantHeader />
      <View className="tabs-container">
        {TAB_LIST.map((tab) => (
          <View
            key={tab}
            className={`tab-item ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab as TabType)}
          >
            <Text className="tab-text">{tab}</Text>
          </View>
        ))}
      </View>

      <OrderList
        orders={currentOrders || []}
        loading={loading}
        onRefresh={loadOrders}
        style={{
          height: "calc(100vh - 220px)",
        }}
      />
      <TabBar isMerchant={true} />
    </View>
  );
}
