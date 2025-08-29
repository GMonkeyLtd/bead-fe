import { View, Text, Swiper, SwiperItem, Image } from "@tarojs/components";
import { useEffect, useState } from "react";
import Taro, { useDidShow } from "@tarojs/taro";
import "./index.scss";
import { SWIPER_DATA } from "@/config/home-content";
import RightArrowWhite from "@/assets/icons/right-arrow-white.svg";
import DateTimeDrawer from "@/components/DateTimeDrawer";
import CrystalButton from "@/components/CrystalButton";
import AppHeader from "@/components/AppHeader";
import BackgroundMedia from "@/components/BackgroundMedia";
import { AuthManager } from "@/utils/auth";
import { pageUrls } from "@/config/page-urls";
import TabBar, { TabBarTheme } from "@/components/TabBar";
import apiSession from "@/utils/api-session";

const Home = () => {
  const [showDateTimeDrawer, setShowDateTimeDrawer] = useState(false);
  const [lastSessionId, setLastSessionId] = useState("");
  const instance = Taro.getCurrentInstance();
  const { newSession } = instance.router?.params || {};

  useEffect(() => {
    AuthManager.clearAuth();
    AuthManager.login();
    Taro.showShareMenu({
      withShareTicket: true, // 支持获取群聊信息
      showShareItems: ['shareAppMessage', 'shareTimeline'] // 同时开启好友和朋友圈分享
    });
  }, []);

  useDidShow(() => {
    apiSession.getLastSession().then((res) => {
      if (res.data?.session_id) {
        setLastSessionId(res.data.session_id);
      }
    }).catch((e) => {
      setLastSessionId("");
      console.error("getLastSession error: ", e);
    })
  })

  const startDesign = () => {
    // 打开日期时间选择抽屉
    setShowDateTimeDrawer(true);
  };

  useEffect(() => {
    if (newSession) {
      startDesign();
    }
  }, [newSession]);

  const handleDrawerClose = () => {
    setShowDateTimeDrawer(false);
  };

  const handlePersonalizeCustomize = ({
    year,
    month,
    day,
    hour,
    gender,
    isLunar,
  }: {
    year: number;
    month: number;
    day: number;
    hour: number;
    gender: number;
    isLunar: boolean;
  }) => {
    Taro.redirectTo({
      url: pageUrls.chatDesign + '?year=' +
        year +
        "&month=" +
        month +
        "&day=" +
        day +
        "&hour=" +
        hour +
        "&gender=" +
        gender +
        "&isLunar=" +
        isLunar,
    });
  };

  return (
    <View className="home-container">
      <AppHeader
        isWhite
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
        showBack={false}
        showHome={false}
      />
      <Swiper
        className="banner-swiper"
        indicatorColor="rgba(255,255,255,0.3)"
        indicatorActiveColor="#fff"
        circular={true}
        indicatorDots={false}
        autoplay={true}
        interval={4000}
        duration={500}
      >
        {SWIPER_DATA.map((item) => (
          <SwiperItem key={item.id}>
            <View className="banner-item">
              {/* 背景媒体组件 */}
              <BackgroundMedia
                type={item.type}
                imageUrl={item.backgroundImage}
                videoUrl={item.backgroundVideo}
                className="banner-background"
              />
              
              <View className="home-content">
                <View className="crystal-title-section">
                  <View className="crystal-title-frame">
                    <Text className="crystal-subtitle-up">{item.subtitle}</Text>
                    <Text className="crystal-main-title">{item.title}</Text>
                    <Text className="crystal-subtitle-down">
                      {item.description}
                    </Text>
                  </View>
                </View>
                <View className="crystal-action-section">
                  <CrystalButton
                    style={{
                      borderRadius: 70,
                      border: "1.1px solid rgba(255, 255, 255, 0.20)",
                      background: "rgba(0, 0, 0, 0.30)",
                      backdropFilter: "blur(4px)",
                      boxShadow: 'none',
                      width: "154px",
                    }}
                    textStyle={{
                      color: "#fff",
                    }}
                    onClick={() => {
                      if (!lastSessionId) {
                        startDesign();
                      } else {
                        Taro.navigateTo({
                          url: pageUrls.chatDesign + '?session_id=' + lastSessionId,
                        });
                      }
                    }}
                    text="开启定制"
                    icon={
                      <Image
                        src={RightArrowWhite}
                        style={{ width: "16px", height: "10px" }}
                      />
                    }
                  />
                  {/* <View className="crystal-link-text" onClick={() => {
                    Taro.redirectTo({
                      url: pageUrls.customDesign + '?from=home',
                    });
                  }}>
                      DIY
                  </View> */}
                </View>
              </View>
            </View>
          </SwiperItem>
        ))}
      </Swiper>
      <TabBar theme={TabBarTheme.DARK} />
      <DateTimeDrawer
        onPersonalizeCustomize={handlePersonalizeCustomize}
        visible={showDateTimeDrawer}
        onClose={handleDrawerClose}
      />
    </View>
  );
};

export default Home;
