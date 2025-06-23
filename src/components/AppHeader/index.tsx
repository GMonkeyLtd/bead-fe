import { View, Image } from "@tarojs/components";
import { getNavBarHeightAndTop } from "@/utils/style-tools";
import appName from "@/assets/app-name.png";
import Taro from "@tarojs/taro";
import back from "@/assets/icons/back.svg";
import backWhite from "@/assets/icons/back-white.svg";
import appNameWhite from "@/assets/app-name-white.png";
import { useEffect } from "react";
import { pageUrls } from "@/config/page-urls";

const AppHeader = ({
  isWhite = false,
  showBack = true,
  style = {},
}: {
  isWhite?: boolean;
  showBack?: boolean;
  style?: React.CSSProperties;
}) => {
  const { height: navBarHeight, top: navBarTop, width: navBarWidth } = getNavBarHeightAndTop();
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
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: navBarHeight,
        padding: `${navBarTop}px ${showBack ? navBarWidth : 16}px 10px 16px`,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        ...style,
      }}
    >
      {showBack && (
        <View
          style={{ height: "24px", width: "60px" }}
        >
          <Image
            src={isWhite ? backWhite : back}
            style={{ height: "24px", width: "24px" }}
            onClick={() => {
              console.log('handleback')
              Taro.redirectTo({
                url: pageUrls.home,
              });
            }}
          />
        </View>
      )}
      <Image
        src={isWhite ? appNameWhite : appName}
        style={{ height: "24px", flex: 1 }}
        mode="aspectFit"
      />
    </View>
  );
};

export default AppHeader;
