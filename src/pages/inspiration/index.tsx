import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
  useMemo,
} from "react";
import { View, Text, ScrollView, Image } from "@tarojs/components";
import styles from "./index.module.scss";
import CrystalContainer from "@/components/CrystalContainer";
import LazyImage from "@/components/LazyImage";
import Taro, { useDidShow, usePullDownRefresh, useReady } from "@tarojs/taro";
import TabBar from "@/components/TabBar";
import { inspirationApi } from "@/utils/api";
import { pageUrls } from "@/config/page-urls";
import { usePageQuery } from "@/hooks/usePageQuery";
import RightArrowIcon from "@/assets/icons/right-arrow.svg";
import CollectIcon from "@/assets/icons/collect.svg";
import CollectedIcon from "@/assets/icons/collect-active.svg";
import MyWorkIcon from "@/assets/icons/my-work.svg";
import { LimitedTimeTag, PromoText } from "@/components/InspirationTags";
import { getNavBarHeightAndTop } from "@/utils/style-tools";

interface InspirationItem {
  work_id: string;
  title: string;
  cover_url: string;
  is_collect: boolean;
  design_id: number;
  user: {
    nick_name: string;
    avatar_url: string;
  };
  collects_count: number;
  is_limited_time?: boolean; // 是否为限时促销
  final_price: boolean;
  original_price: number;
  reference_price: number;
  cost_price: number;
}

const INSPIRATION_TABS = [
  {
    label: "全部灵感",
    value: "all",
  },
  {
    label: "收藏集",
    value: "collect",
  },
];

