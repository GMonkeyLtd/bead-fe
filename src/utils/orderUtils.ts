import { StatusBadgeType } from "@/components/StatusBadge";

export enum OrderStatus {
  PendingDispatch = '0', // 待派单
  Dispatching = '1', // 派单中
  InService = '2', // 服务中
  Completed = '3', // 已完成
  Cancelled = '4', // 用户取消
  MerchantCancel = '5', // 商家取消
}
export const OrderStatusMap = {
  [OrderStatus.PendingDispatch]: "待派单",
  [OrderStatus.Dispatching]: "派单中",
  [OrderStatus.InService]: "服务中",
  [OrderStatus.Completed]: "已完成",
  [OrderStatus.Cancelled]: "用户已取消",
  [OrderStatus.MerchantCancel]: "商家已取消",
};

export const processingOrderStatus = [
  OrderStatus.PendingDispatch,
  OrderStatus.Dispatching,
  OrderStatus.InService,
];

export const cancelledOrderStatus = [
  OrderStatus.Cancelled,
  OrderStatus.MerchantCancel,
];


export const formatOrderStatus = (status: OrderStatus) => {
  if (processingOrderStatus.includes(status)) {
    return "进行中";
  }
  return OrderStatusMap[status];
};

export const getStatusBadgeType = (status: OrderStatus): StatusBadgeType => {
  switch (status) {
    case OrderStatus.Cancelled:
      return StatusBadgeType.Error;
    case OrderStatus.Completed:
      return StatusBadgeType.Success;
    default:
      return StatusBadgeType.Processing;
  }
};
