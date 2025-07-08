import { View, Text, Swiper, SwiperItem, Image } from "@tarojs/components";
import { useEffect, useState } from "react";
import Taro from "@tarojs/taro";
import "./index.scss";
import { SWIPER_DATA } from "@/config/home-content";
import RightArrow from "@/assets/icons/right-arrow.svg";
import DateTimeDrawer from "@/components/DateTimeDrawer";
import CrystalButton from "@/components/CrystalButton";
import AppHeader from "@/components/AppHeader";
import { AuthManager } from "@/utils/auth";
import { pageUrls } from "@/config/page-urls";
import TabBar from "@/components/TabBar";
import apiSession from "@/utils/api-session";

const Home = () => {
  const [showDateTimeDrawer, setShowDateTimeDrawer] = useState(false);
  const [checkFirst, setCheckFirst] = useState(false);
  const [lastSessionId, setLastSessionId] = useState("");

  useEffect(() => {
    AuthManager.clearAuth();
    AuthManager.login();

    apiSession.getLastSession().then((res) => {
      console.log("getLastSession res: ", res);
      if (res.data?.session_id) {
        setLastSessionId(res.data.session_id);
      }
    }).catch((e) => {
      setLastSessionId("");
      console.error("getLastSession error: ", e);
    }).finally(() => {
      setCheckFirst(true);
    });
  }, []);

  const startDesign = () => {
    // 打开日期时间选择抽屉
    setShowDateTimeDrawer(true);
  };

  const handleDrawerClose = () => {
    setShowDateTimeDrawer(false);
  };

  const handleQuickCustomize = ({
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
      url:
        pageUrls.quickDesign + "?year=" +
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
      url:
        pageUrls.design + '?year=' +
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
            <View
              className="banner-item"
              style={{
                backgroundImage: `url(${item.backgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            >
              <View className="home-swiper-content">
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
                    onClick={() => {
                      if (!checkFirst || !lastSessionId) {
                        startDesign();
                      } else {
                        Taro.redirectTo({
                          url: pageUrls.design + '?session_id=' + lastSessionId,
                        });
                      }
                    }}
                    text="开启定制"
                    icon={
                      <Image
                        src={RightArrow}
                        style={{ width: "10px", height: "10px" }}
                      />
                    }
                  />
                </View>
              </View>
            </View>
          </SwiperItem>
        ))}
      </Swiper>
      <TabBar />
      <DateTimeDrawer
        onQuickCustomize={handleQuickCustomize}
        onPersonalizeCustomize={handlePersonalizeCustomize}
        visible={showDateTimeDrawer}
        onClose={handleDrawerClose}
      />
    </View>
  );
};

export default Home;
