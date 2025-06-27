import React from "react";
import { View } from "@tarojs/components";
import UserInfoCard from "./index";

// 示例用法
const UserInfoCardDemo: React.FC = () => {
  const handleActionClick = () => {
    console.log("点击了商家后台按钮");
    // 这里可以添加跳转逻辑
  };

  return (
    <View style={{ padding: "20px" }}>
      <UserInfoCard
        userName="温酒大人"
        userSlogan="璞光集，好运气"
        avatar="https://via.placeholder.com/60" // 替换为实际头像URL
        actionText="商家后台"
        onActionClick={handleActionClick}
        showAction={true}
      />
    </View>
  );
};

export default UserInfoCardDemo; 