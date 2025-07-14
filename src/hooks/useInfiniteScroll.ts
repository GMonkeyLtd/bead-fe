import { useState, useEffect, useCallback, useRef } from 'react';
import Taro from '@tarojs/taro';

interface UseInfiniteScrollOptions<T> {
  listKey: string;
  initialPage?: number;
  pageSize?: number;
  fetchData: (page: number, pageSize: number) => Promise<{
    data: T[];
    hasMore: boolean;
    total?: number;
  }>;
  threshold?: number; // 距离底部多少像素时开始加载
  enabled?: boolean; // 是否启用无限滚动
  queryItem: (item: T) => Promise<T>;
  selector?: string; // 监听的触发元素选择器
  rootMargin?: string; // 触发区域的边距，如 '50px' 表示提前50px触发
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
  updateItem: (item: T) => void;
}

export function useInfiniteScroll<T = any>({
  listKey,
  initialPage = 1,
  pageSize = 10,
  fetchData,
  threshold = 100,
  enabled = true,
  selector,
  rootMargin = '50px',
  queryItem,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(initialPage);
  const observerRef = useRef<any>(null);
  const isLoadingRef = useRef(false);

  // 加载数据
  const loadData = useCallback(async (pageNum: number, isRefresh = false) => {
    if (isLoadingRef.current || (!hasMore && !isRefresh)) return;

    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await fetchData(pageNum, pageSize);
      
      if (isRefresh) {
        setData(result.data);
      } else {
        setData(prev => [...prev, ...result.data]);
      }
      setHasMore(result.hasMore);
      
      if (result.hasMore) {
        setPage(pageNum + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [fetchData, pageSize, hasMore]);

  // 加载更多
  const loadMore = useCallback(() => {
    if (!isLoadingRef.current && hasMore && enabled) {
      loadData(page);
    }
  }, [page, hasMore, enabled, loadData]);

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

  const updateItem = useCallback(async(item: T) => {
    const resData = await queryItem(item);

      if (resData) {
        const newData = data.map((item) => {
          if (item.work_id === resData.work_id) {
            return resData;
          }
          return item;
        })
        setData(newData);
      }
    },
    [data, queryItem]
  );

  // 使用 Intersection Observer 监听指定元素
  useEffect(() => {
    console.log(selector, enabled, 'selector')
    if (!enabled || !selector) return;
    console.log(selector, 'selector')

    // 清理之前的观察器
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    // 创建新的 Intersection Observer
    const observer = Taro.createIntersectionObserver({}, {
      thresholds: [0.1], // 当10%的元素可见时触发
    });

    console.log(selector, 'selector')
    observer.observe(selector, (res) => {
      console.log('Intersection Observer triggered:', res);
      
      // 当目标元素进入视口时触发加载更多
      if ((res.intersectionRatio ?? 0) > 0 && !isLoadingRef.current && hasMore) {
        console.log('Loading more data...');
        loadMore();
      }
    });

    observerRef.current = observer;

    // 清理函数
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [enabled, selector, rootMargin, hasMore, loadMore]);

  // 组件卸载时清理观察器
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    hasMore,
    page,
    loadMore,
    refresh,
    resetData,
    updateItem,
  };
} 