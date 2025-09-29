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
  updateData: (newData: T[]) => void;
}

export function usePageQuery<T = any>({
  initialPage = 1,
  pageSize = 10,
  fetchData,
  enabled = true,
  queryItem,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(initialPage);
  const isLoadingRef = useRef(false);
  const pageRef = useRef(initialPage); // 添加pageRef来同步跟踪当前页码

  // 加载数据
  const loadData = useCallback(async (pageNum: number, isRefresh = false) => {
    if (isLoadingRef.current || (!hasMore && !isRefresh)) return;

    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    console.log('loadData');
    try {
      const result = await fetchData(pageNum, pageSize);
      setLoading(false);
      isLoadingRef.current = false;
      
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
      setLoading(false);
      isLoadingRef.current = false;
    } 
  }, [fetchData, pageSize]); // 移除hasMore依赖，避免不必要的重新创建

  // 加载更多
  const loadMore = useCallback(() => {
    console.log(isLoadingRef.current, 'isLoadingRef.current');
    console.log(hasMore, 'hasMore');
    console.log(enabled, 'enabled');
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

  const updateData = useCallback((newData: T[]) => {
    setData(newData);
  }, []);

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
    updateData
  };
} 