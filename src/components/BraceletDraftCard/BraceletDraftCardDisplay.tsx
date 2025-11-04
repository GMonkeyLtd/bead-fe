import { View, Image, Canvas } from "@tarojs/components";
import styles from "./index.module.scss";
import Taro from "@tarojs/taro";
import { BRACELET_BG_IMAGE_URL } from "@/config";
import { useEffect, useState, useMemo, useRef } from "react";
import { BeadItem } from "@/utils/api-session";
import { CircleRingImage } from "../CircleRing";
import {
  BRACELET_CARD_TEXTURE_IMAGE_URL,
  CRYSTAL_CARD_GRADIENT_BG_IMAGE_URL,
} from "@/config";

export const BraceletDraftCardDisplay = ({
  imageUrl,
  name,
  beadList
}: {
  imageUrl: string;
  name: string;
  beadList: BeadItem[];
}) => {

  const beadsInfo = useMemo(() => {
    return beadList?.reduce((acc, bead) => {
      const beadInfo = { ...bead };
      if (!acc.find((b) => b.name === beadInfo.name)) {
        acc.push(beadInfo);
      }
      return acc;
    }, [] as BeadItem[]);
  }, [beadList]);

  return (
    <View
      className={styles.braceletDraftCard}
      style={{
        backgroundImage: `url(${CRYSTAL_CARD_GRADIENT_BG_IMAGE_URL})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <View className={styles.braceletDraftCardContentContainer}>
        <View className={styles.braceletTextureContainer}>
          <Image
            src={BRACELET_CARD_TEXTURE_IMAGE_URL}
            mode="widthFix"
            className={styles.braceletTextureImage}
          />
        </View>
        <View className={styles.braceletDraftCardContent}>
          <View className={styles.braceletDetailContainer}>
            <View className={styles.braceletName}>{name}</View>
            <View className={styles.braceletBeads}></View>
            {beadsInfo?.filter((bead) => !!bead.func_summary)?.map((bead) => (
              <View className={styles.braceletBead} key={bead.name}>
                <Image
                  src={bead.image_url}
                  mode="widthFix"
                  className={styles.braceletBeadImage}
                />
                <View className={styles.braceletBeadInfoContainer}>
                  <View className={styles.braceletBeadName}>{bead.name}</View>
                  <View className={styles.braceletBeadFunc}>
                    {bead.func_summary}
                  </View>
                </View>
              </View>
            ))}
          </View>
          <View className={styles.braceletBgImageContainer} onClick={() => {
            Taro.previewImage({
              current: imageUrl,
              urls: [imageUrl],
            });
          }}>
            <CircleRingImage
              // imageUrl={isRegenerating ? "" :  draft.bracelet_image || ""}
              imageUrl={imageUrl}
              size={240}
              backendSize={160}
              backgroundImage={BRACELET_BG_IMAGE_URL}
              rotate={true}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

export default BraceletDraftCardDisplay;
