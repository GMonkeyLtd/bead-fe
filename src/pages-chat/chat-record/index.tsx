import React, { useState, useEffect } from "react";
import { View, Text, ScrollView } from "@tarojs/components";
import Taro from "@tarojs/taro";
import styles from "./index.module.scss";
import ArchiveCard, { ArchiveItem } from "@/components/ArchiveCard";

const ChatRecord: React.FC = () => {
  const [archives, setArchives] = useState<ArchiveItem[]>([
    {
      id: "1",
      name: "未命名档案3",
      designCount: 6,
      gender: "男生",
      birthDate: "1996年04月20日",
      birthTime: "19时",
      isCurrent: true,
    },
    {
      id: "2",
      name: "我的档案1",
      designCount: 3,
      gender: "女生",
      birthDate: "1998年08月15日",
      birthTime: "14时",
      isCurrent: false,
    },
    {
      id: "3",
      name: "测试档案",
      designCount: 8,
      gender: "男生",
      birthDate: "1995年12月03日",
      birthTime: "22时",
      isCurrent: false,
    },
  ]);

  const handleArchiveClick = (archive: ArchiveItem) => {
    console.log("点击档案:", archive);
    // 这里可以添加跳转到档案详情页面的逻辑
    Taro.showToast({
      title: `选择了档案: ${archive.name}`,
      icon: "none",
    });
  };

  const handleCurrentArchiveClick = (archive: ArchiveItem) => {
    console.log("点击当前档案:", archive);
    // 这里可以添加设置为当前档案的逻辑
    Taro.showToast({
      title: "已设置为当前档案",
      icon: "success",
    });
  };

  const handleSwitchArchiveClick = (archive: ArchiveItem) => {
    console.log("切换档案:", archive);
    // 这里可以添加切换档案的逻辑
    Taro.showToast({
      title: `切换到档案: ${archive.name}`,
      icon: "success",
    });
  };

  const handleDeleteArchiveClick = (archive: ArchiveItem) => {
    console.log("删除档案:", archive);
    // 这里可以添加删除档案的逻辑
    Taro.showModal({
      title: "确认删除",
      content: `确定要删除档案"${archive.name}"吗？`,
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({
            title: "档案已删除",
            icon: "success",
          });
        }
      },
    });
  };

  return (
    <View className={styles.chatRecordPage}>
      <ScrollView className={styles.archiveList} scrollY>
        {archives.map((archive) => (
          <ArchiveCard
            key={archive.id}
            archive={archive}
            onClick={() => handleArchiveClick(archive)}
            onCurrentClick={() => handleCurrentArchiveClick(archive)}
            onSwitchClick={() => handleSwitchArchiveClick(archive)}
            onDeleteClick={() => handleDeleteArchiveClick(archive)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default ChatRecord;


