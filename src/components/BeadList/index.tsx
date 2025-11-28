import { View, Image, Text } from "@tarojs/components";
import styles from "./index.module.scss";

const BeadList = ({ beads, cardStyle }) => {
  return (
    <View className={styles.beadSection}>
      {beads?.map((bead) => (
        <View key={bead.id} className={styles.beadCard} style={cardStyle}>
          <View className={styles.beadImageContainer}>
            <Image
              src={bead.image_url}
              className={styles.beadImage}
              mode="aspectFill"
            />
          </View>
          <View className={styles.beadContent}>
            <Text className={styles.beadName}>
              {bead.name}
            </Text>
            <View className={styles.beadEffect}>
              <View className={styles.beadEffectLine} />
              <Text className={styles.beadEffectText}>{bead.wuxing?.[0]}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

export default BeadList;
