import { View, Image } from "@tarojs/components";
import styles from "./index.module.scss";
// import loading from "@/assets/loading.svg";

export default function ChatLoading() {
  return <View className={styles.chatLoading}>
    <Image src={loading} className={styles.loading} />
  </View>
}