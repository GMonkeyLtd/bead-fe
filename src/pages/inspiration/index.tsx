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
import {
    inspirationApi,
} from "@/utils/api";
import { pageUrls } from "@/config/page-urls";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import RightArrowIcon from "@/assets/icons/right-arrow.svg";
import CollectIcon from "@/assets/icons/collect.svg";
import CollectedIcon from "@/assets/icons/collect-active.svg";
import MyWorkIcon from "@/assets/icons/my-work.svg";
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
  const intervalsRef = useRef<any>([]);
  const {
    data: inspirationList,
    loading,
    error,
    hasMore,
    refresh,
    loadMore,
    updateItem,
  } = useInfiniteScroll<InspirationItem>({
    listKey: 'inspirationList',
    initialPage: 1,
    pageSize: 10,
    fetchData: useCallback(async (page: number, pageSize: number) => {
      const res = await inspirationApi.getInspirationData({
        page,
        page_size: pageSize,
      });
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
    selector: '#inspiration-more-tag',
  });
  const {
    data: collectInspirationList,
    loading: collectLoading,
    error: collectError,
    hasMore: collectHasMore,
    refresh: collectRefresh,
    loadMore: collectLoadMore,
    updateItem: collectUpdateItem,
  } = useInfiniteScroll<InspirationItem>({
    listKey: 'collectInspirationList',
    initialPage: 1,
    pageSize: 10,
    fetchData: useCallback(async (page: number, pageSize: number) => {
      const res = await inspirationApi.getCollectInspiration({
        page,
        pageSize: pageSize,
      });
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
    selector: '#inspiration-more-tag', // 添加 selector 参数
  });

  const showData = useMemo(() => {
    if (curTab === "all") {
      return inspirationList;
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


  // 调试函数 - 检查元素状态
  const checkElementStatus = (curTab: string) => {
    Taro.createSelectorQuery()
      .select(curTab === "all" ? "#inspiration-more-tag" : "#collect-more-tag")
      .boundingClientRect()
      .exec((res) => {
        if (res && res[0]) {
          const rect = res[0];
          try {
            // 使用新的 getWindowInfo API 替代已废弃的 getSystemInfoSync
            const windowInfo = Taro.getWindowInfo();
            if (rect.top < windowInfo.windowHeight && rect.bottom > 0) {
              if (curTab === "all") {
                hasMore && loadMore()
              } else {
                collectHasMore && collectLoadMore()
              }
            }
          } catch (error) {
            console.warn('Failed to get window info:', error);
            // 降级使用固定的视口高度
            const fallbackHeight = 667; // iPhone SE 的高度作为默认值
            if (rect.top < fallbackHeight && rect.bottom > 0) {
              if (curTab === "all") {
                hasMore && loadMore()
              } else {
                collectHasMore && collectLoadMore()
              }
            }
          }
        } 
      });
  };

  useEffect(() => {

    const interval = setInterval(() => {
      checkElementStatus(curTab)
    }, 200);
    intervalsRef.current.push(interval);
    return () => {
      intervalsRef.current.forEach((interval: any) => clearInterval(interval));
      intervalsRef.current = [];
    };
  }, [curTab, hasMore, collectHasMore])

  return (
    <CrystalContainer showBack={false} showHome={false}>
      <View className={styles.inspirationContainer}>
        <View className={styles.tabContainer}>
          {INSPIRATION_TABS.map((tab) => (
            <View
              key={tab.value}
              className={`${styles.tabItem} ${
                curTab === tab.value ? styles.tabActive : ""
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
                    bottom: "0px",
                    right: "0px",
                  }}
                />
              )}
              <Text className={styles.tabLabel}>{tab.label}</Text>
            </View>
          ))}

        </View>
        <View
          style={{
            height: `calc(100vh - ${navBarHeight + 220}px)`,
            boxSizing: "border-box",
            paddingBottom: "20px",
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
                </View>

                <View className={styles.itemInfo}>
                  <View className={styles.titleSection}>
                    <Text className={styles.itemTitle}>{item.title}</Text>
                    <Image
                      src={RightArrowIcon}
                      style={{ width: "16px", height: "10px" }}
                      mode="aspectFill"
                    />
                  </View>

                  <View className={styles.userSection}>
                    <View className={styles.userInfo}>
                      <Image
                        src={item.user.avatar_url}
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          border: "1px solid #ffffff",
                        }}
                        mode="aspectFill"
                        lazyLoad
                      />
                      <Text className={styles.userName}>
                        {item.user.nick_name}
                      </Text>
                    </View>

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
          <View className={styles.noMoreContainer} id={curTab === "all" ? "inspiration-more-tag" : "collect-more-tag"}>
            <Text className={styles.noMoreText}>没有更多了</Text>
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
            <Text className={styles.errorText}>{curTab === "all" ? error : collectError}</Text>
            <View className={styles.retryButton} onClick={curTab === "all" ? refresh : collectRefresh}>
              <Text className={styles.retryText}>重试</Text>
            </View>
          </View>
        )}

        {/* 空状态 */}
        {!(curTab === "all" ? loading : collectLoading) && showData.length === 0 && (
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
