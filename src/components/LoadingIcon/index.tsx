import { View, Text } from "@tarojs/components";
import styles from "./index.module.scss";

export default function LoadingIcon({ 
  visible = true,
  circleColor = '#dead71',
  size = 'medium'
}) {
  if (!visible) return null;

  return (
    <View 
      className={`${styles.spinner} ${styles[size]}`}
      style={{ borderTopColor: circleColor }}
    />
  );
}
