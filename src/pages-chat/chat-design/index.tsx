import Taro from "@tarojs/taro";
import { View, Text, Image } from "@tarojs/components";
import { useEffect, useState } from "react";
import { beadsApi } from "@/utils/api";
import PageContainer from "@/components/PageContainer";
import { useDesign } from "@/store/DesignContext";
import { pageUrls } from "@/config/page-urls";
import apiSession from "@/utils/api-session";
import CrystalButton from "@/components/CrystalButton";
import styles from "./index.module.scss";
import assistantAvatar from "@/assets/assistant-avatar.svg";

const CustomDesign = () => {
  const [isDesigning, setIsDesigning] = useState(false);

  useEffect(() => {}, []);

  const renderAssistant = () => {
    return (
      <View className={styles.assistantAvatarContainer}>
        <Image src={assistantAvatar} className={styles.assistantAvatar} />
        <Text className={styles.assistantName}>梨莉莉</Text>
      </View>
    );
  };
  return (
    <PageContainer
      headerContent={isDesigning ? "正在设计新方案..." : null}
      headerExtraContent={isDesigning ? null : renderAssistant()}
      showHome={false}
    >
      <View className={styles.chatContainer}>
        <CrystalButton onClick={() => setIsDesigning(true)} text="开始定制" />
      </View>
    </PageContainer>
  );
};

export default CustomDesign;
