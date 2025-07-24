import { View, Image } from "@tarojs/components";
import styles from "./index.module.scss";
import crystalStyle from "@/style/crystal.module.scss";
import { ASSISTANT_LG_IMAGE_URL } from "@/config";

// import loading from "@/assets/loading.svg";

export default function ChatLoading({ text, style }: { text: string, style?: React.CSSProperties }) {
  return (
    <View className={styles.chatLoadingContainer} style={style}>
      <View className={`${crystalStyle.crystalCard} ${styles.chatLoadingBubble}`}>
        <LoadingDots />
        <View className={styles.loadingText}>{text}</View>
      </View>
      <Image src={ASSISTANT_LG_IMAGE_URL} className={styles.loadingImage} />
    </View>
  );
}

export const LoadingDots = () => {
  return (
    <View className={styles.loadingDots}>
      <View className={styles.dot}></View>
      <View className={styles.dot}></View>
      <View className={styles.dot}></View>
    </View>
  );
};