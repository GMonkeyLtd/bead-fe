import { View, Image, Canvas } from "@tarojs/components";
import styles from "./index.module.scss";
import Taro from "@tarojs/taro";
import { BRACELET_BG_IMAGE_URL } from "@/config";
import { useEffect, useState, useMemo, useRef } from "react";
import apiSession, { BeadItem, BraceletDraft } from "@/utils/api-session";
import { CircleRingImage } from "../CircleRing";
import {
  BRACELET_CARD_TEXTURE_IMAGE_URL,
  CRYSTAL_CARD_GRADIENT_BG_IMAGE_URL,
} from "@/config";
import CrystalButton from "../CrystalButton";
import rightArrowGoldenIcon from "@/assets/icons/right-arrow-golden.svg";
import { pageUrls } from "@/config/page-urls";
import { usePollDraft, DraftData } from "@/hooks/usePollDraft";
import { useCircleRingCanvas } from "@/hooks/useCircleRingCanvas";
import refreshIcon from "@/assets/icons/refresh.svg";
import { imageToBase64 } from "@/utils/imageUtils";
import { SPU_TYPE } from "@/pages-design/custom-design";

export const BraceletDraftCard = ({
  sessionId,
  draftId,
  draftIndex,
  draftData,
  shouldLoad = true, // 控制是否立即加载图像
  onImageLoaded,
  canRegenerate = false,
  byMerchant = false,
}: {
  sessionId?: string;
  draftId?: string;
  draftIndex?: number;
  draftData?: BraceletDraft;
  shouldLoad?: boolean; // 是否立即加载图像
  onImageLoaded?: () => void; // 图像加载完成回调
  canRegenerate?: boolean;
  byMerchant?: boolean;
}) => {
  // 初始化usePollDraft钩子
  const { draft, startPolling, updateDraft } = usePollDraft<{ wishes: string[], updated_at: string }>({});
  const [isRegenerating, setIsRegenerating] = useState(false);

  // 使用ref来防止重复生成图像
  const isGeneratingRef = useRef(false);
  const generatedBraceletImageRef = useRef<string | null>(null);
  const currentDraftRef = useRef<DraftData | null>(null);

  // 使用独立的CircleRing Canvas实例
  const { generateCircleRing, canvasProps } =
    useCircleRingCanvas({
      targetSize: 640,
      fileType: "png",
      canvasId: "page-chat-draft-canvas",
    });

  // 稳定化beads数组，避免不必要的重新渲染
  const beadsForGeneration = useMemo(() => {
    if (!draft?.items?.length) return null;
    return draft?.items?.map((item) => ({
      image_url: item?.image_url,
      diameter: item.diameter,
      width: item.width || item.diameter,
      image_aspect_ratio: item.image_aspect_ratio || 1,
      isFloatAccessory: item.spu_type === SPU_TYPE.ACCESSORY && (!item.width || (item.hole_postion && item.hole_postion !== 0.5)),
      hole_postion: item.hole_postion,
      display_width: item.display_width,
    }));
  }, [draft?.items]);

  // 检查是否需要生成图像
  const shouldGenerateImage = useMemo(() => {
    return (
      draft?.items?.length &&
      draft.items.length > 0 &&
      shouldLoad &&
      !draft.bracelet_image &&
      !draft.image_url &&
      !isGeneratingRef.current &&
      generatedBraceletImageRef.current !== draft.bracelet_image
    );
  }, [draft?.items?.length, draft?.bracelet_image, shouldLoad]);

  // 更新currentDraftRef
  useEffect(() => {
    currentDraftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    if (draftData) {
      updateDraft(draftData);
      return;
    }
    if (!sessionId || !draftId) {
      return;
    }
    startPolling(sessionId, draftId, byMerchant);
  }, [sessionId, draftId, draftData, byMerchant]);

  const uploadDraftImage = async (braceletImage: string) => {
    const imageBase64 = await imageToBase64(braceletImage, true, false, undefined, 'png');
    apiSession.uploadDraftImage({
      session_id: sessionId || "",
      draft_id: draft?.draft_id || "",
      image_base64: imageBase64 as string,
    }, { showError: false }).catch((err) => {
      console.error("上传手串图像失败:", err);
    });
  }

  const generateBraceletImage = async () => {
    isGeneratingRef.current = true;
    // 使用本地的generateCircleRing而不是传入的generateBraceletImage
    generateCircleRing(beadsForGeneration as DotImageData[])
      .then((braceletImage) => {
        if (braceletImage) {
          generatedBraceletImageRef.current = braceletImage;
          // 使用ref中的draft状态，避免依赖项变化
          const currentDraft = currentDraftRef.current;
          if (currentDraft) {
            updateDraft({
              ...currentDraft,
              bracelet_image: braceletImage,
            } as DraftData);
          }
          if (braceletImage && sessionId && draft?.draft_id) {
            uploadDraftImage(braceletImage);
          }
          // 调用加载完成回调
          onImageLoaded?.();
        }
      })
      .catch((error) => {
        console.error("生成手串图像失败:", error);
        // 即使失败也要隐藏Canvas
        // setShowCanvas(false);
      })
      .finally(() => {
        isGeneratingRef.current = false;
      });
  }

  useEffect(() => {
    // 防止重复生成的条件检查
    if (shouldGenerateImage && beadsForGeneration && beadsForGeneration.length > 0) {
      generateBraceletImage();
    }
  }, [
    shouldGenerateImage,
    beadsForGeneration,
    generateCircleRing,
    updateDraft,
    onImageLoaded,
  ]);

  // 组件卸载时清理Canvas
  // useEffect(() => {
  //   return () => {
  //     setShowCanvas(false);
  //     cleanupCanvas();
  //   };
  // }, [cleanupCanvas]);

  const beadsInfo = useMemo(() => {
    return draft?.items?.reduce((acc, bead) => {
      const beadInfo = { ...bead };
      if (!acc.find((b) => b.name === beadInfo.name)) {
        acc.push(beadInfo);
      }
      return acc;
    }, [] as BeadItem[]);
  }, [draft]);

  if (!draft) {
    return null;
  }

  const viewDraftDesign = () => {
    if (byMerchant) {
      return;
    }
    if (draft?.design_id) {
      Taro.redirectTo({
        url: `${pageUrls.result}?designBackendId=${draft?.design_id}&from=chat&sessionId=${sessionId}`,
      });
      return;
    }
    if (!draft?.bracelet_image && !draft?.image_url) {
      return;
    }
    Taro.redirectTo({
      url: `${pageUrls.quickDesign}?sessionId=${sessionId}&draftId=${draft?.draft_id
        }&imageUrl=${encodeURIComponent(draft?.image_url || draft?.bracelet_image || "")}`,
    });
  };

  const handleDiy = () => {
    if (!draft?.items || draft?.items?.length === 0 || byMerchant) {
      return;
    }
    Taro.reportEvent('ai_design', {
      edit_ai_design	: 1
    })
    Taro.redirectTo({
      url:
        pageUrls.customDesign +
        "?sessionId=" +
        sessionId +
        "&draftId=" +
        draft?.draft_id +
        "&from=chat",
    });
  };

  const viewImage = () => {
    if (!draft.bracelet_image && !draft.image_url) {
      return;
    }

    Taro.previewImage({
      current: draft.image_url || draft.bracelet_image || "",
      urls: [draft.image_url || draft.bracelet_image || ""],
    });
  };

  const handleRegenerate = () => {
    if (!canRegenerate || draft?.design_id || isRegenerating || byMerchant) {
      return;
    }
    setIsRegenerating(true);
    apiSession
      .regenerateDraft({
        session_id: sessionId || "",
        draft_id: draft?.draft_id || "",
      })
      .then((res) => {
        setTimeout(() => {
          setIsRegenerating(false);
          startPolling(sessionId || "", draft?.draft_id || "");
        }, 2000);
      })
      .catch((err) => {
        console.error("重新设计失败:", err);
        setIsRegenerating(false);
      });
  };

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
        <View
          className={styles.braceletDraftCardHeader}
        >{`方案展示 ${draftIndex}`}</View>
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
            {canRegenerate && !draft?.design_id && (
              <View className={styles.regenerateBtn} onClick={handleRegenerate}>
                <Image
                  src={refreshIcon}
                  mode="widthFix"
                  style={{ width: "16px", height: "16px" }}
                />
                <View className={styles.regenerateBtnText}>
                  {isRegenerating ? "设计中..." : "重新设计"}
                </View>
              </View>
            )}
          </View>
          <View className={styles.braceletBgImageContainer} onClick={viewImage}>
            <CircleRingImage
              // imageUrl={isRegenerating ? "" :  draft.bracelet_image || ""}
              imageUrl={isRegenerating ? "" : draft.image_url || draft.bracelet_image || ""}
              size={240}
              // size={140}
              backendSize={160}
              backgroundImage={BRACELET_BG_IMAGE_URL}
              rotate={true}
            />
          </View>
        </View>
        <View className={styles.braceletDraftCardFooter}>
          {/* 非默认方案或已生成才展示查看效果按钮 */}
          {(!draft?.spec.is_default || !!draft?.design_id) && (
            <CrystalButton
              style={{
                flex: 1,
              }}
              onClick={() => {
                Taro.reportEvent('ai_design', {
                  view_report: 1
                })
                viewDraftDesign();
              }}
              text="查看效果"
              isPrimary
              icon={
                <Image
                  src={rightArrowGoldenIcon}
                  mode="widthFix"
                  style={{ width: "16px", height: "11px" }}
                />
              }
            />
          )}
          {draft?.items?.length > 0 && draft?.items?.every((item) => !!item.sku_id) && (
            <CrystalButton
              // style={{
              onClick={handleDiy}
              text="DIY编辑"
            />
          )}
        </View>
      </View>
      {/* Canvas已移到全局，这里不再需要 */}
    </View>
  );
};
