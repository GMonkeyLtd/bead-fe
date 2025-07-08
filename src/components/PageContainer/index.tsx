import { View } from "@tarojs/components";
import { getNavBarHeightAndTop } from "@/utils/style-tools";
import AppHeader from "../AppHeader";

const PageContainer = ({
  children,
  isWhite = false,
  keyboardHeight = 0,
  headerContent = "",
}: {
  children: React.ReactNode;
  isWhite?: boolean;
  keyboardHeight?: number;
  headerContent?: React.ReactNode;
}) => {
  const { top: navBarTop, height: navBarHeight } = getNavBarHeightAndTop();

  console.log("keyboardHeight", keyboardHeight);
  return (
    <View
      className={`crystal-common-container `}
      style={{
        height: `calc(100vh - ${keyboardHeight}px)`,
      }}
    >
      <AppHeader isWhite={isWhite} headerContent={headerContent} />
      <View
        className="page-children-container"
        style={{
          position: "relative",
          width: "100vw",
          height: `calc(100% - ${navBarTop + navBarHeight + keyboardHeight}px)`,
          top: `${navBarTop + navBarHeight}px`,
        }}
      >
        {children}
      </View>
    </View>
  );
};

export default PageContainer;
