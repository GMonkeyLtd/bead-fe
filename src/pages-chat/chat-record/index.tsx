import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, ScrollView } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import styles from "./index.module.scss";
import ArchiveCard, { ArchiveItem } from "@/components/ArchiveCard";
import apiSession, { SessionItem } from "@/utils/api-session";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { SessionResult } from "@/hooks/useSessionResultHandler";
import PageContainer from "@/components/PageContainer";
import { getNavBarHeightAndTop } from "@/utils/style-tools";

const ChatRecord: React.FC = () => {
  const [archives, setArchives] = useState<ArchiveItem[]>([]);
  const { height: navBarHeight } = getNavBarHeightAndTop();


  const {
    data: records,
    loading,
    error,
    hasMore,
    refresh,
    loadMore,
    updateItem,
  } = useInfiniteScroll<SessionResult[]>({
    listKey: "sessionList",
    initialPage: 1,
    pageSize: 10,
    fetchData: useCallback(async (page: number, pageSize: number) => {
      const res = await apiSession.getSessionList(
        {
          page,
          page_size: pageSize,
        },
        { showLoading: true }
      );
      return {
        data: res.data.sessions,
        hasMore:
          res.data.sessions.length + (page - 1) * pageSize < res.data.total,
        total: res.data.total,
      };
    }, []),
    queryItem: useCallback(async (item: SessionResult) => {
      const res = await apiSession.getSessionDetail({
        session_id: item.session_id,
      });
      return res.data || null;
    }, []),
    selector: "#inspiration-more-tag",
  });

  useEffect(() => {
    const newArchives = (records || []).map(
      (item: SessionItem, index: number) => {
        const { session_id, title, message_count, created_at, birth } = item;
        return {
          id: session_id,
          name: title,
          designCount: message_count,
          gender: birth.gender === 0 ? "女生" : "男生",
          birthDate: `${birth.year}年${birth.month}月${birth.day}日`,
          birthTime: `${birth.hour}时`,
          isCurrent: index === 0,
        } as ArchiveItem;
      }
    );
    console.log("newArchives", newArchives);
    setArchives(newArchives);
  }, [records]);

  useDidShow(() => {
    refresh();
  });

  const observerRef = useRef<IntersectionObserver | null>(null);
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const setupScrollListener = useCallback(() => {
    // 清理现有的观察器和定时器
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }

    const targetId = "chat-record-more-tag";

    // 优先使用 IntersectionObserver
    if (typeof IntersectionObserver !== "undefined") {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              if (hasMore) {
                loadMore();
              }
            }
          });
        },
        {
          root: null, // 相对于视口
          rootMargin: "100px", // 提前100px开始加载
          threshold: 0.1, // 10%的元素可见时触发
        }
      );

      // 查找目标元素并开始观察
      Taro.createSelectorQuery()
        .select(`#${targetId}`)
        .node()
        .exec((res) => {
          if (res && res[0] && res[0].node && observerRef.current) {
            observerRef.current.observe(res[0].node);
          } else {
            // 如果获取节点失败，使用降级方案
            console.warn("Failed to get target node, using fallback method");
            useFallbackMethod(targetId);
          }
        });
    } else {
      // 降级到定时器方案
      console.warn("IntersectionObserver not supported, using fallback method");
      useFallbackMethod(targetId);
    }
  }, [hasMore, loadMore]);

  // 降级方案：使用定时器轮询
  const useFallbackMethod = useCallback(
    (targetId: string) => {
      const checkElementStatus = () => {
        Taro.createSelectorQuery()
          .select(`#${targetId}`)
          .boundingClientRect()
          .exec((res) => {
            if (res && res[0]) {
              const rect = res[0];
              try {
                const windowInfo = Taro.getWindowInfo();
                if (rect.top < windowInfo.windowHeight && rect.bottom > 0) {
                  if (hasMore) {
                    loadMore();
                  }
                }
              } catch (error) {
                console.warn("Failed to get window info:", error);
                const fallbackHeight = 667;
                if (rect.top < fallbackHeight && rect.bottom > 0) {
                  if (hasMore) {
                    loadMore();
                  }
                }
              }
            }
          });
      };

      fallbackIntervalRef.current = setInterval(checkElementStatus, 500); // 降级方案使用较低频率
    },
    [hasMore, loadMore]
  );

  // 设置滚动监听
  useEffect(() => {
    setupScrollListener();

    return () => {
      // 清理观察器和定时器
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
    };
  }, [setupScrollListener]);

  const handleArchiveClick = (archive: ArchiveItem) => {
    console.log("点击档案:", archive);
    // 这里可以添加跳转到档案详情页面的逻辑
    Taro.showToast({
      title: `选择了档案: ${archive.name}`,
      icon: "none",
    });
  };

  const handleCurrentArchiveClick = (archive: ArchiveItem) => {
    console.log("点击当前档案:", archive);
    // 这里可以添加设置为当前档案的逻辑
    Taro.showToast({
      title: "已设置为当前档案",
      icon: "success",
    });
  };

  const handleSwitchArchiveClick = (archive: ArchiveItem) => {
    console.log("切换档案:", archive);
    // 这里可以添加切换档案的逻辑
    Taro.showToast({
      title: `切换到档案: ${archive.name}`,
      icon: "success",
    });
  };

  const handleDeleteArchiveClick = (archive: ArchiveItem) => {
    console.log("删除档案:", archive);
    // 这里可以添加删除档案的逻辑
    Taro.showModal({
      title: "确认删除",
      content: `确定要删除档案"${archive.name}"吗？`,
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({
            title: "档案已删除",
            icon: "success",
          });
        }
      },
    });
  };

  return (
    <PageContainer
      showHome={false}
      headerExtraContent={"档案管理"}
    >
      <View
        style={{
          height: `calc(100vh - ${navBarHeight + 120}px)`,
          boxSizing: "border-box",
          paddingBottom: "140px",
          overflowY: "auto",
          padding: "16px 20px",
        }}
      >
        <View className={styles.archiveList}>
          {archives.map((archive) => (
            <ArchiveCard
              key={archive.id}
              archive={archive}
              onClick={() => handleArchiveClick(archive)}
              onCurrentClick={() => handleCurrentArchiveClick(archive)}
              onSwitchClick={() => handleSwitchArchiveClick(archive)}
              onDeleteClick={() => handleDeleteArchiveClick(archive)}
              isCurrent={archive.isCurrent}
            />
          ))}
        </View>
        <View
            className={styles.noMoreContainer}
            id={"chat-record-more-tag"}
          >
            {loading ? (
              <Text className={styles.noMoreText}>
                加载中...
              </Text>
            ) : (
              <Text className={styles.noMoreText}>
                暂时就这些啦
              </Text>
            )}
          </View>
      </View>
    </PageContainer>
  );
};

export default ChatRecord;
