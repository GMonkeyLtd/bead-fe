import { View, Image } from "@tarojs/components";
import { getNavBarHeightAndTop } from "@/utils/style-tools";
import AppHeader from "../AppHeader";
import { CRYSTAL_BROWN_BG_IMAGE_URL } from "@/config";

const CrystalContainer = ({
  children,
  style = {},
  isWhite = false,
  keyboardVisible = false,
  disablePaddingBottom = false,
  showBack = true,
  showHome = true,
  headerExtraContent = '',
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  isWhite?: boolean;
  keyboardVisible?: boolean;
  disablePaddingBottom?: boolean;
  showBack?: boolean;
  showHome?: boolean;
  headerExtraContent?: React.ReactNode;
}) => {
  const { top: navBarTop, height: navBarHeight } = getNavBarHeightAndTop();

  return (
    <View
      className={`crystal-common-container ${
        keyboardVisible ? "keyboard-visible" : ""
      }`}
      style={{
        // background:
        //   "linear-gradient(180deg, rgba(213, 195, 157, 0.50) 0%, rgba(252, 245, 240, 0.80) 19.55%, #FFFCFA 100%), ",
        backdropFilter: "blur(24px)",
        ...(disablePaddingBottom && {
          paddingBottom: 0,
        }),
      }}
    >
      <AppHeader isWhite={isWhite} showBack={showBack} showHome={showHome} extraContent={headerExtraContent} />
      <View
        className="page-children-container"
        style={{
          position: "relative",
          width: "100vw",
          height: `calc(100vh - ${navBarTop + navBarHeight}px)`,
          top: `${navBarTop + navBarHeight}px`,
          boxSizing: "border-box",
        }}
      >
        <View
          style={{
            position: "absolute",
            top: `-${navBarTop + navBarHeight}px`,
            left: 0,
            right: 0,
            opacity: 0.7,
          }}
        >
          <Image
            src={CRYSTAL_BROWN_BG_IMAGE_URL}
            mode="widthFix"
            style={{ width: "100%" }}
          />
        </View>
        <View style={{ ...style, position: "relative", height: "100%" }}>
          {children}
        </View>
      </View>
    </View>
  );
};

export default CrystalContainer;
