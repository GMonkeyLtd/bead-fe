import React from "react";
import Taro from "@tarojs/taro";
import { View } from "@tarojs/components";
import { OrderStatus } from "@/utils/orderUtils";
import OrderListComp, { OrderItem } from "@/components/OrderListComp";

const OrderListDemo: React.FC = () => {
  // 模拟订单数据
  const mockOrders: OrderItem[] = [
    {
      id: "1",
      orderNumber: "ADX2333",
      status: OrderStatus.PendingDispatch,
      merchantName: "东海县亿特珠宝有限公司",
      merchantImage:
        "https://zhuluoji.cn-sh2.ufileos.com/images-frontend/bead-ring.png",
      price: 199.0,
      createTime: "2025-04-08 14:27:39",
    },
    {
      id: "2",
      orderNumber: "ADX2333",
      status: OrderStatus.PendingAcceptance,
      merchantName: "东海县亿特珠宝有限公司",
      merchantImage:
        "https://zhuluoji.cn-sh2.ufileos.com/images-frontend/bead-ring.png",
      price: 299.0,
      createTime: "2025-04-08 14:27:39",
    },
    {
      id: "3",
      orderNumber: "ADX2333",
      status: OrderStatus.Completed,
      merchantName: "上上珠宝有限公司",
      merchantImage:
        "https://zhuluoji.cn-sh2.ufileos.com/images-frontend/bead-ring.png",
      price: 299.0,
      createTime: "2025-04-08 14:27:39",
    },
    {
      id: "4",
      orderNumber: "ADX2333",
      status: OrderStatus.Cancelled,
      merchantName: "山尺手作",
      merchantImage:
        "https://zhuluoji.cn-sh2.ufileos.com/images-frontend/bead-ring.png",
      price: 299.0,
      createTime: "2025-04-08 14:27:39",
      budget: 0, // 预算不限
    },
    {
      id: "5",
      orderNumber: "ADX2333",
      status: OrderStatus.Completed,
      merchantName: "上上珠宝有限公司",
      merchantImage:
        "https://zhuluoji.cn-sh2.ufileos.com/images-frontend/bead-ring.png",
      price: 299.0,
      createTime: "2025-04-08 14:27:39",
    },
    {
      id: "6",
      orderNumber: "ADX2333",
      status: OrderStatus.Completed,
      merchantName: "上上珠宝有限公司",
      merchantImage:
        "https://zhuluoji.cn-sh2.ufileos.com/images-frontend/bead-ring.png",
      price: 299.0,
      createTime: "2025-04-08 14:27:39",
    },
    {
      id: "7",
      orderNumber: "ADX2333",
      status: OrderStatus.Completed,
      merchantName: "上上珠宝有限公司",
      merchantImage:
        "https://zhuluoji.cn-sh2.ufileos.com/images-frontend/bead-ring.png",
      price: 299.0,
      createTime: "2025-04-08 14:27:39",
    },
  ];

  const handleContactMerchant = (orderId: string) => {
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

  const handleItemClick = (orderId: string) => {
    Taro.navigateTo({
      url: `/pages-user/order-detail/index?orderId=${orderId}`,
    });
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
          orders={mockOrders}
          onContactMerchant={handleContactMerchant}
          onEvaluate={handleEvaluate}
          onReorder={handleReorder}
          onItemClick={handleItemClick}
        />
      </View>
    </View>
  );
};

export default OrderListDemo;
