import React, { useState, useEffect } from "react";
import { View, Text, Image } from "@tarojs/components";
import BraceletList from "@/components/BraceletList";
import "./index.scss";
import CrystalContainer from "@/components/CrystalContainer";
import UserInfoCard from "@/components/UserInfoCard";
import Taro from "@tarojs/taro";
import rightArrow from "@/assets/icons/right-arrow.svg";
import TabBar from "@/components/TabBar";
import { userHistoryApi, userApi } from "@/utils/api";
import MyWorkIcon from "@/assets/icons/my-work.svg";
import { pageUrls } from "@/config/page-urls";

const UserCenterPage: React.FC = () => {
  const [showIncomeCard, setShowIncomeCard] = useState(false);
  const [imageHistory, setImageHistory] = useState<any[]>([]);
  const [userInfo, setUserInfo] = useState<User | null>(null);

  useEffect(() => {
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
  }, []);

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
    <CrystalContainer showBack={false}>
      <View className="page-content">
        <View className="page-top-container">
          <UserInfoCard
            userName={
              userInfo?.nick_name ||
              "微信用户" + Math.random().toString(36).substring(2, 15)
            }
            userSlogan="璞光集，好运气"
            avatar="https://zhuluoji.cn-sh2.ufileos.com/images-frontend/default-avatar.png" // 替换为实际头像URL
            showAction={false}
          />

          {/* 功能卡片区域 */}
          <View className="feature-cards">
            {/* 我的收益卡片 */}
            {/* <View className="feature-card income-card">
            <View className="card-content">
              <View className="card-info">
                <View className="card-title">
                  <Text className="title-text">我的收益</Text>
                </View>
                <View className="card-value">
                  <Text className="value-text">12.00</Text>
                  <Text className="unit-text">元</Text>
                </View>
              </View>
              <View className="withdraw-btn" onClick={handleWithdraw}>
                <Text className="withdraw-text">提现</Text>
              </View>
            </View>
          </View> */}

            {/* 我的订单和编辑资料卡片容器 */}
            <View className="feature-cards-row">
              {/* 我的订单卡片 */}
              <View
                className="feature-card order-card"
                onClick={handleOrdersClick}
              >
                <View className="card-content">
                  <View className="card-info">
                    <View className="card-title">
                      <Text className="title-text">我的订单</Text>
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
                className="feature-card profile-card"
                onClick={() => {
                  Taro.navigateTo({
                    url: pageUrls.contactPreference,
                  });
                }}
              >
                <View className="card-content">
                  <View className="card-info">
                    <View className="card-title">
                      <Text className="title-text">编辑资料</Text>
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
          <View className="image-history-title">
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
            <View className="image-history-container">
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
