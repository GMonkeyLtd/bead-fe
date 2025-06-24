export enum OrderStatus {
  PendingDispatch = 0, // 待派单
  PendingAcceptance = 1, // 待接单
  InService = 2, // 服务中
  Completed = 3, // 已完成
  Cancelled = 4, // 已取消
}
export const OrderStatusMap = {
  [OrderStatus.PendingDispatch]: "待派单",
  [OrderStatus.PendingAcceptance]: "待接单",
  [OrderStatus.InService]: "服务中",
  [OrderStatus.Completed]: "已完成",
  [OrderStatus.Cancelled]: "已取消",
};

export const processingOrderStatus = [
  OrderStatus.PendingDispatch,
  OrderStatus.PendingAcceptance,
  OrderStatus.InService,
];

export const formatOrderStatus = (status: OrderStatus) => {
  if (processingOrderStatus.includes(status)) {
    return "进行中";
  }
  return OrderStatusMap[status];
};
