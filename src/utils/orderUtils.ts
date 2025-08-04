import { StatusBadgeType } from "@/components/StatusBadge";

export enum OrderStatus {
  // 进行中（表示订单创建后未到支付环节或处理中）
  OrderStatusInProgress = "in_progress",
  // 沟通中（用户和商家就订单细节进行协商）
  OrderStatusNegotiating = "negotiating",
  // 待支付（商家和用户达成一致，商家设置价格成功，等待用户支付）
  OrderStatusPendingPayment = "pending_payment",
  // 待发货（用户已支付，等待商家发货）
  OrderStatusPendingShipment = "pending_shipment",
  // 已发货（商家已发出商品，等待用户签收）
  OrderStatusShipped = "shipped",
  // 已签收（用户确认收到商品）
  OrderStatusReceived = "received",
  // 已完成（整个订单流程结束）
  OrderStatusCompleted = "completed",
  // 已取消（订单被用户取消）
  OrderStatusCancelled = "cancelled",
  // 退款中（用户发起退款申请，正在处理中）
  OrderStatusRefunding = "refunding",
  // 已退款（订单完成退款流程）
  OrderStatusRefunded = "refunded"
}
export const OrderStatusMap = {
  [OrderStatus.OrderStatusInProgress]: "进行中",
  [OrderStatus.OrderStatusNegotiating]: "沟通中",
  [OrderStatus.OrderStatusPendingPayment]: "待支付",
  [OrderStatus.OrderStatusPendingShipment]: "待发货",
  [OrderStatus.OrderStatusShipped]: "已发货",
  [OrderStatus.OrderStatusReceived]: "已签收",
  [OrderStatus.OrderStatusCompleted]: "已完成",
  [OrderStatus.OrderStatusCancelled]: "已取消",
  [OrderStatus.OrderStatusRefunding]: "退款中",
  [OrderStatus.OrderStatusRefunded]: "已退款"
};

export const processingOrderStatus = [
  OrderStatus.OrderStatusInProgress,
  OrderStatus.OrderStatusNegotiating,
  OrderStatus.OrderStatusPendingPayment,
];

export const cancelledOrderStatus = [
  OrderStatus.OrderStatusCancelled,
];


export const formatOrderStatus = (status: OrderStatus) => {
  if (processingOrderStatus.includes(status)) {
    return "进行中";
  }
  return OrderStatusMap[status];
};

export const getStatusBadgeType = (status: OrderStatus): StatusBadgeType => {
  switch (status) {
    case OrderStatus.OrderStatusCancelled:
    case OrderStatus.OrderStatusRefunding:
    case OrderStatus.OrderStatusRefunded:
      return StatusBadgeType.Error;
    case OrderStatus.OrderStatusCompleted:
      return StatusBadgeType.Success;
    default:
      return StatusBadgeType.Processing;
  }
};
