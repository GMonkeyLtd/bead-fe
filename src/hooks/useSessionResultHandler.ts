import { useState, useEffect, useCallback, useRef } from "react";
import apiSession, {
  CreateSessionResponse,
  DesignDraftResponse,
  BeadItem,
  MessageItem,
} from "../utils/api-session";

export interface SessionResult {
  systemMessages: string[];
  recommends: string[];
  draft:
    | DesignDraftResponse["data"]
    | CreateSessionResponse["data"]["latest_draft"]
    | null;
  topTwoBeads: BeadItem[] | null;
  isPolling: boolean;
  error: string | null;
  design: DesignDraftResponse["data"] | null;
}

export interface UseSessionResultHandlerParams {
  sessionData: CreateSessionResponse["data"] | null;
  pollingInterval?: number; // 轮询间隔，默认2000ms
  maxRetries?: number; // 最大重试次数，默认20次
}

export const useSessionResultHandler = ({
  sessionData,
  pollingInterval = 2000,
  maxRetries = 2,
}: UseSessionResultHandlerParams) => {
  const [result, setResult] = useState<SessionResult>({
    systemMessages: [],
    recommends: [],
    draft: null,
    topTwoBeads: null,
    isPolling: false,
    error: null,
    design: null,
  });

  const retryCountRef = useRef(0);
  // 图片生成次数
  const [imgGenerateCount, setImgGenerateCount] = useState(0);

  // 计算出现频率最高的两个珠子
  const getTopTwoBeads = useCallback(
    (beads: BeadItem[] | any[]): BeadItem[] | null => {
      if (!beads || beads.length === 0) return null;

      // 统计每个珠子ID的出现次数
      const beadCountMap = new Map<
        string | number,
        { count: number; bead: BeadItem }
      >();

      beads.forEach((bead) => {
        const beadId = bead.id || bead.bead_id;
        if (beadCountMap.has(beadId)) {
          beadCountMap.get(beadId)!.count += 1;
        } else {
          beadCountMap.set(beadId, { count: 1, bead });
        }
      });

      // 按出现次数排序并取前两个
      const sortedBeads = Array.from(beadCountMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 2)
        .map((item) => item.bead);

      return sortedBeads;
    },
    []
  );

  // 轮询设计稿进度
  const startPolling = useCallback(
    async (sessionId: string, draftId: string) => {
      setResult((prev) => ({ ...prev, isPolling: true, error: null }));
      retryCountRef.current = 0;

      const pollDraft = async () => {
        try {
          const response = (await apiSession.getDesignDraft(
            {
              session_id: sessionId,
              draft_id: draftId,
            },
            { showError: false }
          )) as DesignDraftResponse;

          if (response.code === 200 && response.data) {
            const draftData = response.data;
            const topTwoBeads = draftData.beads
              ? getTopTwoBeads(draftData.beads)
              : null;

            if (draftData.progress === 100) {
              setImgGenerateCount((prev) => prev + 1);
              // 设计稿完成
              setResult((prev) => ({
                ...prev,
                draft: draftData,
                topTwoBeads,
                isPolling: false,
              }));
              return true; // 停止轮询
            } else {
              // 设计稿未完成，更新进度
              setResult((prev) => ({
                ...prev,
                draft: draftData,
                topTwoBeads,
              }));
              return false; // 继续轮询
            }
          }
        } catch (error: any) {
          console.error("轮询设计稿出错:", error);
          retryCountRef.current += 1;

          if (retryCountRef.current >= maxRetries) {
            setResult((prev) => ({
              ...prev,
              isPolling: false,
              error: `轮询失败，已重试${maxRetries}次`,
            }));
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
    [pollingInterval, maxRetries, getTopTwoBeads]
  );

  // 停止轮询
  const stopPolling = useCallback(() => {
    setResult((prev) => ({ ...prev, isPolling: false }));
  }, []);

  // 重新开始轮询
  const retryPolling = useCallback(() => {
    if (
      sessionData?.latest_draft &&
      sessionData.latest_draft.progress !== 100
    ) {
      startPolling(sessionData.session_id, sessionData.latest_draft.draft_id);
    }
  }, [sessionData, startPolling]);

  // 处理生成内容的函数
  const processSessionData = useCallback(
    (data: CreateSessionResponse["data"]) => {
      // 提取system消息的content
      const systemMessages =
        data.messages
          .filter((msg) => ["system", "assistant"].includes(msg.role))
          ?.map((msg) => msg.content) || [];

      // 提取recommends
      const recommends = data.recommends || [];

      // 检查latest_draft的progress
      const latestDraft = data.latest_draft;
      const latestDesign = data.latest_design;

      // 计算最高频率的两个珠子
      const topTwoBeads = latestDraft?.beads
        ? getTopTwoBeads(latestDraft.beads)
        : null;

      setResult((prev) => ({
        ...prev,
        systemMessages,
        recommends,
        topTwoBeads,
        error: null,
        design: latestDesign,
      }));

      // 如果progress不为100，开始轮询
      if (latestDraft && latestDraft.progress !== 100) {
        setTimeout(() => {
          startPolling(data.session_id, latestDraft.draft_id);
        }, 1000);
      } else if (latestDraft && latestDraft.progress === 100) {
        setResult((prev) => ({
          ...prev,
          draft: latestDraft,
          topTwoBeads,
          isPolling: false,
        }));
      }
    },
    [getTopTwoBeads]
  );

  const updateSessionData = useCallback(
    ({
      newMessage,
      newRecommends,
      sessionId,
      draftId,
    }: {
      newMessage: MessageItem;
      newRecommends: string[];
      sessionId?: string;
      draftId?: string;
    }) => {
      if (sessionId && draftId) {
        setTimeout(() => {
          startPolling(sessionId, draftId);
        }, 1000);
      }
      
      setResult((prev) => {
        const newSystemMessages = newMessage.content ? [...prev.systemMessages, newMessage.content] : prev.systemMessages;
        return {
          ...prev,
          systemMessages: newSystemMessages,
          recommends: newRecommends,
        };
      });
    },
    [startPolling, setResult]
  );

  // 当sessionData改变时处理数据
  useEffect(() => {
    if (sessionData) {
      processSessionData(sessionData);
    }
  }, [sessionData, processSessionData]);

  const resetImgGenerateCount = useCallback(() => {
    // setResult(prev => ({ ...prev, recommends: [] }));
    setImgGenerateCount(0);
  }, []);

  return {
    result,
    imgGenerateCount,
    stopPolling,
    retryPolling,
    topTwoBeads: result.topTwoBeads,
    processSessionData,
    updateSessionData,
    resetImgGenerateCount,
  };
};
