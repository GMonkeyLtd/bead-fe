import { View } from "@tarojs/components";
import { getNavBarHeightAndTop } from "@/utils/style-tools";
import AppHeader from "../AppHeader";

const PageContainer = ({
  children,
  isWhite = false,
  keyboardVisible = false,
}: {
  children: React.ReactNode;
  isWhite?: boolean;
  keyboardVisible?: boolean;
}) => {
  const { top: navBarTop, height: navBarHeight } = getNavBarHeightAndTop();

  return (
    <View
      className={`crystal-common-container ${
        keyboardVisible ? "keyboard-visible" : ""
      }`}
    >
      <AppHeader isWhite={isWhite} />
      <View
        className='page-children-container'
        style={{
          position: "relative",
          width: "100vw",
          height: `calc(100vh - ${navBarTop + navBarHeight}px)`,
          top: `${navBarTop + navBarHeight}px`,
        }}
      >
        {children}
      </View>
    </View>
  );
};

export default PageContainer;
