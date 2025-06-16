import { View, Button } from "@tarojs/components";
import { useState, useEffect } from "react";
import Taro from "@tarojs/taro";
import "./index.scss";
import { generateApi } from "@/utils/api";
import AppHeader from "@/components/AppHeader";

const QuickDesign = () => {
  const [imageUrl, setImageUrl] = useState("");
  const [designing, setDesigning] = useState(false);
  const params = Taro.getCurrentInstance()?.router?.params;
  const { year, month, day, hour, gender } = params || {};

  useEffect(() => {
    quickDesign(year, month, day, hour, gender);
  }, []);

  const quickDesign = (year, month, day, hour, gender) => {
    setDesigning(true);
    // generateApi
    // .quickGenerate({
    //   birth_year: parseInt(year || "0"),
    //   birth_month: parseInt(month || "0"),
    //   birth_day: parseInt(day || "0"),
    //   birth_hour: parseInt(hour || "0"),
    //   is_lunar: false,
    //   sex: parseInt(gender || "0"),
    // })
    // .then((res) => {
    //   const imageUrl = res.images_url?.[0];
    //   if (!imageUrl) {
    //     Taro.showToast({
    //       title: '生成失败',
    //       icon: 'none',
    //     })
    //     Taro.switchTab({
    //       url: "/pages/home/index",
    //     })
    //     return;
    //   }
    //   console.log(res, imageUrl, 'res')
    //   setImageUrl(imageUrl);
    //   Taro.switchTab({
    //     url: "/pages/result/index?imageUrl=" + encodeURIComponent(imageUrl),
    //   })
    // })
    // .catch((err) => {
    //   Taro.showToast({
    //     title: '生成失败',
    //     icon: 'none',
    //   })
    //   Taro.switchTab({
    //     url: "/pages/home/index",
    //   })
    // })
    // .finally(() => {
    //   setDesigning(false);
    // });
    new Promise((resolve) => {
      setTimeout(() => {
        resolve('https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%B4%AB%E6%B0%B4%E6%99%B64.png');
      }, 2000);
    }).then((imageUrl) => {
      setImageUrl(imageUrl as string);
      Taro.navigateTo({
        url: "/pages/result/index?imageUrl=" + encodeURIComponent(imageUrl as string),
      })
    }).finally(() => {
      setDesigning(false);
    });
  };

  return (
    <View className="crystal-common-container">
      <AppHeader isWhite={false} />
      <View className="quick-design-content">
        {designing ? <View className="quick-design-loading">
          <View className="quick-design-loading-text">
            生成中...
          </View>
        </View> : <View className="quick-design-image">
          设计结束
        </View>}
      </View>
    </View>
  );
};


export default QuickDesign;
