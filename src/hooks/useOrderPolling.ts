/**
 * 订单状态轮询 Hook
 *
 * @example
 * ```tsx
 * // 基础用法
 * const { startPolling, stopPolling, isPolling } = useOrderPolling({
 *   orderId: '12345',
 * });
 *
 * // 自定义配置
 * const { startPolling, stopPolling, isPolling } = useOrderPolling({
 *   orderId: orderId,
 *   interval: 5000, // 每5秒轮询一次
 *   onStatusChange: (newStatus) => {
 *     console.log('状态变化:', newStatus);
 *   },
 *   shouldStopPolling: (status) => status === OrderStatus.Completed, // 自定义停止条件
 * });
 * ```
 */

import { useRef, useEffect, useCallback, useState } from "react";
import Taro from "@tarojs/taro";
import api from "@/utils/api";
import { OrderStatus } from "@/utils/orderUtils";
import { pageUrls } from "@/config/page-urls";

interface UseOrderPollingOptions {
  orderId: string | undefined;
  interval?: number; // 轮询间隔，默认3000ms
  onStatusChange?: (newStatus: OrderStatus) => void; // 状态变化回调
  shouldStopPolling?: (status: OrderStatus) => boolean; // 自定义停止条件
  autoRedirect?: boolean; // 是否自动跳转，默认true
  redirectUrl?: string; // 自定义跳转URL
}

interface UseOrderPollingReturn {
  startPolling: () => void;
  stopPolling: () => void;
  isPolling: boolean;
  orderInfo: any;
}

export const useOrderPolling = ({
  orderId,
  interval = 3000,
  onStatusChange,
  shouldStopPolling: customShouldStopPolling,
  autoRedirect = true,
  redirectUrl,
}: UseOrderPollingOptions): UseOrderPollingReturn => {
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef<boolean>(false);
  const [orderInfo, setOrderInfo] = useState<any>(null);

  const defaultShouldStopPolling = (status) =>
    ![OrderStatus.Negotiating, OrderStatus.InProgress].includes(status);

  const shouldStopPolling = customShouldStopPolling || defaultShouldStopPolling;

  const queryOrder = useCallback(
    async (orderIdToQuery: string): Promise<boolean> => {
      try {
        const res = await api.userHistory.getOrderById(orderIdToQuery, { showLoading: false });

        // 根据实际 API 返回结构调整数据获取方式，使用类型断言
        const orderData = (res?.data as any)?.orders?.[0] as any;
        setOrderInfo(orderData);
        const orderStatusStr = orderData?.order_status;

        // 调用状态变化回调
        if (onStatusChange && orderStatusStr !== undefined) {
          onStatusChange(orderStatusStr);
        }

        // 检查是否应该停止轮询
        if (orderStatusStr !== undefined && shouldStopPolling(orderStatusStr)) {
          console.log("订单状态已变更，停止轮询");

          return false; // 表示轮询应该停止
        }

        return true; // 表示轮询应该继续
      } catch (error) {
        console.error("查询订单失败:", error);
        return true; // 出错时继续轮询
      }
    },
    [onStatusChange, shouldStopPolling, autoRedirect, redirectUrl]
  );

  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      console.log("停止轮询订单状态");
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
      isPollingRef.current = false;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (!orderId || isPollingRef.current) {
      return;
    }

    console.log("开始轮询订单状态");
    isPollingRef.current = true;

    // 先立即查询一次
    queryOrder(orderId);

    // 设置定时器，每指定间隔查询一次
    pollingTimerRef.current = setInterval(async () => {
      if (!orderId) {
        stopPolling();
        return;
      }

      const shouldContinue = await queryOrder(orderId);
      if (!shouldContinue) {
        stopPolling();
      }
    }, interval);
  }, [orderId, interval, queryOrder, stopPolling]);

  return {
    startPolling,
    stopPolling,
    isPolling: isPollingRef.current,
    orderInfo,
  };
};
