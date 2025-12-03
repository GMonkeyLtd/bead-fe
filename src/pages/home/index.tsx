import { View, Text, Swiper, SwiperItem, Image } from "@tarojs/components";
import { useEffect, useState, useRef } from "react";
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
import { MERCHANT_QRCODE_IMAGE_URL } from "@/config";

const Home = () => {
  const [showDateTimeDrawer, setShowDateTimeDrawer] = useState(false);
  const [lastSessionId, setLastSessionId] = useState("");
  const instance = Taro.getCurrentInstance();
  const { newSession } = instance.router?.params || {};
  const [qrCodeVisible, setQrCodeVisible] = useState(false);
  const [showIntelligentDesign, setShowIntelligentDesign] = useState(false);
  const [invitationCode, setInvitationCode] = useState<string>("");
  const invitationCodeRef = useRef("");

  // 确保 ref 始终是最新的
  useEffect(() => {
    invitationCodeRef.current = invitationCode;
  }, [invitationCode]);

  // 使用 Taro 的 useShareAppMessage hook
  // 使用 ref 来避免闭包问题，确保获取到最新的 invitationCode
  useShareAppMessage(() => {
    const currentCode = invitationCodeRef.current;
    console.log("🔗 分享触发，当前分享码:", currentCode);
    const sharePath = currentCode 
      ? `/pages/home/index?code=${currentCode}` 
      : `/pages/home/index`;
    console.log("🔗 分享路径:", sharePath);
    
    return {
      title: currentCode ? "璞光集 - 定制专属水晶手串" : "璞光集 - 好运气",
      path: sharePath,
      imageUrl: "",
    };
  });

  useLoad((options) => {
    // 接收分享码参数
    const code = options.code;
    
    // 异步初始化
    const initializeApp = async () => {
      try {
        // 1. 清除旧的认证并重新登录（传入邀请码）
        AuthManager.clearAuth();
        await AuthManager.login(code);
        console.log("✅ 登录成功");

        if (code) {
          Taro.showToast({
            title: `通过分享码${code}进入！`,
            icon: "none",
            duration: 2000,
          });
        }

        // 2. 登录成功后，获取用户信息和分享码
        const res = await userApi.getUserInfo({ 
          showLoading: false, 
          showError: false 
        });
        console.log("getUserInfo res: ", res);
        const user = res.data as any;
        console.log("user: ", user);
        if (user && user.is_promo_enable) {
          console.log("✅ 获取到分享码:", user.promo_code);
          setInvitationCode(user.promo_code);
        } else {
          console.log("⚠️ 用户没有分享码");
          setInvitationCode("");
        }

        // 3. 初始化完成后显示分享菜单（确保分享时已获取到邀请码）
        Taro.showShareMenu({
          withShareTicket: true,
          showShareItems: ["shareAppMessage", "shareTimeline"],
        });
      } catch (error) {
        console.error("❌ 初始化失败:", error);
        setInvitationCode("");
        // 即使失败也显示分享菜单（普通分享）
        Taro.showShareMenu({
          withShareTicket: true,
          showShareItems: ["shareAppMessage", "shareTimeline"],
        });
      }
    };

    initializeApp();
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
          MERCHANT_QRCODE_IMAGE_URL
        }
        // merchantName={order?.merchant_info?.name || ""}
        qrType="客服微信"
        onClose={() => setQrCodeVisible(false)}
      />
    </View>
  );
};

export default Home;
