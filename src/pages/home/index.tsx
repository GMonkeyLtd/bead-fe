import {
  View,
  Button,
  Text,
  Swiper,
  SwiperItem,
  Image,
} from "@tarojs/components";
import { useEffect, useState } from "react";
import Taro from "@tarojs/taro";
import "./index.scss";
import { SWIPER_DATA } from "@/config/home-content";
import RightArrow from "@/assets/icons/right-arrow.svg";
import DateTimeDrawer from "@/components/DateTimeDrawer";
import { generateApi } from "@/utils/api";
import CrystalButton from "@/components/CrystalButton";

const Home = () => {
  const [showDateTimeDrawer, setShowDateTimeDrawer] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    // 隐藏底部导航栏
    Taro.hideTabBar({
      animation: false,
    });

    // 当组件卸载时恢复显示底部导航栏
    return () => {
      Taro.showTabBar({
        animation: false,
      });
    };
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
  }: {
    year: number;
    month: number;
    day: number;
    hour: number;
    gender: number;
  }) => {

      Taro.navigateTo({
        url:
          "/pages/quick-design/index?year=" +
          year +
          "&month=" +
          month +
          "&day=" +
          day +
          "&hour=" +
          hour +
          "&gender=" +
          gender,
      });
  };

  const handlePersonalizeCustomize = ({
    year,
    month,
    day,
    hour,
    gender,
  }: {
    year: number;
    month: number;
    day: number;
    hour: number;
    gender: string;
  }) => {
    Taro.navigateTo({
      url:
        "/pages/design/index?year=" +
        year +
        "&month=" +
        month +
        "&day=" +
        day +
        "&hour=" +
        hour +
        "&gender=" +
        gender,
    });
  };

  return (
    <View className="home-container">
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
                    onClick={startDesign}
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
