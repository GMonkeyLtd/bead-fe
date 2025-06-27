import Taro from '@tarojs/taro';

// 兼容各平台获取安全区域
export const getSafeArea = () => {
  try {
    const systemInfo = Taro.getSystemInfoSync();
    return systemInfo.safeArea || { top: 0 };
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
