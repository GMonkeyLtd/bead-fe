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

export const getOrderStatusDescription = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.OrderStatusInProgress:
    case OrderStatus.OrderStatusNegotiating:
      return "定制细节沟通中";
    case OrderStatus.OrderStatusPendingPayment:
      return "请确认定制信息";
    case OrderStatus.OrderStatusPendingShipment:
      return "等待商家定制";
    case OrderStatus.OrderStatusShipped:
      return "快递已发出";
    case OrderStatus.OrderStatusReceived:
      return "快递已签收";
    case OrderStatus.OrderStatusCompleted:
      return "恭喜您，收获新手串";
    case OrderStatus.OrderStatusCancelled:
      return "用户取消定制";
    case OrderStatus.OrderStatusRefunding:
      return "请等待商家处理";
    case OrderStatus.OrderStatusRefunded:
      return "退款成功";
    default:
      return`订单${OrderStatusMap[status]}`;
  }
}

export const getOrderStatusTip = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.OrderStatusInProgress:
    case OrderStatus.OrderStatusNegotiating:
      return '稍后商家将主动与您联系';
    case OrderStatus.OrderStatusPendingPayment:
      return "请及时付款";
    case OrderStatus.OrderStatusPendingShipment:
      return "定制周期一般在7-10天";
    case OrderStatus.OrderStatusShipped:
      return "商家已发货，请耐心等待";
    case OrderStatus.OrderStatusRefunding:
      return "已提交退款申请，预计24小时内为您处理";
    default:
      return '';
  }
}
