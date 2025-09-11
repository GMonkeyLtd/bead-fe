import React, { useState, useEffect } from "react";
import { View, Text, Image } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import BraceletList from "@/components/BraceletList";
import CrystalContainer from "@/components/CrystalContainer";
import UserInfoCard from "@/components/UserInfoCard";
import rightArrow from "@/assets/icons/right-arrow.svg";
import TabBar from "@/components/TabBar";
import { userApi, User } from "@/utils/api";
import sessionApi from "@/utils/api-session";
import MyWorkIcon from "@/assets/icons/my-work.svg";
import shoppingOrderIcon from "@/assets/icons/shopping-order.svg";
import { pageUrls } from "@/config/page-urls";
import { usePollDesign } from "@/hooks/usePollDesign";
import styles from "./index.module.scss";
import LoadingIcon from "@/components/LoadingIcon";
import CrystalButton from "@/components/CrystalButton";

const UserCenterPage: React.FC = () => {
  const [designList, setDesignList] = useState<any[]>([]);
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [curTab, setCurTab] = useState<"myWork" | "myPublish">("myWork");

  const { design, getDesign } = usePollDesign({ pollingInterval: 10000 });

  useEffect(() => {
    if (design?.design_id && design.image_url) {
      setDesignList((prev) =>
        prev.map((item) =>
          item.id === design.design_id
            ? { ...item, progress: 100, image: design.image_url }
            : item
        )
      );
    }
  }, [design]);

  const initPageData = async () => {
    setLoading(true);
    const userInfoRes = await userApi.getUserInfo({ showLoading: true });
    setUserInfo(userInfoRes?.data);
    const historyRes = await sessionApi.getDesignList({
      showLoading: true,
    });
    const designs = (historyRes?.data?.designs || []).map((item) => {
      if (!item.image_url) {
        getDesign({
          designId: item.design_id,
        });
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
    setLoading(false);
  };

  useDidShow(() => {
    initPageData();
  });

  const handleItemClick = (item: any) => {
    if (loading) return;
    Taro.navigateTo({
      url: `${pageUrls.result}?designBackendId=${item.id}&showBack=true`,
    });
  };

  const handleOrdersClick = () => {
    if (loading) return;
    Taro.navigateTo({
      url: pageUrls.orderList,
    });
  };

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
            <View className={`${styles.myAssetsTabItem} ${curTab === "myWork" ? styles.tabActive : ""}`} onClick={() => setCurTab("myWork")}>
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
            <View className={`${styles.myAssetsTabItem} ${curTab === "myPublish" ? styles.tabActive : ""}`} onClick={() => setCurTab("myPublish")}>
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
        {curTab === "myWork" && designList.length > 0 && (
          <View className={styles.imageHistoryContainer}>
            <BraceletList items={designList} onItemClick={handleItemClick} />
          </View>
        )}
        {/* {loading && (
          <View className={styles.loadingContainer}>
            <LoadingIcon />
          </View>
        )} */}
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
