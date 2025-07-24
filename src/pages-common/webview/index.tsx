import React, { useEffect } from 'react';
import { WebView } from '@tarojs/components';
import Taro from '@tarojs/taro';

const WebViewPage: React.FC = () => {
  // 从路由参数获取要打开的URL和标题
  const { url, title } = Taro.getCurrentInstance()?.router?.params || {};
  
  useEffect(() => {
    // 如果有标题参数，设置页面标题
    if (title) {
      Taro.setNavigationBarTitle({
        title: decodeURIComponent(title)
      });
    }
  }, [title]);

  if (!url) {
    Taro.showToast({
      title: '链接地址不能为空',
      icon: 'none'
    });
    // 返回上一页
    setTimeout(() => {
      Taro.navigateBack();
    }, 1500);
    return null;
  }

  // 解码URL参数
  const decodedUrl = decodeURIComponent(url);

  return (
    <WebView 
      src={decodedUrl}
      onMessage={(e) => {
        console.log('WebView消息:', e.detail.data);
      }}
      onLoad={() => {
        console.log('WebView加载完成');
        // 页面加载完成后可以执行一些操作
      }}
      onError={(e) => {
        console.error('WebView加载错误:', e);
        Taro.showToast({
          title: '页面加载失败，请检查网络连接',
          icon: 'none',
          duration: 3000
        });
      }}
    />
  );
};

export default WebViewPage; 