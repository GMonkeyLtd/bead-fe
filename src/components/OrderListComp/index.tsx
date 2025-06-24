import React from "react";
import { View, Text, Image } from "@tarojs/components";
import StatusBadge, { StatusBadgeType } from "@/components/StatusBadge";
import { OrderStatus, OrderStatusMap } from "@/utils/orderUtils";
import phoneIcon from "@/assets/icons/phone.svg";
import wechatIcon from "@/assets/icons/wechat.svg";
import remarkIcon from "@/assets/icons/remark.svg";
import createBeadIcon from "@/assets/icons/create-bead.svg";
import "./index.scss";

// 订单数据接口
export interface OrderItem {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  merchantName: string;
  merchantImage?: string;
  price: number;
  createTime: string;
  budget?: number; // 预算，用于显示"预算：不限"等
}

interface OrderListProps {
  orders: OrderItem[];
  onContactMerchant?: (orderId: string) => void;
  onEvaluate?: (orderId: string) => void;
  onReorder?: (orderId: string) => void;
  onItemClick?: (orderId: string) => void;
  showActions?: boolean;
  showImage?: boolean;
}

const OrderListComp: React.FC<OrderListProps> = ({
  orders = [],
  onContactMerchant,
  onEvaluate,
  onReorder,
  onItemClick,
  showActions = true,
  showImage = true,
}) => {
  // 根据订单状态获取StatusBadge类型
  const getStatusBadgeType = (status: OrderStatus): StatusBadgeType => {
    switch (status) {
      case OrderStatus.Cancelled:
        return StatusBadgeType.Error;
      case OrderStatus.Completed:
        return StatusBadgeType.Success;
      default:
        return StatusBadgeType.Processing;
    }
  };

  // 根据订单状态获取显示文本
  const getStatusText = (status: OrderStatus): string => {
    if (status === OrderStatus.PendingDispatch) {
      return "等待商家";
    }
    return OrderStatusMap[status];
  };

  // 根据订单状态获取商家显示文本
  const getMerchantDisplayText = (order: OrderItem): string => {
    if (order.status === OrderStatus.PendingDispatch) {
      return "匹配商家中...";
    }
    return order.merchantName;
  };

  // 渲染订单操作按钮
  const renderOrderActions = (order: OrderItem) => {
    const isCompleted = order.status === OrderStatus.Completed;
    const isInProgress = [
      OrderStatus.PendingDispatch,
      OrderStatus.PendingAcceptance,
      OrderStatus.InService,
    ].includes(order.status);

    return (
      <View className="order-actions">
        {isInProgress && onContactMerchant && (
          <View
            className="action-button contact-button"
            onClick={(e) => {
              e.stopPropagation();
              onContactMerchant(order.id);
            }}
          >
            <Image src={phoneIcon} className="action-icon" />
            <Text className="action-text">联系商家</Text>
          </View>
        )}

        {isCompleted && (
          <>
            {onEvaluate && (
              <View
                className="action-button evaluate-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEvaluate(order.id);
                }}
              >
                <Image src={remarkIcon} className="action-icon" />
                <Text className="action-text">评价</Text>
              </View>
            )}
            {onReorder && (
              <View
                className="action-button reorder-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReorder(order.id);
                }}
              >
                <Image src={createBeadIcon} className="action-icon" />
                <Text className="action-text">再来一单</Text>
              </View>
            )}
          </>
        )}
      </View>
    );
  };

  // 渲染价格或预算信息
  const renderPriceInfo = (order: OrderItem) => {
    if (order.status === OrderStatus.Cancelled && order.budget !== undefined) {
      return order.budget === 0
        ? "预算：不限"
        : `预算：¥${order.budget.toFixed(2)}`;
    }
    return `¥${order.price.toFixed(2)}`;
  };

  return (
    <View className="order-list">
      {orders.map((order) => (
        <View
          key={order.id}
          className="order-item"
          onClick={() => onItemClick?.(order.id)}
        >
          {/* 订单头部：订单号和状态 */}
          <View className="order-header">
            <Text className="order-number">订单号：{order.orderNumber}</Text>
            <StatusBadge
              type={getStatusBadgeType(order.status)}
              text={getStatusText(order.status)}
            />
          </View>

          {/* 订单内容 */}
          <View className="order-content">
            <View className="order-main">
              {/* 商品图片和商家信息 */}
              <View className="merchant-section">
                {showImage && (
                  <View className="merchant-image">
                    <Image
                      src={
                        order.merchantImage ||
                        "https://zhuluoji.cn-sh2.ufileos.com/images-frontend/bead-ring.png"
                      }
                      mode="aspectFill"
                      className="merchant-img"
                    />
                  </View>
                )}
                <View className="merchant-info">
                  <Text className="merchant-name">
                    {getMerchantDisplayText(order)}
                  </Text>
                  <Text className="order-time">{order.createTime}</Text>
                </View>
              </View>

              {/* 价格信息 */}
              <Text className="order-price">{renderPriceInfo(order)}</Text>
            </View>

            {/* 分割线 */}
            {order.status === OrderStatus.Completed && showActions && (
              <View className="order-divider" />
            )}

            {/* 操作按钮 */}
            {showActions && renderOrderActions(order)}
          </View>
        </View>
      ))}
    </View>
  );
};

export default OrderListComp;
