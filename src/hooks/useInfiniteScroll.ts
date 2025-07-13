import { useState, useEffect, useCallback } from 'react';
import Taro from '@tarojs/taro';

interface UseInfiniteScrollOptions<T> {
  initialPage?: number;
  pageSize?: number;
  fetchData: (page: number, pageSize: number) => Promise<{
    data: T[];
    hasMore: boolean;
    total?: number;
  }>;
  threshold?: number; // 距离底部多少像素时开始加载
  enabled?: boolean; // 是否启用无限滚动
  scrollRef?: React.RefObject<any>;
}

interface UseInfiniteScrollResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  loadMore: () => void;
  refresh: () => void;
  resetData: () => void;
}

export function useInfiniteScroll<T = any>({
  initialPage = 1,
  pageSize = 10,
  fetchData,
  threshold = 100,
  enabled = true,
  scrollRef,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(initialPage);

  // 加载数据
  const loadData = useCallback(async (pageNum: number, isRefresh = false) => {
    if (loading || (!hasMore && !isRefresh)) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchData(pageNum, pageSize);
      
      if (isRefresh) {
        setData(result.data);
      } else {
        setData(prev => [...prev, ...result.data]);
      }
      console.log(result, 'result')
      setHasMore(result.hasMore);
      
      if (result.hasMore) {
        setPage(pageNum + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [fetchData, pageSize, loading, hasMore]);

  // 加载更多
  const loadMore = useCallback(() => {
    if (!loading && hasMore && enabled) {
      loadData(page);
    }
  }, [page, loading, hasMore, enabled, loadData]);

  // 刷新数据
  const refresh = useCallback(() => {
    setPage(initialPage);
    setHasMore(true);
    loadData(initialPage, true);
  }, [initialPage, loadData]);

  // 重置数据
  const resetData = useCallback(() => {
    setData([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
  }, [initialPage]);

  // 监听滚动事件
  useEffect(() => {
    if (!enabled) return;

    let throttleTimer: NodeJS.Timeout;
    
    const handleScroll = () => {
      // 防抖处理
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
      console.log("handleScroll");
      
      throttleTimer = setTimeout(() => {
        // 获取页面滚动信息
        Taro.createSelectorQuery()
          .select(scrollRef?.current)
          .scrollOffset()
          .exec((res) => {
            if (res && res[0]) {
              const { scrollTop, scrollHeight } = res[0];
              const systemInfo = Taro.getSystemInfoSync();
              const clientHeight = systemInfo.windowHeight;
              if (scrollHeight - scrollTop - clientHeight < threshold) {
                loadMore();
              }
            }
          });
      }, 100);
    };

    // 在小程序中使用 onPageScroll
    if (process.env.TARO_ENV === 'weapp') {
      const pages = Taro.getCurrentPages();
      const currentPage = pages[pages.length - 1];
      
      if (currentPage) {
        const originalOnPageScroll = currentPage.onPageScroll;
        currentPage.onPageScroll = (e) => {
          if (originalOnPageScroll) {
            originalOnPageScroll(e);
          }
          handleScroll();
        };
      }
    } else {
      // 在 H5 等其他环境中使用 window scroll 事件
      const handleH5Scroll = () => {
        if (throttleTimer) {
          clearTimeout(throttleTimer);
        }
        
        throttleTimer = setTimeout(() => {
          const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
          
          if (scrollHeight - scrollTop - clientHeight < threshold) {
            loadMore();
          }
        }, 100);
      };
      
      window.addEventListener('scroll', handleH5Scroll);
      return () => {
        window.removeEventListener('scroll', handleH5Scroll);
        if (throttleTimer) {
          clearTimeout(throttleTimer);
        }
      };
    }

    return () => {
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
    };
  }, [enabled, threshold, loadMore, scrollRef]);


  return {
    data,
    loading,
    error,
    hasMore,
    page,
    loadMore,
    refresh,
    resetData,
  };
} 