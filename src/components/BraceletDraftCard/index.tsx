import { View, Image } from "@tarojs/components";
import styles from "./index.module.scss";
import Taro from "@tarojs/taro";
import { BRACELET_BG_IMAGE_URL } from "@/config";
import { useEffect, useState, useMemo } from "react";
import apiSession, { BeadItem, BraceletDraft } from "@/utils/api-session";
import { DotImageData } from "@/hooks/useCircleRingCanvas";
import { CircleRingImage } from "../CircleRing";
import {
  BRACELET_CARD_TEXTURE_IMAGE_URL,
  CRYSTAL_CARD_GRADIENT_BG_IMAGE_URL,
} from "@/config";
import CrystalButton from "../CrystalButton";
import rightArrowGoldenIcon from "@/assets/icons/right-arrow-golden.svg";
import { pageUrls } from "@/config/page-urls";
import { generateUUID } from "@/utils/uuid";
import { useDesign } from "@/store/DesignContext";

interface BraceletDraftWithImage extends BraceletDraft {
  bracelet_image?: string;
}

export const BraceletDraftCard = ({
  sessionId,
  draftId,
  draftIndex,
  draftData,
  generateBraceletImage,
}: {
  sessionId?: string;
  draftId?: string;
  draftIndex?: number;
  draftData?: BraceletDraft;
  generateBraceletImage: (beads: DotImageData[]) => Promise<string>;
}) => {
  const [draft, setDraft] = useState<BraceletDraftWithImage | null>(null);
  const { addBeadData } = useDesign();

  useEffect(() => {
    if (draftData) {
      setDraft(draftData);
      return;
    }
    if (!sessionId || !draftId) {
      return;
    }
    apiSession
      .getDesignDraft({ session_id: sessionId, draft_id: draftId })
      .then((res) => {
        console.log(res.data, "draft");
        setDraft(res.data);
      });
  }, [sessionId, draftId, draftData]);

  useEffect(() => {
    if (draft?.beads?.length && draft.beads.length > 0) {
      generateBraceletImage(draft.beads).then((braceletImage) => {
        setDraft({
          ...draft,
          bracelet_image: braceletImage,
        } as BraceletDraftWithImage);
      });
    }
  }, [draft]);

  const beadsInfo = useMemo(() => {
    return draft?.beads?.reduce((acc, bead) => {
      if (!acc.find((b) => b.name === bead.name)) {
        acc.push(bead);
      }
      return acc;
    }, [] as BeadItem[]);
  }, [draft]);

  if (!draft) {
    return null;
  }

  const viewDraftDesign = () => {
    if (draft?.design_id) {
      Taro.redirectTo({
        url: `${pageUrls.result}?designBackendId=${draft?.design_id}`,
      });
      return;
    }
    if (!draft?.bracelet_image) {
      return;
    }
    Taro.redirectTo({
      url: `${pageUrls.quickDesign}?sessionId=${sessionId}&draftId=${
        draft?.draft_id
      }&imageUrl=${encodeURIComponent(draft?.bracelet_image)}`,
    });
  };

  const handleDiy = () => {
    if (!draft?.beads || draft?.beads?.length === 0) {
      return;
    }
    const beadDataId = "bead-" + generateUUID();
    addBeadData({
      image_url: draft?.bracelet_image,
      bead_list: draft?.beads,
      bead_data_id: beadDataId,
      draft_id: draft?.draft_id,
      session_id: sessionId,
    });
    Taro.redirectTo({
      url: pageUrls.customDesign + "?beadDataId=" + beadDataId,
    });
  }

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
      <View className={styles.braceletDraftCardHeaderContainer}>
        <View className={styles.braceletDraftCardHeader}>{`方案展示 ${draftIndex}`}</View>
        <View className={styles.braceletDraftCardHeader}>{draft.draft_id}</View>
      </View>
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
            <View className={styles.braceletName}>{draft.name}</View>
            <View className={styles.braceletBeads}></View>
            {beadsInfo?.map((bead) => (
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
          <View className={styles.braceletBgImageContainer}>
            <CircleRingImage
              imageUrl={draft.bracelet_image}
              size={140}
              backendSize={160}
              backgroundImage={BRACELET_BG_IMAGE_URL}
              rotate={true}
            />
          </View>
        </View>
        <View className={styles.braceletDraftCardFooter}>
          <CrystalButton
            style={{
              flex: 1,
            }}
            onClick={() => {
              viewDraftDesign();
            }}
            text="查询效果"
            isPrimary
            icon={
              <Image
                src={rightArrowGoldenIcon}
                mode="widthFix"
                style={{ width: '16px', height: '11px' }}
              />
            }
          />
          <CrystalButton
            // style={{
            onClick={handleDiy}
            text="DIY编辑"
          />
        </View>
      </View>
    </View>
  );
};
