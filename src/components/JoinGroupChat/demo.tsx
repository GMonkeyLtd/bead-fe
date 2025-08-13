import React, { useState } from "react";
import { View, Text, Button } from "@tarojs/components";
import Taro from "@tarojs/taro";
import JoinGroupChat from ".";

const JoinGroupChatDemo: React.FC = () => {
  const [showJoinGroup, setShowJoinGroup] = useState(false);

  const handleShowJoinGroup = () => {
    setShowJoinGroup(true);
  };

  const handleCloseJoinGroup = () => {
    setShowJoinGroup(false);
  };

  const groupInfo = {
    name: "瑶光记·水晶手串 达人交流群",
    memberAvatars: [
      "/src/assets/figma-images/member-avatar-1.png",
      "/src/assets/figma-images/member-avatar-2.png", 
      "/src/assets/figma-images/member-avatar-3.png"
    ],
    qrCodeUrl: "https://via.placeholder.com/200x200/FFFFFF/000000?text=QR"
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>
        加入群聊组件演示
      </Text>
      
      <Button 
        onClick={handleShowJoinGroup}
        style={{
          backgroundColor: '#282724',
          color: '#FFFFFF',
          padding: '12px 24px',
          borderRadius: '8px',
          border: 'none',
          fontSize: '16px'
        }}
      >
        显示加入群聊弹窗
      </Button>

      <JoinGroupChat
        visible={showJoinGroup}
        onClose={handleCloseJoinGroup}
        groupInfo={groupInfo}
      />
    </View>
  );
};

export default JoinGroupChatDemo; 