import Taro from '@tarojs/taro';

// 兼容各平台获取安全区域
export const getSafeArea = () => {
  try {
    // 使用新的 getWindowInfo API 替代已废弃的 getSystemInfoSync
    const windowInfo = Taro.getWindowInfo();
    console.log(windowInfo, "windowInfo");
    return windowInfo.safeArea || { top: 0 };
  } catch (error) {
    console.error('获取安全区域失败', error);
    return { top: 0 };
  }
};

// 获取底部安全区域高度（不可操作区域）
export const getBottomSafeAreaHeight = () => {
  try {
    const systemInfo = Taro.getSystemInfoSync();
    const windowInfo = Taro.getWindowInfo();
    
    // 优先使用 windowInfo.safeArea
    if (windowInfo.safeArea) {
      const safeAreaBottom = windowInfo.safeArea.bottom;
      const windowHeight = windowInfo.windowHeight;
      const bottomInset = windowHeight - safeAreaBottom;
      return Math.max(0, bottomInset);
    }
    
    // 备用方案：使用 systemInfo
    if (systemInfo.safeArea) {
      const safeAreaBottom = systemInfo.safeArea.bottom;
      const windowHeight = systemInfo.windowHeight;
      const bottomInset = windowHeight - safeAreaBottom;
      return Math.max(0, bottomInset);
    }
    
    // 根据设备类型和系统版本估算
    const { platform, system } = systemInfo;
    const systemVersion = system ? parseFloat(system.split(' ')[1]) : 0;
    
    // iOS 设备
    if (platform === 'ios') {
      if (systemVersion >= 11.0) {
        // iPhone X 及以后的设备
        const { screenHeight } = systemInfo;
        if (screenHeight >= 812) {
          return 34; // iPhone X, XS, XR, 11, 12, 13, 14, 15 系列
        }
      }
      return 0; // 其他 iOS 设备
    }
    
    // Android 设备
    if (platform === 'android') {
      // 根据屏幕高度判断是否有底部安全区域
      const { screenHeight } = systemInfo;
      if (screenHeight >= 800) {
        return 24; // 大多数 Android 设备的底部安全区域
      }
    }
    
    return 0;
  } catch (error) {
    console.error('获取底部安全区域高度失败', error);
    return 0;
  }
};

// 获取顶部安全区域高度
export const getTopSafeAreaHeight = () => {
  try {
    const windowInfo = Taro.getWindowInfo();
    
    if (windowInfo.safeArea) {
      return windowInfo.safeArea.top;
    }
    
    const systemInfo = Taro.getSystemInfoSync();
    if (systemInfo.safeArea) {
      return systemInfo.safeArea.top;
    }
    
    return 0;
  } catch (error) {
    console.error('获取顶部安全区域高度失败', error);
    return 0;
  }
};

// 获取完整的安全区域信息
export const getSafeAreaInfo = () => {
  try {
    const windowInfo = Taro.getWindowInfo();
    const systemInfo = Taro.getSystemInfoSync();
    
    const safeArea = windowInfo.safeArea || systemInfo.safeArea;
    const bottomHeight = getBottomSafeAreaHeight();
    const topHeight = getTopSafeAreaHeight();
    
    return {
      safeArea,
      bottomHeight,
      topHeight,
      leftHeight: safeArea ? safeArea.left : 0,
      rightHeight: safeArea ? (systemInfo.windowWidth - safeArea.right) : 0,
      windowHeight: windowInfo.windowHeight,
      screenHeight: systemInfo.screenHeight,
      platform: systemInfo.platform,
      system: systemInfo.system,
    };
  } catch (error) {
    console.error('获取安全区域信息失败', error);
    return {
      safeArea: null,
      bottomHeight: 0,
      topHeight: 0,
      leftHeight: 0,
      rightHeight: 0,
      windowHeight: 0,
      screenHeight: 0,
      platform: 'unknown',
      system: 'unknown',
    };
  }
};

// 生成底部安全区域的 CSS 样式
export const getBottomSafeAreaStyle = (additionalPadding = 0) => {
  const bottomHeight = getBottomSafeAreaHeight();
  const totalPadding = bottomHeight + additionalPadding;
  
  return {
    paddingBottom: `${totalPadding}px`,
  };
};

// 生成顶部安全区域的 CSS 样式
export const getTopSafeAreaStyle = (additionalPadding = 0) => {
  const topHeight = getTopSafeAreaHeight();
  const totalPadding = topHeight + additionalPadding;
  
  return {
    paddingTop: `${totalPadding}px`,
  };
};

export const getNavBarHeightAndTop = () => {
  const menuButtonInfo = Taro.getMenuButtonBoundingClientRect();
  // 导航栏高度 = 胶囊按钮下边界 + 胶囊按钮上边距（通常 8px）
  return {
    height: menuButtonInfo.bottom - menuButtonInfo.top,
    top: menuButtonInfo.top,
    width: menuButtonInfo.width,
  };
};
