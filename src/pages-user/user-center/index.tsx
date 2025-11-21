import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, Image } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import BraceletList from "@/components/BraceletList";
import CrystalContainer from "@/components/CrystalContainer";
import UserInfoCard from "@/components/UserInfoCard";
import TabBar from "@/components/TabBar";
import { userApi, User } from "@/utils/api";
import sessionApi from "@/utils/api-session";
import MyWorkIcon from "@/assets/icons/my-work.svg";
import shoppingOrderIcon from "@/assets/icons/shopping-order.svg";
import { pageUrls } from "@/config/page-urls";
import { usePollDesign } from "@/hooks/usePollDesign";
import styles from "./index.module.scss";
import CrystalButton from "@/components/CrystalButton";
import LoadingIcon from "@/components/LoadingIcon";
import { usePageQuery } from "@/hooks/usePageQuery";
import payApi from "@/utils/api-pay";

const UserCenterPage: React.FC = () => {
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [curTab, setCurTab] = useState<"myWork" | "myPublish">("myWork");
  const [totalInvites, setTotalInvites] = useState(0);

  const {
    design,
    getDesign,
    error: pollError,
    isPolling,
  } = usePollDesign({
    pollingInterval: 10000,
    maxRetries: 3,
    enableBackoff: true,
  });

  // 使用无限滚动hook获取sku列表
  const {
    loading: designLoading,
    data: designList,
    hasMore: designHasMore,
    refresh: refreshDesigns,
    loadMore: loadMoreDesigns,
    updateData: updateDesignList,
  } = usePageQuery<any>({
    listKey: "designList",
    initialPage: 0,
    pageSize: 40,
    fetchData: useCallback(async (page: number, pageSize: number) => {
      const res = await sessionApi.getDesignList(
        { offset: page * pageSize, limit: pageSize },
        { showLoading: false }
      );
      console.log(res, "res");
      const resData = ((res as any)?.data?.designs || []).map((item) => {
        // 延迟启动轮询，避免同时发起太多请求
        if (!item.image_url) {
          setTimeout(() => {
            getDesign({
              designId: item.design_id,
            });
          }, Math.random() * 1000); // 随机延迟 0-1秒
        }

        return {
          id: item.design_id,
          progress: item.progress,
          name: item.info.name,
          image: item.image_url,
          draftUrl: item.draft_url,
          backgroundUrl: item.background_url,
          sessionId: item.session_id,
          draftId: item.draft_id,
        };
      });
      const totalCount = (res as any)?.data?.total || 0;
      return {
        data: resData,
        hasMore: resData.length + page * pageSize < totalCount,
        total: totalCount,
      };
    }, []),
    queryItem: useCallback(async (item: any) => {
      // 这里可以根据需要实现单个item的查询逻辑
      return item;
    }, []),
    enabled: true,
  });

  // useEffect(() => {
  //   if (designHasMore) {
  //     loadMoreDesigns();
  //   }
  // }, [designHasMore, designList]);

  // 优化 design 更新逻辑，避免不必要的重新渲染
  const updateDesignInList = useCallback((designData: typeof design) => {
    if (designData?.design_id && designData.image_url) {
      const newDesignList = designList.map((prev) => {
        const existingItem = prev.find(
          (item) => item.id === designData.design_id
        );
        // 只有当图片 URL 发生变化时才更新
        if (existingItem && existingItem.image !== designData.image_url) {
          return prev.map((item) =>
            item.id === designData.design_id
              ? { ...item, progress: 100, image: designData.image_url }
              : item
          );
        }
        return prev;
      });
      updateDesignList(newDesignList);
    }
  }, []);

  useEffect(() => {
    updateDesignInList(design);
    payApi
      .getMyInvites({ showLoading: false })
      .then((res) => {
        setTotalInvites(res?.data?.total_invitees || 0);
      })
      .catch((err) => {
        console.error("获取我的邀请失败:", err);
      });
  }, [design, updateDesignInList]);

  const initPageData = useCallback(async () => {
    if (loading) return; // 防止重复加载

    try {
      setLoading(true);
      // 并行加载用户信息和设计列表
      const userInfoRes = await userApi.getUserInfo({ showLoading: false });
      setUserInfo(userInfoRes?.data);
    } catch (error) {
      console.error("初始化页面数据失败:", error);
      Taro.showToast({
        title: "加载失败，请重试",
        icon: "none",
      });
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useDidShow(() => {
    refreshDesigns();
    initPageData();
  });

  // 使用 IntersectionObserver 监听元素进入视口
  const observerRef = useRef<IntersectionObserver | null>(null);
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRefs = useRef<Set<NodeJS.Timeout>>(new Set());

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

    const targetId = "my-work-more-tag";

    // 优先使用 IntersectionObserver
    if (typeof IntersectionObserver !== "undefined") {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              if (designHasMore) {
                loadMoreDesigns();
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
          // 检查组件是否仍然存在，避免在组件卸载后执行
          if (res && res[0] && res[0].node && observerRef.current) {
            observerRef.current.observe(res[0].node);
          } else if (observerRef.current) {
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
  }, [curTab, designHasMore, loadMoreDesigns]);

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
                  if (designHasMore) {
                    loadMoreDesigns();
                  }
                }
              } catch (error) {
                console.warn("Failed to get window info:", error);
                const fallbackHeight = 667;
                if (rect.top < fallbackHeight && rect.bottom > 0) {
                  if (designHasMore) {
                    loadMoreDesigns();
                  }
                }
              }
            }
          });
      };

      fallbackIntervalRef.current = setInterval(checkElementStatus, 500); // 降级方案使用较低频率
    },
    [curTab, designHasMore, loadMoreDesigns]
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
      // 清理所有未完成的 timeout
      timeoutRefs.current.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      timeoutRefs.current.clear();
    };
  }, [setupScrollListener]);

  const handleItemClick = useCallback(
    (item: any) => {
      // if (loading || isPolling) return;
      Taro.navigateTo({
        url: `${pageUrls.result}?designBackendId=${item.id}&showBack=true`,
      });
    },
    [loading, isPolling]
  );

  const handleOrdersClick = useCallback(() => {
    if (loading) return;
    Taro.navigateTo({
      url: pageUrls.orderList,
    });
  }, [loading]);

  const handleTabChange = useCallback((tab: "myWork" | "myPublish") => {
    setCurTab(tab);
  }, []);

  return (
    <CrystalContainer showBack={false} showHome={false}>
      <View className={styles.pageContent}>
        <View className={styles.pageTopContainer}>
          <UserInfoCard
            userName={userInfo?.nick_name?.slice(0, 10) || "--"}
            userSlogan={`ID: ${userInfo?.user_uuid || ''}`}
            avatar={userInfo?.avatar_url || ""}
            showAction={Boolean((userInfo as any)?.is_merchant)}
            onActionClick={() => {
              Taro.redirectTo({
                url: pageUrls.merchantLogin,
              });
            }}
            onAvatarClick={() => {
              Taro.navigateTo({
                url: pageUrls.modifyUser,
              });
            }}
          />
          {/* 我的收益卡片 */}
          <View className={`${styles.featureCard} ${styles.incomeCard}`}>
            <View className={styles.cardContent}>
              <View className={styles.cardInfo}>
                <View className={styles.cardTitle}>
                  <Text className={styles.titleText}>我的收益</Text>
                </View>
                <View className={styles.cardValue}>
                  <Text className={styles.valueText}>0.00</Text>
                  <Text className={styles.unitText}>元</Text>
                </View>
              </View>
              {totalInvites > 0 ? (
                <View 
                  className={styles.myInvitesContainer}
                  onClick={() => {
                    Taro.navigateTo({
                      url: pageUrls.myInvites,
                    });
                  }}
                >
                  <View className={styles.myInvitesTitle}>{`我的邀请`}</View>
                </View>
              ) : (
                <CrystalButton
                  isPrimary
                  text="提现"
                  onClick={() => {
                    Taro.showToast({
                      title: "无收益可提现",
                      icon: "none",
                    });
                  }}
                  style={{
                    height: "32px",
                    padding: "0 12px",
                  }}
                  textStyle={{
                    fontSize: "12px",
                  }}
                />
              )}
            </View>
          </View>
        </View>
        <View className={styles.myAssetsContainer}>
          <View className={styles.myAssetsTabsContainer}>
            <View
              className={`${styles.myAssetsTabItem} ${
                curTab === "myWork" ? styles.tabActive : ""
              }`}
              onClick={() => handleTabChange("myWork")}
            >
              {curTab === "myWork" && (
                <Image
                  src={MyWorkIcon}
                  style={{
                    width: "35px",
                    height: "12px",
                    position: "absolute",
                    bottom: "-6px",
                    right: "-2px",
                  }}
                />
              )}
              我的作品
            </View>
            <View
              className={`${styles.myAssetsTabItem} ${
                curTab === "myPublish" ? styles.tabActive : ""
              }`}
              onClick={() => handleTabChange("myPublish")}
            >
              {curTab === "myPublish" && (
                <Image
                  src={MyWorkIcon}
                  style={{
                    width: "35px",
                    height: "12px",
                    position: "absolute",
                    bottom: "-6px",
                    right: "-2px",
                  }}
                />
              )}
              我的发布
            </View>
          </View>

          <View className={styles.myOrdersButton} onClick={handleOrdersClick}>
            <Image
              src={shoppingOrderIcon}
              style={{ width: "14px", height: "14px" }}
            />
            <View className={styles.myOrdersButtonText}>订单</View>
          </View>
        </View>
        {curTab === "myWork" && (
          <View className={styles.imageHistoryContainer}>
            {designList.length > 0 ? (
              <View style={{ overflowY: "auto" }}>
                <BraceletList
                  items={designList}
                  onItemClick={handleItemClick}
                />
                {designHasMore && (
                  <View
                    className={styles.emptyText}
                    style={{ marginTop: "8px" }}
                    id="my-work-more-tag"
                  >
                    更多作品加载中...
                  </View>
                )}
              </View>
            ) : (
              <View className={styles.emptyContainer}>
                {designLoading && designList.length === 0 && <LoadingIcon />}
                <Text className={styles.emptyText}>
                  {designLoading ? "加载中..." : "暂无作品，快去创作吧～"}
                </Text>
              </View>
            )}
          </View>
        )}
        {/* 显示轮询错误信息 */}
        {pollError && (
          <View className={styles.errorContainer}>
            <Text className={styles.errorText}>{pollError}</Text>
          </View>
        )}
        {curTab === "myPublish" && (
          <View className={styles.myPublishContainer}>
            <View className={styles.myPublishText}>暂无已发布的作品哦～</View>
          </View>
        )}
      </View>
      <TabBar />
    </CrystalContainer>
  );
};

export default UserCenterPage;
