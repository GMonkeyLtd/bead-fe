import { useCallback, useEffect, useRef, useState } from "react";
import { CancelToken } from "@/utils/request";
import sessionApi, { TDesign } from "@/utils/api-session";
import Taro, { useDidHide, useUnload } from "@tarojs/taro";


interface UsePollDesignOptions {
  pollingInterval?: number; // ms
}

export const usePollDesign = (options?: UsePollDesignOptions) => {
  const pollingInterval = options?.pollingInterval ?? 5000;

  const [design, setDesign] = useState<TDesign | null>(null);

  // 每个 designId 对应一个 cancelToken 与 定时器
  const cancelTokenMapRef = useRef<Record<string, CancelToken>>({});
  const timerMapRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

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
    console.log(cancelTokenMapRef.current, timerMapRef.current)
    Object.keys(timerMapRef.current).forEach((id) => clearTimer(id));
    Object.keys(cancelTokenMapRef.current).forEach((id) => cancelRequest(id));
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
      console.log('getDesign', designId)
      // 同一个 designId：取消旧请求与定时器，避免重复轮询
      clearTimer(designId);
      cancelRequest(designId);

      const pollOnce = async (): Promise<boolean> => {
        const token = CancelToken.create();
        cancelTokenMapRef.current[designId] = token;

        const res = await sessionApi.getDesignItem(
            Number(designId),
          {
            cancelToken: token,
            showLoading: false,
            showError: false,
          }
        );

        if (res?.data?.image_url) {
          setDesign(res?.data);
          clearTimer(designId);
          cancelRequest(designId);
          return true; // 停止轮询
        }
        return false; // 继续轮询
      };

      const poll = async () => {
        try {
          const shouldStop = await pollOnce();
          if (!shouldStop) {
            const t = setTimeout(poll, pollingInterval);
            timerMapRef.current[designId] = t;
          }
        } catch (error) {
          // 若失败，不再继续
          clearTimer(designId);
          cancelRequest(designId);
        }
      };

      poll();
    },
    [clearTimer, cancelRequest, pollingInterval]
  );

  return { design, getDesign, cleanupAll: cleanupAll };
};