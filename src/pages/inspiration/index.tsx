import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, Image } from "@tarojs/components";
import styles from "./index.module.scss";
import CrystalContainer from "@/components/CrystalContainer";
import LazyImage from "@/components/LazyImage";
import Taro, { useDidShow } from "@tarojs/taro";
import TabBar from "@/components/TabBar";
import { inspirationApi, InspirationResult, userApi } from "@/utils/api";
import { pageUrls } from "@/config/page-urls";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import RightArrowIcon from "@/assets/icons/right-arrow.svg";
import CollectIcon from "@/assets/icons/collect.svg";
import CollectedIcon from "@/assets/icons/collect-active.svg";
import MyWorkIcon from "@/assets/icons/my-work.svg";

interface InspirationItem {
  work_id: string;
  title: string;
  cover_url: string;
  is_collect: boolean;
  design_id: number;
  user: {
    nike_name: string;
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
  // 使用无限滚动 hook
  const {
    data: inspirationList,
    loading,
    error,
    hasMore,
    refresh,
    loadMore,
  } = useInfiniteScroll<InspirationItem>({
    initialPage: 1,
    pageSize: 10,
    fetchData: useCallback(async (page: number, pageSize: number) => {
      try {
        const res = await inspirationApi.getInspirationData({ page, pageSize });
        const result = res as InspirationResult;

        return {
          data: result.data.works || [],
          hasMore: result.data.works.length === pageSize,
          total: result.data.works.length,
        };
      } catch (error) {
        console.error("获取灵感列表失败:", error);
        return {
          data: [],
          hasMore: false,
          total: 0,
        };
      }
    }, []),
    threshold: 100,
    enabled: true,
  });

  // 页面显示时刷新数据
  useDidShow(() => {
    refresh();
  });

  // 处理图片点击
  const handleItemClick = (item: InspirationItem) => {
    Taro.navigateTo({
      url: `${pageUrls.inspirationDetail}?workId=${item.work_id}&designId=${item.design_id}`,
    });
  };

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
          refresh();
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
          refresh();
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

  // 生成序列号（模拟）
  const generateSerialNumber = (index: number) => {
    const num = String(index + 1).padStart(4, "0");
    return `NO.${num}`;
  };

  console.log(inspirationList);

  return (
    <CrystalContainer showBack={false} showHome={false}>
      <View className={styles.inspirationContainer}>
        <View className={styles.tabContainer}>
          {INSPIRATION_TABS.map((tab) => (
            <View
              key={tab.value}
              className={`${styles.tabItem} ${curTab === tab.value ? styles.tabActive : ""}`}
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
        <View className={styles.inspirationList}>
          {inspirationList.map((item, index) => (
            <View
              key={item.work_id}
              className={styles.inspirationItem}
              onClick={() => handleItemClick(item)}
            >
              <View className={styles.imageContainer}>
                {/* <LazyImage
                  src={item.cover_url}
                  className={styles.inspirationImage}
                  mode="aspectFill"
                /> */}
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
                    {/* <LazyImage
                      src={item.user.avatar_url}
                      className={styles.userAvatar}
                      mode="aspectFill"
                    /> */}
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
                      {item.user.nike_name}
                    </Text>
                  </View>

                  {/* 根据收藏数量显示不同内容 */}
                  {item.collects_count > 0 ? (
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
                  ) : (
                    <Text className={styles.serialNumber}>
                      {generateSerialNumber(index)}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* 加载状态 */}
        {loading && (
          <View className={styles.loadingContainer}>
            <View className={styles.loadingSpinner} />
            <Text className={styles.loadingText}>加载中...</Text>
          </View>
        )}

        {/* 错误状态 */}
        {error && (
          <View className={styles.errorContainer}>
            <Text className={styles.errorText}>{error}</Text>
            <View className={styles.retryButton} onClick={refresh}>
              <Text className={styles.retryText}>重试</Text>
            </View>
          </View>
        )}

        {/* 没有更多数据 */}
        {!hasMore && inspirationList.length > 0 && (
          <View className={styles.noMoreContainer}>
            <Text className={styles.noMoreText}>没有更多了</Text>
          </View>
        )}

        {/* 空状态 */}
        {!loading && inspirationList.length === 0 && (
          <View className={styles.emptyContainer}>
            <Text className={styles.emptyText}>暂无灵感作品</Text>
          </View>
        )}
      </View>

      <TabBar />
    </CrystalContainer>
  );
};

export default InspirationPage;
