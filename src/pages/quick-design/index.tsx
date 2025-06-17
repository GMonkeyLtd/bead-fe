import { View, Image } from "@tarojs/components";
import { useState, useEffect } from "react";
import Taro from "@tarojs/taro";
import "./index.scss";
import { generateApi } from "@/utils/api";
import AppHeader from "@/components/AppHeader";

const QuickDesign = () => {
  const [imageUrl, setImageUrl] = useState("");
  const [designing, setDesigning] = useState(true);
  const params = Taro.getCurrentInstance()?.router?.params;
  const { year, month, day, hour, gender } = params || {};

  useEffect(() => {
    quickDesign(year, month, day, hour, gender);
  }, []);

  const quickDesign = (year, month, day, hour, gender) => {
    if (!year || !month || !day || !hour || !gender) {
      return;
    }
    setDesigning(true);
    generateApi
    .quickGenerate({
      birth_year: parseInt(year || "0"),
      birth_month: parseInt(month || "0"),
      birth_day: parseInt(day || "0"),
      birth_hour: parseInt(hour || "0"),
      is_lunar: false,
      sex: parseInt(gender || "0"),
    })
    .then((res) => {
      const imageUrl = res.images_url?.[0];
      if (!imageUrl) {
        Taro.showToast({
          title: '生成失败',
          icon: 'none',
        })
        Taro.switchTab({
          url: "/pages/home/index",
        })
        return;
      }
      setImageUrl(imageUrl);
      Taro.navigateTo({
        url: "/pages/result/index?imageUrl=" + encodeURIComponent(imageUrl),
      })
    })
    .catch((err) => {
      Taro.showToast({
        title: '生成失败',
        icon: 'none',
      })
      Taro.switchTab({
        url: "/pages/home/index",
      })
    })
    .finally(() => {
      setDesigning(false);
    });
    // new Promise((resolve) => {
    //   setTimeout(() => {
    //     resolve(
    //       "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%B4%AB%E6%B0%B4%E6%99%B64.png"
    //     );
    //   }, 2000);
    // })
    //   .then((imageUrl) => {
    //     setImageUrl(imageUrl as string);
    //     Taro.navigateTo({
    //       url:
    //         "/pages/result/index?imageUrl=" +
    //         encodeURIComponent(imageUrl as string),
    //     });
    //   })
    //   .finally(() => {
    //     setDesigning(false);
    //   });
  };

  return (
    <View className="crystal-common-container">
      <AppHeader isWhite={false} />
        {designing ? (
          <View className="quick-design-container">
              <View className="quick-design-loading">
                <Image src="https://crystal-ring.cn-sh2.ufileos.com/loading-img.png" className="quick-design-loading-image" />
                <View className="quick-design-loading-title">
                  制作中
                  <View className="quick-design-loading-title-dot">
                    <View className="quick-design-loading-title-dot-item">...</View>
                  </View>
                </View>
                <View className="quick-design-loading-content">TIPS: 金生水、水生木、木生火、火生土、土生金。</View>
              </View>
          </View>
        ) : null}
    </View>
  );
};

export default QuickDesign;
