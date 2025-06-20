import { View } from "@tarojs/components";
import { useEffect } from "react";
import Taro from "@tarojs/taro";

const TabPage = () => {
  useEffect(() => {
    Taro.navigateTo({
      url: "/pages/custom-design/index",
    });
  }, []);
  return <View>TabPage</View>;
};

export default TabPage;