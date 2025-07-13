import React, { useState } from "react";
import { View, Text, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import styles from "./index.module.scss";
import HomeIcon from "@/assets/tabbar-icons/home.svg";
import UserIcon from "@/assets/tabbar-icons/user.svg";
import HomeActiveIcon from "@/assets/tabbar-icons/home-active.svg";
import UserActiveIcon from "@/assets/tabbar-icons/user-active.svg";
import { pageUrls } from "@/config/page-urls";
import grabOrdersIcon from "@/assets/icons/grab.svg";
import grabOrdersActiveIcon from "@/assets/icons/grab-active.svg";
import orderListIcon from "@/assets/icons/orders.svg";
import orderListActiveIcon from "@/assets/icons/orders-active.svg";
import userIcon from "@/assets/icons/user-center.svg";
import userActiveIcon from "@/assets/icons/user-center-active.svg";
import InspirationIcon from "@/assets/icons/inspiration.svg";
import InspirationActiveIcon from "@/assets/icons/inspiration-active.svg";

interface TabBarItem {
  key: string;
  icon: string;
  iconActive?: string;
  text: string;
  path: string;
}

interface TabBarProps {
  onTabChange?: (key: string) => void;
  isMerchant?: boolean;
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
    key: "inspiration",
    icon: InspirationIcon,
    iconActive: InspirationActiveIcon,
    text: "灵感",
    path: pageUrls.inspiration,
  },
  {
    key: "user",
    icon: UserIcon,
    iconActive: UserActiveIcon,
    text: "我的",
    path: pageUrls.userCenter,
  },
];

const TAB_BAR_ITEMS_MERCHANT = [
  {
    key: "grab-orders",
    icon: grabOrdersIcon,
    iconActive: grabOrdersActiveIcon,
    text: "接单",
    path: pageUrls.merchantGrabOrders,
  },
  {
    key: "order-list",
    icon: orderListIcon,
    iconActive: orderListActiveIcon,
    text: "订单列表",
    path: pageUrls.merchantOrderManagement,
  },
  {
    key: "user",
    icon: userIcon,
    iconActive: userActiveIcon,
    text: "我的",
    path: pageUrls.merchantUserCenter,
  },
];

const TabBar: React.FC<TabBarProps> = ({ onTabChange, isMerchant = false }) => {
  const isActiveTab = (item: TabBarItem) => {
    const currentPages = Taro.getCurrentPages();
    const currentPath = currentPages[currentPages.length - 1].route;
    return currentPath ? item.path?.includes(currentPath) : "";
  };

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
    <View
      className={styles.crystalTabBar}
      style={isMerchant ? { background: "#ffffff" } : {}}
    >
      {(isMerchant ? TAB_BAR_ITEMS_MERCHANT : TAB_BAR_ITEMS).map((item) => {
        const isActive = isActiveTab(item);
        return (
          <View
            key={item.key}
            className={styles.tabBarItem}
            onClick={() => handleTabClick(item)}
          >
            <Image
              src={isActive ? item.iconActive : item.icon}
              className={styles.tabIcon}
            />
            <Text
              className={`${styles.tabText} ${
                isActive ? styles.active : styles.inactive
              }`}
              style={isMerchant && isActive ? { color: "#FF8800" } : {}}
            >
              {item.text}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

export default TabBar;
