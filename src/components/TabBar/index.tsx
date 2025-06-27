import React, { useState } from "react";
import { View, Text, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./index.scss";
import HomeIcon from '@/assets/tabbar-icons/home.svg'
import UserIcon from '@/assets/tabbar-icons/user.svg'
import HomeActiveIcon from '@/assets/tabbar-icons/home-active.svg'
import UserActiveIcon from '@/assets/tabbar-icons/user-active.svg'
import { pageUrls } from "@/config/page-urls";

interface TabBarItem {
  key: string;
  icon: string;
  iconActive?: string;
  text: string;
  path: string;
}

interface TabBarProps {
  onTabChange?: (key: string) => void;
}

const TAB_BAR_ITEMS = [
  {
    key: "home",
    icon: HomeIcon,
    iconActive: HomeActiveIcon,
    text: "首页",
    path: pageUrls.home,
  },
  {
    key: "user",
    icon: UserIcon,
    iconActive: UserActiveIcon,
    text: "我的",
    path: pageUrls.userCenter,
  },
];

const TabBar: React.FC<TabBarProps> = ({ onTabChange }) => {

  const isActiveTab = (item: TabBarItem) => {
    const currentPath = Taro.getCurrentPages()[0].route;
    return currentPath ? item.path?.includes(currentPath) : '';
  }
  
  const handleTabClick = (item: TabBarItem) => {

    onTabChange?.(item.key);

    // 页面跳转逻辑
    if (item.path) {
      Taro.redirectTo({
        url: item.path,
        fail: () => {
          // 如果navigateTo失败，尝试switchTab
          Taro.switchTab({ url: item.path });
        },
      });
    }
  };

  return (
    <View className="crystal-tab-bar">
      {TAB_BAR_ITEMS.map((item) => {
        const isActive = isActiveTab(item);
        console.log(item, isActive, 'isActive');
        return (
          <View
            key={item.key}
            className="tab-bar-item"
            onClick={() => handleTabClick(item)}
          >
            <Image src={isActive ? item.iconActive : item.icon} className="tab-icon" />
            <Text className={`tab-text ${isActive ? "active" : "inactive"}`}>
              {item.text}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

export default TabBar;