const InspirationPage: React.FC = () => {
  const [curTab, setCurTab] = useState<"all" | "collect">("all");
  const { height: navBarHeight } = getNavBarHeightAndTop();
  const {
    data: inspirationList,
    loading,
    error,
    hasMore,
    refresh,
    loadMore,
    updateItem,
  } = usePageQuery<InspirationItem>({
    listKey: "inspirationList",
    initialPage: 1,
    pageSize: 100,
    fetchData: useCallback(async (page: number, pageSize: number) => {
      const res = await inspirationApi.getInspirationData(
        {
          page,
          page_size: pageSize,
        },
        { showLoading: true }
      );
      return {
        data: res.data.works,
        hasMore:
          res.data.works.length + (page - 1) * pageSize < res.data.total_count,
        total: res.data.total_count,
      };
    }, []),
    queryItem: useCallback(async (item: InspirationItem) => {
      const res = await inspirationApi.getInspirationData({
        work_id: item.work_id,
      });
      return res.data.works?.[0] || null;
    }, []),
    selector: "#inspiration-more-tag",
  });
  const {
    data: collectInspirationList,
    loading: collectLoading,
    error: collectError,
    hasMore: collectHasMore,
    refresh: collectRefresh,
    loadMore: collectLoadMore,
    updateItem: collectUpdateItem,
  } = usePageQuery<InspirationItem>({
    listKey: "collectInspirationList",
    initialPage: 1,
    pageSize: 100,
    fetchData: useCallback(async (page: number, pageSize: number) => {
      const res = await inspirationApi.getCollectInspiration(
        {
          page,
          pageSize: pageSize,
        },
        { showLoading: true }
      );
      return {
        data: res.data.works,
        hasMore:
          res.data.works.length + (page - 1) * pageSize < res.data.total_count,
        total: res.data.total_count,
      };
    }, []),
    queryItem: useCallback(async (item: InspirationItem) => {
      const res = await inspirationApi.getInspirationData({
        work_id: item.work_id,
      });
      return res.data.works?.[0] || null;
    }, []),
    selector: "#inspiration-more-tag", // 添加 selector 参数
  });

  const showData = useMemo(() => {
    if (curTab === "all") {
      inspirationList[0] && (inspirationList[0].is_limited_time = true);
      return inspirationList.map(item => ({ ...item, cover_url: 'https://zhuluoji.cn-sh2.ufileos.com/designs/79.webp' }));
    } else {
      return collectInspirationList;
    }
  }, [curTab, collectInspirationList, inspirationList]);

  // 页面显示时刷新数据
  usePullDownRefresh(() => {
    if (curTab === "all") {
      refresh();
    } else {
      collectRefresh();
    }
  });

  // tab 切换时加载对应数据
  useEffect(() => {
    if (curTab === "collect") {
      // 如果是收藏列表且数据为空，则加载数据
      if (collectInspirationList.length === 0) {
        collectRefresh();
      }
    }
  }, [curTab, collectInspirationList.length, collectRefresh]);

  // 处理图片点击
  const handleItemClick = (item: InspirationItem) => {
    Taro.navigateTo({
      url: `${pageUrls.inspirationDetail}?workId=${item.work_id}&designId=${item.design_id}`,
    });
  };

  useDidShow(() => {
    if (curTab === "all") {
      refresh();
    } else {
      collectRefresh();
    }
  });

  // 处理收藏点击
  const handleCollectClick = (item: InspirationItem, e: any) => {
    e.stopPropagation();
    // TODO: 实现收藏功能
    if (item.is_collect) {
      inspirationApi
        .cancelCollectInspiration({ work_id: item.work_id })
        .then(() => {
          Taro.showToast({
            title: "取消收藏成功",
            icon: "success",
          });
          // 同时更新两个列表中的数据
          updateItem(item);
          collectUpdateItem(item);
        })
        .catch((err) => {
          Taro.showToast({
            title: "取消收藏失败",
            icon: "none",
          });
        });
    } else {
      inspirationApi
        .collectInspiration({ work_id: item.work_id })
        .then(() => {
          Taro.showToast({
            title: "收藏成功",
            icon: "success",
          });
          // 同时更新两个列表中的数据
          updateItem(item);
          collectUpdateItem(item);
        })
        .catch((err) => {
          Taro.showToast({
            title: "收藏失败",
            icon: "none",
          });
        });
    }
  };

  // 格式化收藏数量
  const formatCollectCount = (count: number) => {
    if (count >= 10000) {
      return `${(count / 10000).toFixed(1)}万`;
    }
    return count.toString();
  };

  // 使用 IntersectionObserver 监听元素进入视口
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

    const targetId =
      curTab === "all" ? "inspiration-more-tag" : "collect-more-tag";

    // 优先使用 IntersectionObserver
    if (typeof IntersectionObserver !== "undefined") {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              if (curTab === "all" && hasMore) {
                loadMore();
              } else if (curTab === "collect" && collectHasMore) {
                collectLoadMore();
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
  }, [curTab, hasMore, collectHasMore, loadMore, collectLoadMore]);

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
                  if (curTab === "all" && hasMore) {
                    loadMore();
                  } else if (curTab === "collect" && collectHasMore) {
                    collectLoadMore();
                  }
                }
              } catch (error) {
                console.warn("Failed to get window info:", error);
                const fallbackHeight = 667;
                if (rect.top < fallbackHeight && rect.bottom > 0) {
                  if (curTab === "all" && hasMore) {
                    loadMore();
                  } else if (curTab === "collect" && collectHasMore) {
                    collectLoadMore();
                  }
                }
              }
            }
          });
      };

      fallbackIntervalRef.current = setInterval(checkElementStatus, 500); // 降级方案使用较低频率
    },
    [curTab, hasMore, collectHasMore, loadMore, collectLoadMore]
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

  return (
    <CrystalContainer showBack={false} showHome={false}>
      <View className={styles.inspirationContainer}>
        <View className={styles.tabContainer}>
          {INSPIRATION_TABS.map((tab) => (
            <View
              key={tab.value}
              className={`${styles.tabItem} ${curTab === tab.value ? styles.tabActive : ""
                }`}
              onClick={() => setCurTab(tab.value as "all" | "collect")}
            >
              {curTab === tab.value && (
                <Image
                  src={MyWorkIcon}
                  style={{
                    width: "100%",
                    height: "12px",
                    position: "absolute",
                    bottom: "-6px",
                    left: "12px",
                  }}
                />
              )}
              <Text className={styles.tabLabel}>{tab.label}</Text>
            </View>
          ))}
        </View>
        <View
          style={{
            height: `calc(100vh - ${navBarHeight + 120}px)`,
            boxSizing: "border-box",
            paddingBottom: "140px",
            overflowY: "auto",
          }}
        >
          <View className={styles.inspirationList}>
            {showData.map((item, index) => (
              <View
                key={`work_${item.work_id}`}
                className={styles.inspirationItem}
                onClick={() => handleItemClick(item)}
              >
                <View className={styles.imageContainer}>
                  <Image
                    src={item.cover_url}
                    className={styles.inspirationImage}
                    mode="aspectFill"
                    lazyLoad
                  />
                  {item?.is_limited_time && 
                    <View className={styles.limitedTimeTagContainer}>
                      <LimitedTimeTag text="限时" type="limited" />
                    </View>
                  }
                </View>

                <View className={styles.itemInfo}>
                  <View className={styles.authorInfoContainer}>
                    <View className={styles.authorInfo}>
                      <View className={styles.authorProfile}>
                        <Image
                          src={item.user.avatar_url}
                          className={styles.authorAvatar}
                          mode="aspectFill"
                          lazyLoad
                        />
                        <Text className={styles.authorName}>{item.user.nick_name}</Text>
                      </View>
                      <View className={styles.separator}></View>
                      <Text className={styles.tagText}>水金火</Text>
                    </View>
                  </View>
                  {/* 促销标语 */}
                  {item?.is_limited_time && (
                    <PromoText 
                      text="同款制作，每日前20名享" 
                      discountText="9折"
                      className={styles.promoTextContainer}
                    />
                  )}
                  
                  <View className={styles.titleSection}>
                    <Text className={styles.itemTitle}>{item.title}</Text>
                  </View>

                  <View className={styles.priceSection}>
                    <View className={styles.priceContainer}>
                      <Text className={styles.pricePrefix}>¥</Text>
                      <Text className={styles.currentPrice}>{item.final_price}</Text>
                      <Text className={styles.originalPrice}>{item.original_price}</Text>
                    </View>
                  </View>

                  <View className={styles.userSection}>

                    <View
                      className={styles.collectSection}
                      onClick={(e) => handleCollectClick(item, e)}
                    >
                      <Image
                        src={item.is_collect ? CollectedIcon : CollectIcon}
                        style={{ width: "16px", height: "16px" }}
                      />
                      <Text className={styles.collectCountMain}>
                        {formatCollectCount(item.collects_count)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
            {/* )} */}
          </View>
          {/* {!hasMore && showData.length > 0 && ( */}
          <View
            className={styles.noMoreContainer}
            id={curTab === "all" ? "inspiration-more-tag" : "collect-more-tag"}
          >
            {loading || collectLoading ? (
              <Text className={styles.noMoreText}>
                {curTab === "all" ? "加载中..." : "加载中..."}
              </Text>
            ) : (
              <Text className={styles.noMoreText}>
                {curTab === "collect" && showData?.length === 0
                  ? "暂无收藏设计"
                  : "暂时就这些啦～记得常来看看新内容哦"}
              </Text>
            )}
          </View>
          {/* 没有更多数据 */}
        </View>

        {/* 加载状态 */}
        {(curTab === "all" ? loading : collectLoading) && (
          <View className={styles.loadingContainer}>
            <View className={styles.loadingSpinner} />
            <Text className={styles.loadingText}>加载中...</Text>
          </View>
        )}

        {/* 错误状态 */}
        {(curTab === "all" ? error : collectError) && (
          <View className={styles.errorContainer}>
            <Text className={styles.errorText}>
              {curTab === "all" ? error : collectError}
            </Text>
            <View
              className={styles.retryButton}
              onClick={curTab === "all" ? refresh : collectRefresh}
            >
              <Text className={styles.retryText}>重试</Text>
            </View>
          </View>
        )}

        {/* 空状态 */}
        {!(curTab === "all" ? loading : collectLoading) &&
          showData.length === 0 && (
            <View className={styles.emptyContainer}>
              <Text className={styles.emptyText}>
                {curTab === "all" ? "暂无灵感作品" : "暂无收藏作品"}
              </Text>
            </View>
          )}
      </View>

      <TabBar />
    </CrystalContainer>
  );
};

export default InspirationPage;
