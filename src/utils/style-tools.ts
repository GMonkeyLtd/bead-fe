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