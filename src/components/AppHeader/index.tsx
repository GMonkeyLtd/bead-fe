import { View, Image } from "@tarojs/components";
import { getNavBarHeightAndTop } from "@/utils/style-tools";
import Taro from "@tarojs/taro";
import { useEffect } from "react";
import { pageUrls } from "@/config/page-urls";
import logoWhite from "@/assets/logo/logo-white.svg";
import logo from "@/assets/logo/logo.svg";
import backIcon from "@/assets/icons/back.svg";
import backIconWhite from "@/assets/icons/back-white.svg";
import homeIcon from "@/assets/icons/home.svg";
import homeIconWhite from "@/assets/icons/home-white.svg";

const AppHeader = ({
  isWhite = false,
  showBack = true,
  showHome = true,
  onBack,
  style = {},
  extraContent,
}: {
  isWhite?: boolean;
  showBack?: boolean;
  showHome?: boolean;
  onBack?: () => void;
  style?: React.CSSProperties;
  extraContent?: React.ReactNode;
}) => {
  console.log(isWhite, 'isWhite')
  const {
    height: navBarHeight,
    top: navBarTop,
    width: navBarWidth,
  } = getNavBarHeightAndTop();
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
        padding: `${navBarTop}px ${
          showBack ? navBarWidth + 10 : 16
        }px 10px 16px`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        ...style,
      }}
    >
      <View
        style={{
          height: "100%",
          alignItems: "center",
          display: "flex",
          gap: "8px",
        }}
      >
        {showBack && (
          <View
            style={{
              height: "100%",
              width: "32px",
              alignItems: "center",
              display: "flex",
              justifyContent: "center",
            }}
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                if (Taro.getCurrentPages().length === 1) {
                  Taro.redirectTo({
                    url: pageUrls.home,
                  });
                } else {
                  Taro.navigateBack();
                }
              }
            }}
          >
            <Image
              src={isWhite ? backIconWhite : backIcon}
              style={{ height: "24px", width: "24px" }}
            />
          </View>
        )}
        {showBack && showHome && (
          <View
            style={{
              height: "20px",
              width: "1px",
              backgroundColor: isWhite
                ? "rgba(255, 255, 255, 0.30)"
                : "rgba(0, 0, 0, 0.30)",
            }}
          />
        )}
        {showHome && (
          <View
            style={{
              height: "100%",
              width: "32px",
              alignItems: "center",
              display: "flex",
              justifyContent: "center",
            }}
            onClick={() => {
              Taro.redirectTo({
                url: pageUrls.home,
              });
            }}
          >
            <Image
              src={isWhite ? homeIconWhite : homeIcon}
              style={{ height: "24px", width: "24px" }}
            />
          </View>
        )}
      </View>
        {extraContent !== undefined ? (
          <View
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontFamily: "Source Han Serif CN",
            }}
          >
            {extraContent}
          </View>
      ) : (
        <Image
          src={isWhite ? logoWhite : logo}
          style={{ height: "24px", flex: 1 }}
          mode="aspectFit"
        />
      )}
    </View>
  );
};

export default AppHeader;
