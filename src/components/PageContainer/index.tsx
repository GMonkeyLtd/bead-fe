import { View } from "@tarojs/components";
import { getNavBarHeightAndTop } from "@/utils/style-tools";
import AppHeader from "../AppHeader";

const PageContainer = ({
  children,
  isWhite = false,
  keyboardHeight = 0,
  headerContent = "",
  headerExtraContent = "",
  showHeader = true,
  style = {},
  showBack = true,
  showHome = true,
}: {
  children: React.ReactNode;
  isWhite?: boolean;
  keyboardHeight?: number;
  headerContent?: React.ReactNode;
  headerExtraContent?: React.ReactNode;
  showHeader?: boolean;
  style?: React.CSSProperties;
  showBack?: boolean;
  showHome?: boolean;
}) => {
  const { top: navBarTop, height: navBarHeight } = getNavBarHeightAndTop();

  return (
    <View
      className={`crystal-common-container `}
      style={{
        height: `calc(100vh - ${keyboardHeight}px)`,
        ...style,
      }}
    >
      {showHeader && (
        <AppHeader
          isWhite={isWhite}
          headerContent={headerContent}
          showBack={showBack}
          showHome={showHome}
          extraContent={headerExtraContent}
        />
      )}
      <View
        className="page-children-container"
        style={{
          position: "relative",
          width: "100vw",
          height: `calc(100% - ${navBarTop + navBarHeight + keyboardHeight}px)`,
          top: showHeader ? `${navBarTop + navBarHeight}px` : 0,
        }}
      >
        {children}
      </View>
    </View>
  );
};

export default PageContainer;
