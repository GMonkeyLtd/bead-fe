export enum OrderStatus {
  PendingDispatch = '0', // 待派单
  Dispatching = '1', // 派单中
  PendingAcceptance = '2', // 待接单
  InService = '3', // 服务中
  Completed = '4', // 已完成
  Cancelled = '5', // 用户取消
  MerchantCancel = '6', // 商家取消
}
export const OrderStatusMap = {
  [OrderStatus.PendingDispatch]: "待派单",
  [OrderStatus.Dispatching]: "派单中",
  [OrderStatus.PendingAcceptance]: "待接单",
  [OrderStatus.InService]: "服务中",
  [OrderStatus.Completed]: "已完成",
  [OrderStatus.Cancelled]: "已取消",
  [OrderStatus.MerchantCancel]: "商家取消",
};

export const processingOrderStatus = [
  OrderStatus.PendingDispatch,
  OrderStatus.Dispatching,
  OrderStatus.PendingAcceptance,
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
