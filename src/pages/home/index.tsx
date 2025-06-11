import { View, Button, Text, Swiper, SwiperItem, Image } from "@tarojs/components";
import { useEffect, useState } from "react";
import Taro from "@tarojs/taro";
import "./index.scss";
import api from "@/utils/api";
import { AuthManager } from "@/utils/auth";
import { SWIPER_DATA } from "@/config/home-content";
import RightArrow from "@/assets/icons/right-arrow.svg";
import DateTimeDrawer from "@/components/DateTimeDrawer";
import { generateApi } from "@/utils/api";
import CrystalButton from "@/components/crystal-button";

const Home = () => {
  const [showDateTimeDrawer, setShowDateTimeDrawer] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  // useEffect(() => {
  //   login();
  // }, []);

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

  const handleDateTimeConfirm = (dateTime: { year: string; month: string; day: string; hour: string }) => {
    console.log("选择的日期时间:", dateTime);
    
    // 显示选择的时间
    Taro.showToast({
      title: `${dateTime.year}-${dateTime.month}-${dateTime.day} ${dateTime.hour}:00`,
      icon: "none",
      duration: 2000
    });

    // 这里可以根据需要跳转到设计页面或执行其他逻辑
    // Taro.switchTab({
    //   url: "/pages/design/index",
    // });
  };

  const handleDrawerClose = () => {
    setShowDateTimeDrawer(false);
  };

  const login = async () => {
    try {
      // 先检查是否已经登录
      const authInfo = AuthManager.getAuthInfo();
      if (authInfo && authInfo.token) {
        console.log("用户已登录，跳过登录流程");
        return;
      }

      const loginRes = await Taro.login();
      if (loginRes.code) {
        const res = await api.user.login({ code: loginRes.code });
        console.log(res, "登录响应");

        if (res.token) {
          // 保存登录信息到本地缓存
          AuthManager.saveAuth(res.token);

          Taro.showToast({
            title: "登录成功",
            icon: "success",
          });

          console.log("认证信息已保存:", AuthManager.getAuthInfo());
        }
      }
    } catch (error) {
      console.log("登录失败:", error);
      Taro.showToast({
        title: "登录失败",
        icon: "error",
      });
    }
  };


  const handleQuickCustomize = ({ year, month, day, hour }: { year: number; month: number; day: number; hour: number }) => {
    // 直接使用图片URL，不依赖state
    // const generatedImageUrl = 'http://117.50.252.189:8188/view?filename=ComfyUI_00576_.png&type=output';
    // setImageUrl(generatedImageUrl);
    
    // Taro.navigateTo({
    //   url: '/pages/result/index?imageUrl=' + encodeURIComponent(generatedImageUrl),
    // });
    
    generateApi.quickGenerate(
      {
        "birth_year": year,
        "birth_month": month,
        "birth_day": day,
        "birth_hour": hour,
        "is_lunar": false,
        "sex": 1
    }).then((res) => {
      const imageUrl = res.image_url;
      setImageUrl(imageUrl);
      Taro.navigateTo({
        url: '/pages/result/index?imageUrl=' + encodeURIComponent(imageUrl),
      });
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
                    <Text className="crystal-subtitle-down">{item.description}</Text>
                  </View>
                </View>
                <View className="crystal-action-section">
                  <CrystalButton 
                    onClick={startDesign} 
                    text="开启定制"
                    icon={<Image src={RightArrow} style={{ width: '10px', height: '10px' }}/>}
                  />
                </View>
              </View>
            </View>
          </SwiperItem>
        ))}
      </Swiper>

      <DateTimeDrawer
        onQuickCustomize={handleQuickCustomize}
        visible={showDateTimeDrawer}
        onClose={handleDrawerClose}
      />
    </View>
  );
};

export default Home;
