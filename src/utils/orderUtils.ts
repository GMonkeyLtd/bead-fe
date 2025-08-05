import { StatusBadgeType } from "@/components/StatusBadge";

export enum OrderStatus {
  // 进行中（表示订单创建后未到支付环节或处理中）
  InProgress = "in_progress",
  // 沟通中（用户和商家就订单细节进行协商）
  Negotiating = "negotiating",
  // 待支付（商家和用户达成一致，商家设置价格成功，等待用户支付）
  PendingPayment = "pending_payment",
  // 待发货（用户已支付，等待商家发货）
  PendingShipment = "pending_shipment",
  // 已发货（商家已发出商品，等待用户签收）
  Shipped = "shipped",
  // 已签收（用户确认收到商品）
  Received = "received",
  // 已完成（整个订单流程结束）
  Completed = "completed",
  // 已取消（订单被用户取消）
  Cancelled = "cancelled",
  // 商家取消（商家取消订单）
  MerchantCancelled = "merchant_cancelled",
  // 退款中（用户发起退款申请，正在处理中）
  AfterSale = "after_sale"
}
export const OrderStatusMap = {
  [OrderStatus.InProgress]: "进行中",
  [OrderStatus.Negotiating]: "进行中",
  [OrderStatus.PendingPayment]: "待支付",
  [OrderStatus.PendingShipment]: "已支付",
  [OrderStatus.Shipped]: "已发货",
  [OrderStatus.Received]: "已签收",
  [OrderStatus.Completed]: "已完成",
  [OrderStatus.Cancelled]: "已取消",
  [OrderStatus.MerchantCancelled]: "商家取消",
  [OrderStatus.AfterSale]: "售后中"
};

export enum AfterSaleStatus {
  None = "",
  Refunding = "refunding",
  Refunded = "refunded",
  RefundReviewing = "refund_reviewing"
}

export const AfterSaleStatusMap = {
  [AfterSaleStatus.Refunding]: "退款中",
  [AfterSaleStatus.Refunded]: "退款成功",
  [AfterSaleStatus.RefundReviewing]: "待审核"
}

export const processingOrderStatus = [
  OrderStatus.InProgress,
  OrderStatus.Negotiating,
  OrderStatus.PendingPayment,
];

export const cancelledOrderStatus = [
  OrderStatus.Cancelled,
];


export const formatOrderStatus = (status: OrderStatus, afterSaleStatus: AfterSaleStatus) => {
  if (status === OrderStatus.AfterSale) {
    return AfterSaleStatusMap[afterSaleStatus];
  }
  return OrderStatusMap[status];
};

export const getStatusBadgeType = (status: OrderStatus): StatusBadgeType => {
  switch (status) {
    case OrderStatus.Cancelled:
    case OrderStatus.MerchantCancelled:
    case OrderStatus.AfterSale:
      return StatusBadgeType.Error;
    case OrderStatus.Completed:
      return StatusBadgeType.Success;
    default:
      return StatusBadgeType.Processing;
  }
};

export const afterSaleStatusDescriptionMap = {
  [AfterSaleStatus.Refunding]: "退款进行中",
  [AfterSaleStatus.Refunded]: "退款成功",
  [AfterSaleStatus.RefundReviewing]: "请等待商家处理"
}


export const getOrderStatusDescription = (status: OrderStatus, afterSaleStatus: AfterSaleStatus) => {
  switch (status) {
    case OrderStatus.InProgress:
    case OrderStatus.Negotiating:
      return "定制细节沟通中";
    case OrderStatus.PendingPayment:
      return "请确认定制信息";
    case OrderStatus.PendingShipment:
      return "等待商家定制";
    case OrderStatus.Shipped:
      return "快递已发出";
    case OrderStatus.Received:
      return "快递已签收";
    case OrderStatus.Completed:
      return "恭喜您，收获新手串";
    case OrderStatus.Cancelled:
      return "用户取消定制";
    case OrderStatus.MerchantCancelled:
      return "商家取消定制";
    case OrderStatus.AfterSale:
      return afterSaleStatusDescriptionMap[afterSaleStatus];
    default:
      return`订单${OrderStatusMap[status]}`;
  }
}

export const afterSaleStatusTipMap = {
  [AfterSaleStatus.Refunding]: "退款金额原路返回，银行卡支付的退款预计3个工作日",
  [AfterSaleStatus.Refunded]: "",
  [AfterSaleStatus.RefundReviewing]: "已提交退款申请，预计24小时内为您处理"
}

export const getOrderStatusTip = (status: OrderStatus, afterSaleStatus: AfterSaleStatus, statusTime?: number) => {
  switch (status) {
    case OrderStatus.InProgress:
    case OrderStatus.Negotiating:
      return '稍后商家将主动与您联系';
    case OrderStatus.PendingPayment:
      return "请及时付款";
    case OrderStatus.PendingShipment:
      return "定制周期一般在7-10天";
    case OrderStatus.Shipped:
      return "商家已发货，请耐心等待";
    case OrderStatus.AfterSale:
      return afterSaleStatusTipMap[afterSaleStatus];
    case OrderStatus.Received:
      if (!statusTime) {
        return "";
      }
      // 自动确认收货时间为10天
      const autoConfirmDays = 10;
      const now = Date.now();
      const timeDiff = statusTime + (autoConfirmDays * 24 * 60 * 60 * 1000) - now;
      
      if (timeDiff <= 0) {
        return "即将自动确认收货";
      }
      
      const days = Math.floor(timeDiff / (24 * 60 * 60 * 1000));
      const hours = Math.floor((timeDiff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      
      if (days > 0 && hours > 0) {
        return `还剩${days}天${hours}小时，自动确认收货`;
      } else if (days > 0) {
        return `还剩${days}天，自动确认收货`;
      } else if (hours > 0) {
        return `还剩${hours}小时，自动确认收货`;
      } else {
        return "即将自动确认收货";
      }
    default:
      return '';
  }
}

export const showReferencePrice = (status: OrderStatus) => {
  return [OrderStatus.InProgress, OrderStatus.Negotiating, OrderStatus.Cancelled, OrderStatus.MerchantCancelled].includes(status);
}
