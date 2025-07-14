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

export const getNavBarHeightAndTop = () => {
  const menuButtonInfo = Taro.getMenuButtonBoundingClientRect();
  // 导航栏高度 = 胶囊按钮下边界 + 胶囊按钮上边距（通常 8px）
  return {
    height: menuButtonInfo.bottom - menuButtonInfo.top,
    top: menuButtonInfo.top,
    width: menuButtonInfo.width,
  };
};
