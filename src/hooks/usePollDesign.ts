import { useCallback, useEffect, useRef, useState } from "react";
import { CancelToken } from "@/utils/request";
import sessionApi, { TDesign } from "@/utils/api-session";
import { useDidHide, useUnload } from "@tarojs/taro";


interface UsePollDesignOptions {
  pollingInterval?: number; // ms
  checkStopPoll?: (design: TDesign) => boolean;
  maxRetries?: number; // 最大重试次数
  enableBackoff?: boolean; // 是否启用指数退避
}

export const usePollDesign = (options?: UsePollDesignOptions) => {
  const pollingInterval = options?.pollingInterval ?? 5000;
  const maxRetries = options?.maxRetries ?? 3;
  const enableBackoff = options?.enableBackoff ?? true;

  const [design, setDesign] = useState<TDesign | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 每个 designId 对应一个 cancelToken 与 定时器
  const cancelTokenMapRef = useRef<Record<string, CancelToken>>({});
  const timerMapRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // 记录每个 designId 的重试次数
  const retryCountMapRef = useRef<Record<string, number>>({});

  const clearTimer = useCallback((designId: string) => {
    const t = timerMapRef.current[designId];
    if (t) {
      clearTimeout(t);
      delete timerMapRef.current[designId];
    }
  }, []);

  const cancelRequest = useCallback((designId: string) => {
    const token = cancelTokenMapRef.current[designId];
    if (token) {
      token.cancel("cancelled");
      delete cancelTokenMapRef.current[designId];
    }
  }, []);

  const cleanupAll = useCallback(() => {
    console.log('清理所有轮询资源:', cancelTokenMapRef.current, timerMapRef.current);
    Object.keys(timerMapRef.current).forEach((id) => clearTimer(id));
    Object.keys(cancelTokenMapRef.current).forEach((id) => cancelRequest(id));
    // 清理重试计数
    retryCountMapRef.current = {};
    setError(null);
  }, [cancelRequest, clearTimer]);

  useEffect(() => {
    // 组件卸载时清理
    return () => {
      cleanupAll();
    };
  }, [cleanupAll]);

  // 页面隐藏和卸载时也清理，避免后台持续轮询
  useDidHide(() => {
    console.log('did hide cleanupAll')
    cleanupAll();
  });
  useUnload(() => {
    console.log('unload cleanupAll')
    cleanupAll();
  });

  const getDesign = useCallback(
    async ({ designId }: { designId: string; }) => {
      // 同一个 designId：取消旧请求与定时器，避免重复轮询
      clearTimer(designId);
      cancelRequest(designId);
      // 重置重试计数
      retryCountMapRef.current[designId] = 0;
      setError(null);

      const pollOnce = async (): Promise<boolean> => {
        const token = CancelToken.create();
        cancelTokenMapRef.current[designId] = token;

        try {
          const res = await sessionApi.getDesignItem(
              Number(designId),
            {
              cancelToken: token,
              showLoading: false,
              showError: false,
            }
          );
          
          // 重置错误状态和重试计数
          setError(null);
          retryCountMapRef.current[designId] = 0;
          
          if (options?.checkStopPoll ? options?.checkStopPoll?.(res?.data) : res?.data?.progress == 100) {
            setDesign(res?.data);
            clearTimer(designId);
            cancelRequest(designId);
            delete retryCountMapRef.current[designId];
            return true; // 停止轮询
          } else if (!!res?.data?.design_id) {
            // 更新数据
            setDesign(res?.data);
          }
          return false; // 继续轮询
        } catch (error: any) {
          // 如果请求被取消，直接返回停止轮询
          if (error?.message === 'cancelled') {
            return true;
          }
          
          const currentRetryCount = retryCountMapRef.current[designId] || 0;
          retryCountMapRef.current[designId] = currentRetryCount + 1;
          
          console.warn(`设计 ${designId} 轮询失败，重试次数: ${currentRetryCount + 1}`, error);
          setError(`轮询失败: ${error?.message || '未知错误'}`);
          
          // 达到最大重试次数，停止轮询
          if (currentRetryCount >= maxRetries) {
            console.error(`设计 ${designId} 达到最大重试次数，停止轮询`);
            clearTimer(designId);
            cancelRequest(designId);
            delete retryCountMapRef.current[designId];
            return true;
          }
          
          throw error; // 继续抛出错误，让外层处理重试逻辑
        }
      };

      const poll = async () => {
        try {
          const shouldStop = await pollOnce();
          if (!shouldStop) {
            let delay = pollingInterval;
            
            // 指数退避策略
            if (enableBackoff && retryCountMapRef.current[designId] > 0) {
              delay = Math.min(
                pollingInterval * Math.pow(2, retryCountMapRef.current[designId]),
                30000 // 最大延迟30秒
              );
            }
            
            const t = setTimeout(poll, delay);
            timerMapRef.current[designId] = t;
          }
        } catch (error) {
          // 处理轮询错误，使用退避重试
          const currentRetryCount = retryCountMapRef.current[designId] || 0;
          
          if (currentRetryCount < maxRetries) {
            const backoffDelay = enableBackoff 
              ? Math.min(pollingInterval * Math.pow(2, currentRetryCount), 30000)
              : pollingInterval;
            
            console.log(`设计 ${designId} 将在 ${backoffDelay}ms 后重试`);
            const t = setTimeout(poll, backoffDelay);
            timerMapRef.current[designId] = t;
          } else {
            // 达到最大重试次数，完全停止
            console.error(`设计 ${designId} 轮询彻底失败，停止所有重试`);
            clearTimer(designId);
            cancelRequest(designId);
            delete retryCountMapRef.current[designId];
          }
        }
      };

      poll();
    },
    [clearTimer, cancelRequest, pollingInterval, maxRetries, enableBackoff, options]
  );

  return { 
    design, 
    getDesign, 
    cleanupAll,
    error, // 暴露错误状态
    isPolling: Object.keys(timerMapRef.current).length > 0 // 是否正在轮询
  };
};