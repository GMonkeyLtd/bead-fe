import { View, Image } from "@tarojs/components";
import { getNavBarHeightAndTop } from "@/utils/style-tools";
import Taro from "@tarojs/taro";
import { useEffect } from "react";
import { pageUrls } from "@/config/page-urls";
import logoWhite from "@/assets/logo/logo-white.svg";
import logo from "@/assets/logo/logo.svg";
import backIcon from "@/assets/icons/back.svg";
import backIconWhite from "@/assets/icons/back-white.svg";

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
        justifyContent: "space-between",
        alignItems: "center",
        ...style,
      }}
    >
      {showBack && (
        <View
          style={{ height: "24px", width: "60px" }}
        >
          <Image
            src={isWhite ? backIconWhite : backIcon}
            style={{ height: "24px", width: "24px" }}
            onClick={() => {
              if (Taro.getCurrentPages().length === 1) {
                Taro.navigateTo({
                  url: pageUrls.home,
                });
              } else {
                Taro.navigateBack();
              }
            }}
          />
        </View>
      )}
      <Image
        src={isWhite ? logoWhite : logo}
        style={{ height: "24px", flex: 1 }}
        mode="aspectFit"
      />
    </View>
  );
};

export default AppHeader;
