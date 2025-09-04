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
import { pageUrls } from "@/config/page-urls";
import { DESIGN_PLACEHOLDER_IMAGE_URL } from "@/config";
import { usePollDesign } from "@/hooks/usePollDesign";
import styles from "./index.module.scss";

const UserCenterPage: React.FC = () => {
  const [designList, setDesignList] = useState<any[]>([]);
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

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
      return {
        id: item.design_id,
        progress: item.progress,
        name: item.info.name,
        image: item.image_url,
        sessionId: item.session_id,
        draftId: item.draft_id,
      };
    });

    designs.forEach((item) => {
      if (!item.image) {
        item.image = DESIGN_PLACEHOLDER_IMAGE_URL;
        getDesign({
          designId: item.id,
        });
      }
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
          {userInfo && !loading && (
            <UserInfoCard
              userName={userInfo?.nick_name?.slice(0, 10) || '璞光集用户'}
              userSlogan='璞光集，好运气'
              avatar={userInfo?.avatar_url || ''}
              showAction={Boolean((userInfo as any)?.is_merchant)}
              onActionClick={() => {
                Taro.redirectTo({
                  url: pageUrls.merchantLogin,
                });
              }}
            />
          )}

          {/* 功能卡片区域 */}
          <View className={styles.featureCards}>
            {/* 我的订单和编辑资料卡片容器 */}
            <View className={styles.featureCardsRow}>
              {/* 我的订单卡片 */}
              <View
                className={`${styles.featureCard} ${styles.orderCard}`}
                onClick={handleOrdersClick}
              >
                <View className={styles.cardContent}>
                  <View className={styles.cardInfo}>
                    <View className={styles.cardTitle}>
                      <Text className={styles.titleText}>我的订单</Text>
                    </View>
                  </View>
                  <Image src={rightArrow} style={{ width: "12px", height: "8px" }} />
                </View>
              </View>

              {/* 编辑资料卡片 */}
              <View
                className={`${styles.featureCard} ${styles.profileCard}`}
                onClick={() => {
                  if (loading) return;
                  Taro.navigateTo({
                    url: pageUrls.modifyUser,
                  });
                }}
              >
                <View className={styles.cardContent}>
                  <View className={styles.cardInfo}>
                    <View className={styles.cardTitle}>
                      <Text className={styles.titleText}>编辑资料</Text>
                    </View>
                  </View>
                  <Image src={rightArrow} style={{ width: "12px", height: "8px" }} />
                </View>
              </View>
            </View>
          </View>
        </View>
        <View className={styles.imageHistoryTitle}>
          <Image
            src={MyWorkIcon}
            style={{
              width: "35px",
              height: "12px",
              position: "absolute",
              bottom: "12px",
              left: "50px",
            }}
          />
          我的作品
        </View>
        {designList.length > 0 && !loading && (
          <View className={styles.imageHistoryContainer}>
            <BraceletList items={designList} onItemClick={handleItemClick} />
          </View>
        )}
      </View>
      <TabBar />
    </CrystalContainer>
  );
};

export default UserCenterPage;
