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
  const pageRef = useRef(initialPage); // 添加pageRef来同步跟踪当前页码

  // 加载数据
  const loadData = useCallback(async (pageNum: number, isRefresh = false) => {
    if (isLoadingRef.current || (!hasMore && !isRefresh)) return;
    console.log('loadData', isLoadingRef.current, !hasMore, isRefresh)

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
        const nextPage = pageNum + 1;
        setPage(nextPage);
        pageRef.current = nextPage; // 同步更新pageRef
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [fetchData, pageSize]); // 移除hasMore依赖，避免不必要的重新创建

  // 加载更多
  const loadMore = useCallback(() => {
    console.log(!isLoadingRef.current, hasMore, enabled, pageRef.current, 'loadMore', listKey) // 使用pageRef.current来打印当前页码
    if (!isLoadingRef.current && hasMore && enabled) {
      loadData(pageRef.current); // 使用pageRef.current确保使用最新页码
    }
  }, [hasMore, enabled, loadData]);

  // 刷新数据
  const refresh = useCallback(() => {
    setPage(initialPage);
    pageRef.current = initialPage; // 同步重置pageRef
    setHasMore(true);
    loadData(initialPage, true);
  }, [initialPage, loadData]);

  // 重置数据
  const resetData = useCallback(() => {
    setData([]);
    setPage(initialPage);
    pageRef.current = initialPage; // 同步重置pageRef
    setHasMore(true);
    setError(null);
  }, [initialPage]);

  const updateItem = useCallback(async(item: T) => {
    const resData = await queryItem(item);

      if (resData) {
        const newData = data.map((dataItem) => {
          // 使用类型断言或者检查属性是否存在
          if ((dataItem as any).work_id === (resData as any).work_id) {
            return resData;
          }
          return dataItem;
        })
        setData(newData);
      }
    },
    [data, queryItem]
  );

  // 使用 Intersection Observer 监听指定元素
  // useEffect(() => {
  //   if (!enabled || !selector) return;
  //   console.log(selector, 'selector')

  //   // 清理之前的观察器
  //   if (observerRef.current) {
  //     observerRef.current.disconnect();
  //     observerRef.current = null;
  //   }

  //   // 创建新的 Intersection Observer
  //   const observer = Taro.createIntersectionObserver({}, {
  //     thresholds: [0.1], // 当10%的元素可见时触发
  //   });

  //   console.log(selector, 'selector')
  //   observer.observe(selector, (res) => {
  //     console.log('Intersection Observer triggered:', res);
      
  //     // 当目标元素进入视口时触发加载更多
  //     if ((res.intersectionRatio ?? 0) > 0 && !isLoadingRef.current && hasMore) {
  //       console.log('Loading more data...');
  //       loadMore();
  //     }
  //   });

  //   observerRef.current = observer;

  //   // 清理函数
  //   return () => {
  //     if (observerRef.current) {
  //       observerRef.current.disconnect();
  //       observerRef.current = null;
  //     }
  //   };
  // }, [enabled, selector, rootMargin, hasMore, loadMore]);

  // 组件卸载时清理观察器
  // useEffect(() => {
  //   return () => {
  //     if (observerRef.current) {
  //       observerRef.current.disconnect();
  //       observerRef.current = null;
  //     }
  //   };
  // }, []);

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