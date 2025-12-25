import { View, ScrollView } from "@tarojs/components";
import { getNavBarHeightAndTop, getSafeAreaInfo } from "@/utils/style-tools";
import AppHeader from "../AppHeader";
import { useMemo, useState, useEffect } from "react";
import Taro from "@tarojs/taro";

interface PageContainerProps {
  children: React.ReactNode;
  isWhite?: boolean;
  keyboardHeight?: number; // 保留手动传入的选项，优先级高于自动监听
  headerExtraContent?: React.ReactNode;
  showHeader?: boolean;
  style?: React.CSSProperties;
  showBack?: boolean;
  showHome?: boolean;
  onBack?: () => void;
  className?: string;
  // 新增功能
  scrollable?: boolean; // 是否可滚动
  backgroundColor?: string; // 背景色
  padding?: string | number; // 内容区域内边距
  onScroll?: (e: any) => void; // 滚动事件
  scrollTop?: number; // 滚动位置
  enablePullDownRefresh?: boolean; // 是否启用下拉刷新
  // 键盘监听相关
  enableKeyboardListener?: boolean; // 是否启用键盘监听
  onKeyboardHeightChange?: (height: number) => void; // 键盘高度变化回调
}

const PageContainer = ({
  children,
  isWhite = false,
  keyboardHeight: manualKeyboardHeight,
  headerExtraContent = "",
  showHeader = true,
  style = {},
  showBack = true,
  showHome = true,
  onBack,
  className = "",
  scrollable = false,
  backgroundColor,
  padding = "0",
  onScroll,
  scrollTop,
  enableKeyboardListener = true,
  onKeyboardHeightChange,
}: PageContainerProps) => {
  // 键盘高度状态管理
  const [autoKeyboardHeight, setAutoKeyboardHeight] = useState(0);
  
  // 键盘监听逻辑
  useEffect(() => {
    if (!enableKeyboardListener) return;

    const handleKeyboardHeightChange = (res: any) => {
      const height = res.height || 0;
      setAutoKeyboardHeight(height);
      onKeyboardHeightChange?.(height);
    };

    // 监听键盘高度变化
    Taro.onKeyboardHeightChange(handleKeyboardHeightChange);

    // 清理函数
    return () => {
      Taro.offKeyboardHeightChange(handleKeyboardHeightChange);
    };
  }, [enableKeyboardListener, onKeyboardHeightChange]);

  // 优先使用手动传入的键盘高度，否则使用自动监听的键盘高度
  const keyboardHeight = manualKeyboardHeight !== undefined ? manualKeyboardHeight : autoKeyboardHeight;

  // 使用 useMemo 缓存计算结果，避免每次渲染都重新计算
  const { bottomHeight, contentHeight, contentTop } = useMemo(() => {
    try {
      const { top: navBarTop, height: navBarHeight } = getNavBarHeightAndTop();
      const { bottomHeight } = getSafeAreaInfo();
      console.log(bottomHeight, "bottomHeight");
      
      return {
        navBarTop,
        navBarHeight,
        bottomHeight,
        containerHeight: `calc(100vh - ${bottomHeight}px)`,
        contentHeight: `calc(100% - ${navBarTop + navBarHeight + keyboardHeight}px)`,
        contentTop: showHeader ? `${navBarTop + navBarHeight}px` : 0,
      };
    } catch (error) {
      console.error('PageContainer 获取设备信息失败:', error);
      // 提供合理的默认值
      const defaultNavBarHeight = 44;
      const defaultNavBarTop = 20;
      const defaultBottomHeight = 0;
      
      return {
        navBarTop: defaultNavBarTop,
        navBarHeight: defaultNavBarHeight,
        bottomHeight: defaultBottomHeight,
        containerHeight: `calc(100vh - ${defaultBottomHeight}px)`,
        contentHeight: `calc(100% - ${defaultNavBarTop + defaultNavBarHeight + keyboardHeight}px)`,
        contentTop: showHeader ? `${defaultNavBarTop + defaultNavBarHeight}px` : 0,
      };
    }
  }, [keyboardHeight, showHeader]);

  const containerStyle = {
    height: '100vh',
    overflow: 'hidden',
    paddingBottom: `${bottomHeight + 12}px`,
    backgroundColor,
    ...style,
  };

  const contentStyle = {
    position: "relative" as const,
    width: "100vw",
    height: contentHeight,
    top: contentTop,
    padding: typeof padding === 'number' ? `${padding}px` : padding,
  };

  const renderContent = () => {
    if (scrollable) {
      return (
        <ScrollView
          className="page-children-container"
          style={contentStyle}
          scrollY
          onScroll={onScroll}
          scrollTop={scrollTop}
        >
          {children}
        </ScrollView>
      );
    }
    
    return (
      <View className="page-children-container" style={contentStyle}>
        {children}
      </View>
    );
  };

  return (
    <View className={`crystal-common-container ${className}`} style={containerStyle}>
      {showHeader && (
        <AppHeader
          isWhite={isWhite}
          showBack={showBack}
          showHome={showHome}
          extraContent={headerExtraContent}
          onBack={onBack}
        />
      )}
      {renderContent()}
    </View>
  );
};

export default PageContainer;
