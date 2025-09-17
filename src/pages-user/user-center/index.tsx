import React, { useState, useEffect, useCallback } from "react";
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

const UserCenterPage: React.FC = () => {
  const [designList, setDesignList] = useState<any[]>([]);
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [curTab, setCurTab] = useState<"myWork" | "myPublish">("myWork");

  const { design, getDesign, error: pollError, isPolling } = usePollDesign({ 
    pollingInterval: 10000,
    maxRetries: 3,
    enableBackoff: true
  });

  // 优化 design 更新逻辑，避免不必要的重新渲染
  const updateDesignInList = useCallback((designData: typeof design) => {
    if (designData?.design_id && designData.image_url) {
      setDesignList((prev) => {
        const existingItem = prev.find(item => item.id === designData.design_id);
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
    }
  }, []);
  
  useEffect(() => {
    updateDesignInList(design);
  }, [design, updateDesignInList]);

  const initPageData = useCallback(async () => {
    if (loading) return; // 防止重复加载
    
    try {
      setLoading(true);
      
      // 并行加载用户信息和设计列表
      const [userInfoRes, historyRes] = await Promise.all([
        userApi.getUserInfo({ showLoading: false }),
        sessionApi.getDesignList({ showLoading: false })
      ]);
      
      setUserInfo(userInfoRes?.data);
      
      const designs = (historyRes?.data?.designs || []).map((item) => {
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
      
      setDesignList(designs);
    } catch (error) {
      console.error('初始化页面数据失败:', error);
      Taro.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    } finally {
      setLoading(false);
    }
  }, [loading, getDesign]);

  useDidShow(() => {
    initPageData();
  });

  const handleItemClick = useCallback((item: any) => {
    if (loading || isPolling) return;
    Taro.navigateTo({
      url: `${pageUrls.result}?designBackendId=${item.id}&showBack=true`,
    });
  }, [loading, isPolling]);

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
            userName={userInfo?.nick_name?.slice(0, 10) || '--'}
            userSlogan='璞光集，好运气'
            avatar={userInfo?.avatar_url || ''}
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
            </View>
          </View>
        </View>
        <View className={styles.myAssetsContainer}>
          <View className={styles.myAssetsTabsContainer}>
            <View className={`${styles.myAssetsTabItem} ${curTab === "myWork" ? styles.tabActive : ""}`} onClick={() => handleTabChange("myWork")}>
              {curTab === "myWork" && (<Image
                src={MyWorkIcon}
                style={{
                  width: "35px",
                  height: "12px",
                  position: "absolute",
                  bottom: "-6px",
                  right: "-2px",
                }}
              />)}
              我的作品
            </View>
            <View className={`${styles.myAssetsTabItem} ${curTab === "myPublish" ? styles.tabActive : ""}`} onClick={() => handleTabChange("myPublish")}>
              {curTab === "myPublish" && (<Image
                src={MyWorkIcon}
                style={{
                  width: "35px",
                  height: "12px",
                  position: "absolute",
                  bottom: "-6px",
                  right: "-2px",
                }}
              />)}
              我的发布
            </View>
          </View>

          <View className={styles.myOrdersButton} onClick={handleOrdersClick}>
            <Image src={shoppingOrderIcon} style={{ width: "14px", height: "14px" }} />
            <View className={styles.myOrdersButtonText}>
              订单
            </View>
          </View>
        </View>
        {curTab === "myWork" && (
          <View className={styles.imageHistoryContainer}>
            {designList.length > 0 ? (
              <BraceletList items={designList} onItemClick={handleItemClick} />
            ) : (
              <View className={styles.emptyContainer}>
                {loading && <LoadingIcon />}
                <Text className={styles.emptyText}>
                  {loading ? '加载中...' : '暂无作品，快去创作吧～'}
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
            <View className={styles.myPublishText}>
              暂无已发布的作品哦～
            </View>
          </View>
        )}
      </View>
      <TabBar />
    </CrystalContainer>
  );
};

export default UserCenterPage;
