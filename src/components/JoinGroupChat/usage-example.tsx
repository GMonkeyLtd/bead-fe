import React, { useState } from "react";
import { View, Text, Button } from "@tarojs/components";
import Taro from "@tarojs/taro";
import JoinGroupChat from "./index";

// 在现有页面中使用JoinGroupChat组件的示例
const UsageExample: React.FC = () => {
  const [showJoinGroup, setShowJoinGroup] = useState(false);

  // 模拟从API获取群聊信息
  const getGroupInfo = () => {
    return {
      name: "瑶光记·水晶手串 达人交流群",
      memberAvatars: [
        "/src/assets/figma-images/member-avatar-1.png",
        "/src/assets/figma-images/member-avatar-2.png", 
        "/src/assets/figma-images/member-avatar-3.png"
      ],
      qrCodeUrl: "https://via.placeholder.com/200x200/FFFFFF/000000?text=QR"
    };
  };

  const handleJoinGroup = () => {
    // 可以在这里添加埋点统计
    Taro.reportAnalytics('join_group_click', {
      group_name: getGroupInfo().name
    });
    setShowJoinGroup(true);
  };

  const handleCloseJoinGroup = () => {
    setShowJoinGroup(false);
  };

  return (
    <View style={{ padding: 20 }}>
      {/* 页面其他内容 */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 16, color: '#333' }}>
          欢迎来到瑶光记水晶手串专区
        </Text>
      </View>

      {/* 产品信息 */}
      <View style={{ 
        backgroundColor: '#f5f5f5', 
        padding: 15, 
        borderRadius: 8,
        marginBottom: 20 
      }}>
        <Text style={{ fontSize: 14, color: '#666' }}>
          加入我们的达人交流群，获取最新优惠和设计灵感！
        </Text>
      </View>

      {/* 加入群聊按钮 */}
      <Button 
        onClick={handleJoinGroup}
        style={{
          backgroundColor: '#282724',
          color: '#FFFFFF',
          padding: '12px 24px',
          borderRadius: '8px',
          border: 'none',
          fontSize: '16px',
          width: '100%'
        }}
      >
        🎁 加入群聊，领取专属优惠
      </Button>

      {/* 其他页面内容 */}
      <View style={{ marginTop: 20 }}>
        <Text style={{ fontSize: 14, color: '#999' }}>
          群内福利：
        </Text>
        <View style={{ marginTop: 10 }}>
          <Text style={{ fontSize: 12, color: '#666', display: 'block' }}>
            • 专属优惠券和折扣
          </Text>
          <Text style={{ fontSize: 12, color: '#666', display: 'block' }}>
            • 水晶选购建议
          </Text>
          <Text style={{ fontSize: 12, color: '#666', display: 'block' }}>
            • 设计师一对一咨询
          </Text>
        </View>
      </View>

      {/* JoinGroupChat组件 */}
      <JoinGroupChat
        visible={showJoinGroup}
        onClose={handleCloseJoinGroup}
        groupInfo={getGroupInfo()}
      />
    </View>
  );
};

export default UsageExample; 