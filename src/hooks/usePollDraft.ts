import { showModal } from '@tarojs/taro';
import { useState, useEffect, useCallback, useRef } from "react";
import apiSession, {
  CreateSessionResponse,
  DesignDraftResponse,
  BeadItem,
  MessageItem,
} from "../utils/api-session";

export interface DraftData {
  session_id: string;
  draft_id: string;
  user_id: number;
  progress: number;
  wuxing: string[];
  wishes: string[];
  size: number;
  name: string;
  beads: BeadItem[];
  created_at: string;
  updated_at: string;
  design_id?: string;
  bracelet_image?: string;
}

export const usePollDraft = ({ pollingInterval = 2000, maxRetries = 2, showLoading = false }) => {
  const [draft, setDraft] = useState<DraftData | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const retryCountRef = useRef(0);


  // 轮询设计稿进度
  const startPolling = useCallback(
    async (sessionId: string, draftId: string) => {
      setIsPolling(true);
      retryCountRef.current = 0;

      const pollDraft = async () => {
        try {
          const response = (await apiSession.getDesignDraft(
            {
              session_id: sessionId,
              draft_id: draftId,
            },
            { showError: false, showLoading }
          )) as DesignDraftResponse;

          if (response.code === 200 && response.data) {
            const draftData = response.data;


            if (draftData.progress === 100) {
              // 设计稿完成
              setDraft(draftData);
              setIsPolling(false);
              return true; // 停止轮询
            } else {
              // 设计稿未完成，更新进度
              setDraft(draftData);
              return false; // 继续轮询
            }
          }
        } catch (error: any) {
          console.error("轮询设计稿出错:", error);
          retryCountRef.current += 1;

          if (retryCountRef.current >= maxRetries) {
            setIsPolling(false);
            setError(`轮询失败，已重试${maxRetries}次`);
            return true; // 停止轮询
          }

          return false; // 继续轮询
        }
      };

      // 开始轮询
      const poll = async () => {
        const shouldStop = await pollDraft();
        if (!shouldStop) {
          setTimeout(poll, pollingInterval);
        }
      };

      poll();
    },
    [pollingInterval, maxRetries]
  );

  // 停止轮询
  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  // 重新开始轮询
  const retryPolling = useCallback((sessionId: string, draftId: string) => {
    startPolling(sessionId, draftId);
  }, [startPolling]);

  const updateDraft = useCallback((draft: DesignDraftResponse["data"]) => {
    setDraft(draft);
  }, []);

  return {
    draft,
    isPolling,
    error,
    startPolling,
    stopPolling,
    retryPolling,
    updateDraft,
  };
};

