import { View, Image } from "@tarojs/components";
import { getNavBarHeightAndTop } from "@/utils/style-tools";
import appName from "@/assets/app-name.png";
import Taro from "@tarojs/taro";
import back from "@/assets/icons/back.svg";
import backWhite from "@/assets/icons/back-white.svg";
import appNameWhite from "@/assets/app-name-white.png";
import { useEffect } from "react";

const AppHeader = ({ isWhite = false }: { isWhite?: boolean }) => {
  const { height: navBarHeight, top: navBarTop } = getNavBarHeightAndTop();
  useEffect(() => {
    if (isWhite) {
      Taro.setNavigationBarColor({
        frontColor: "#ffffff",
        backgroundColor: "#1f1722",
      });
    } else {
      Taro.setNavigationBarColor({
        frontColor: "#1f1722",
        backgroundColor: "#ffffff",
      });
    }
  }, [isWhite]);

  return (
    <View
      style={{
        height: navBarHeight,
        padding: `${navBarTop}px 16px 10px`,
        display: "flex",
        justifyContent: "center",
        alignItems: 'center'
      }}
    >
      <Image
        src={isWhite ? backWhite : back}
        style={{ height: "24px", width: "24px" }}
        onClick={() => {
          Taro.switchTab({
            url: "/pages/home/index",
          });
        }}
      />
      <Image
        src={isWhite ? appNameWhite : appName}
        style={{ height: "24px", flex: 1 }}
        mode="aspectFit"
      />
    </View>
  );
};

export default AppHeader;
