import { View, Text, Swiper, SwiperItem, Image } from "@tarojs/components";
import { useEffect, useState } from "react";
import Taro, { useDidShow, useLoad, useShareAppMessage } from "@tarojs/taro";
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
import QrCodeDialog from "@/components/QrCodeDialog";
import { userApi } from "@/utils/api";

const Home = () => {
  const [showDateTimeDrawer, setShowDateTimeDrawer] = useState(false);
  const [lastSessionId, setLastSessionId] = useState("");
  const instance = Taro.getCurrentInstance();
  const { newSession } = instance.router?.params || {};
  const [qrCodeVisible, setQrCodeVisible] = useState(false);
  const [showIntelligentDesign, setShowIntelligentDesign] = useState(false);
  const [shareCode, setShareCode] = useState<string>("");

  useEffect(() => {
    AuthManager.clearAuth();
    AuthManager.login();
    Taro.showShareMenu({
      withShareTicket: true, // 支持获取群聊信息
      showShareItems: ["shareAppMessage", "shareTimeline"], // 同时开启好友和朋友圈分享
    });

    // 获取用户信息并生成分享码
    // 方式1: 使用用户ID作为分享码（如果有）
    // 方式2: 调用后端API获取分享码
    // 这里先用用户信息生成，实际应该调用后端API
    userApi
      .getUserInfo({ showLoading: false, showError: false })
      .then((res) => {
        // 根据API定义，getUserInfo返回 { data: { data: User } }
        const user = (res.data as any)?.data;
        if (user) {
          // 使用用户微信ID或生成唯一码
          // 实际应该调用后端API: /user/getsharecode
          const userWechatId = user.wechat_id;
          const code = userWechatId || `user_${Date.now()}`;
          setShareCode(code);
        } else {
          // 如果获取失败，使用临时码
          setShareCode(`temp_${Date.now()}`);
        }
      })
      .catch(() => {
        // 如果获取失败，使用临时码
        setShareCode(`temp_${Date.now()}`);
      });
  }, []);

  // 使用 Taro 的 useShareAppMessage hook
  useShareAppMessage(() => {
    // 如果分享码还没获取到，使用临时码
    const code = shareCode || `temp_${Date.now()}`;
    
    console.log("分享触发，分享码:", code);
    
    return {
      title: "璞光集 - 定制专属水晶手串", // 分享标题
      path: `/pages/home/index?code=${code}`, // 分享路径，携带分享码
      imageUrl: "", // 可选：分享图片URL，留空使用小程序默认图
    };
  });

  useLoad((options) => {
    // 接收分享码参数
    const code = options.code || options.shareCode;
    if (code) {
      console.log("通过分享进入，分享码:", code);
      
      // 可以在这里处理分享码逻辑，比如：
      // 1. 上报分享来源
      // 2. 记录分享关系
      // 3. 显示欢迎提示等
      
      Taro.showToast({
        title: `欢迎通过分享进入！`,
        icon: "none",
        duration: 2000,
      });
      
      // 可以调用后端API记录分享关系
      // userApi.recordShare({ share_code: code }).catch(console.error);
    }
  });

  useDidShow(() => {
    setTimeout(() => {
      apiSession
        .getLastSession()
        .then((res) => {
          if (res.data?.session_id) {
            setLastSessionId(res.data.session_id);
          }
        })
        .catch((e) => {
          setLastSessionId("");
          console.error("getLastSession error: ", e);
        });
    }, 200);
    apiSession.getFeatureFlag({ showError: false }).then((res) => {
      console.log("getFeatureFlag res: ", res);
      setShowIntelligentDesign(res.data.chats);
    });
  });

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
      url:
        pageUrls.chatDesign +
        "?year=" +
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
                <View className="crystal-content-section">
                  <View className="crystal-title-section">
                    <View className="crystal-title-frame">
                      {/* <Text className="crystal-subtitle-up">{item.subtitle}</Text> */}
                      <Text className="crystal-subtitle-down">
                        {item.description}
                      </Text>
                      <Text className="crystal-main-title">{item.title}</Text>
                    </View>
                  </View>
                  <View className="crystal-action-section">
                    <View
                      className="crystal-action-section-items"
                      style={{
                        justifyContent: showIntelligentDesign
                          ? "space-between"
                          : "flex-end",
                      }}
                    >
                      {showIntelligentDesign && (
                        <CrystalButton
                          style={{
                            borderRadius: "2px",
                            border: "1.1px solid rgba(255, 255, 255, 0.20)",
                            background: "rgba(0, 0, 0, 0)",
                            backdropFilter: "blur(4px)",
                            boxShadow: "none",
                            // width: "154px",
                          }}
                          textStyle={{
                            color: "#fff",
                          }}
                          onClick={() => {
                            Taro.reportEvent("homepage_event", {
                              ai_design_click: 1,
                            });
                            if (!lastSessionId) {
                              startDesign();
                            } else {
                              Taro.navigateTo({
                                url:
                                  pageUrls.chatDesign +
                                  "?session_id=" +
                                  lastSessionId,
                              });
                            }
                          }}
                          text="智能定制"
                          // icon={
                          //   <Image
                          //     src={RightArrowWhite}
                          //     style={{ width: "16px", height: "10px" }}
                          //   />
                          // }
                        />
                      )}
                      <CrystalButton
                        style={{
                          borderRadius: "2px",
                          border: "1.1px solid rgba(255, 255, 255, 0.20)",
                          background: "rgba(0, 0, 0,0)",
                          backdropFilter: "blur(4px)",
                          boxShadow: "none",
                          // width: "154px",
                        }}
                        textStyle={{
                          color: "#fff",
                        }}
                        onClick={() => {
                          Taro.reportEvent("homepage_event", {
                            home_diy_click: 1,
                          });
                          Taro.redirectTo({
                            url: pageUrls.customDesign + "?from=home",
                          });
                        }}
                        text="DIY创作"
                      />
                    </View>
                    {/* <View className="crystal-link-text" onClick={() => {
                      Taro.redirectTo({
                        url: pageUrls.customDesign + '?from=home',
                      });
                    }}>
                        DIY设计
                    </View> */}
                  </View>
                </View>
                <View
                  className="crystal-link-text"
                  onClick={() => {
                    Taro.reportEvent("homepage_event", {
                      contact_merchants: 1,
                    });
                    setQrCodeVisible(true);
                  }}
                >
                  联系客服
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
      <QrCodeDialog
        visible={qrCodeVisible}
        qrCodeUrl={
          "https://zhuluoji.cn-sh2.ufileos.com/merchant-images/owned_store/OwnerStoreQR"
        }
        // merchantName={order?.merchant_info?.name || ""}
        qrType="客服微信"
        onClose={() => setQrCodeVisible(false)}
      />
    </View>
  );
};

export default Home;
