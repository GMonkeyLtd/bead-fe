import React, { useState, useEffect } from "react";
import { View, Text, Image } from "@tarojs/components";
import BraceletList from "@/components/BraceletList";
import styles from "./index.module.scss";
import CrystalContainer from "@/components/CrystalContainer";
import UserInfoCard from "@/components/UserInfoCard";
import Taro, { useDidShow } from "@tarojs/taro";
import rightArrow from "@/assets/icons/right-arrow.svg";
import TabBar from "@/components/TabBar";
import { userHistoryApi, userApi } from "@/utils/api";
import MyWorkIcon from "@/assets/icons/my-work.svg";
import { pageUrls } from "@/config/page-urls";

const UserCenterPage: React.FC = () => {
  const [showIncomeCard, setShowIncomeCard] = useState(false);
  const [imageHistory, setImageHistory] = useState<any[]>([]);
  const [userInfo, setUserInfo] = useState(null);

  const initPageData = () => {
    userApi.getUserInfo().then((res) => {
      setUserInfo(res?.data);
    });
    userHistoryApi.getImageHistory().then((res) => {
      const history = (res?.data || []).map((item) => {
        return {
          id: item.ID,
          name: item.WordInfo.bracelet_name,
          image: item.ImageURL,
        };
      });
      setImageHistory(history);
    });
  }

  useDidShow(() => {
    initPageData();
  })

  const handleItemClick = (item: any) => {
    Taro.navigateTo({
      url: `${pageUrls.result}?designBackendId=${item.id}`,
    });
  };

  const handleOrdersClick = () => {
    Taro.navigateTo({
      url: pageUrls.orderList,
    });
  };

  return (
    <CrystalContainer showBack={false} showHome={false}>
      <View className={styles.pageContent}>
        <View className={styles.pageTopContainer}>
          <UserInfoCard
            userName={
              userInfo?.nick_name?.slice(0, 10) ||
              "微信用户" + Math.random().toString(36).substring(2, 15)
            }
            userSlogan="璞光集，好运气"
            avatar="https://zhuluoji.cn-sh2.ufileos.com/images-frontend/default-avatar.png" // 替换为实际头像URL
            showAction={userInfo?.is_merchant}
            onActionClick={() => {
              Taro.redirectTo({
                url: pageUrls.merchantLogin,
              })
            }}
          />

          {/* 功能卡片区域 */}
          <View className={styles.featureCards}>
            {/* 我的收益卡片 */}
            {/* <View className={`${styles.featureCard} ${styles.incomeCard}`}>
            <View className={styles.cardContent}>
              <View className={styles.cardInfo}>
                <View className={styles.cardTitle}>
                  <Text className={styles.titleText}>我的收益</Text>
                </View>
                <View className={styles.cardValue}>
                  <Text className={styles.valueText}>12.00</Text>
                  <Text className={styles.unitText}>元</Text>
                </View>
              </View>
              <View className={styles.withdrawBtn} onClick={handleWithdraw}>
                <Text className={styles.withdrawText}>提现</Text>
              </View>
            </View>
          </View> */}

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
                  <Image
                    src={rightArrow}
                    style={{ width: "12px", height: "8px" }}
                  />
                </View>
              </View>

              {/* 编辑资料卡片 */}
              <View
                className={`${styles.featureCard} ${styles.profileCard}`}
                onClick={() => {
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
                  <Image
                    src={rightArrow}
                    style={{ width: "12px", height: "8px" }}
                  />
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
                right: "20px",
              }}
            />
            我的作品
          </View>
          {imageHistory.length > 0 && (
            <View className={styles.imageHistoryContainer}>
              <BraceletList
                items={imageHistory}
                onItemClick={handleItemClick}
              />
            </View>
          )}
      </View>
      <TabBar />
    </CrystalContainer>
  );
};

export default UserCenterPage;
