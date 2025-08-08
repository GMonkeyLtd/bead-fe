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
import { generateUUID } from "@/utils/uuid";
import { usePollDraft, DraftData } from "@/hooks/usePollDraft";
import { useCircleRingCanvas } from "@/hooks/useCircleRingCanvas";
import refreshIcon from "@/assets/icons/refresh.svg";

export const BraceletDraftCard = ({
  sessionId,
  draftId,
  draftIndex,
  draftData,
  shouldLoad = true, // 控制是否立即加载图像
  onImageLoaded,
  canRegenerate = false,
}: {
  sessionId?: string;
  draftId?: string;
  draftIndex?: number;
  draftData?: BraceletDraft;
  shouldLoad?: boolean; // 是否立即加载图像
  onImageLoaded?: () => void; // 图像加载完成回调
  canRegenerate?: boolean;
}) => {
  const { draft, startPolling, updateDraft } = usePollDraft({});
  const [isRegenerating, setIsRegenerating] = useState(false);

  // 为每个卡片实例生成唯一的canvasId，避免多个卡片共享同一个Canvas
  const uniqueCanvasId = useMemo(() => `bracelet-canvas-${draftId || generateUUID()}`, [draftId]);

  // 控制Canvas的显示状态，生成完成后销毁
  const [showCanvas, setShowCanvas] = useState(true);

  // 使用ref来防止重复生成图像
  const isGeneratingRef = useRef(false);
  const generatedBraceletImageRef = useRef<string | null>(null);
  const currentDraftRef = useRef<DraftData | null>(null);

  // 使用独立的CircleRing Canvas实例
  const { generateCircleRing, canvasProps, cleanupCanvas } = useCircleRingCanvas({
    canvasId: uniqueCanvasId,
    targetSize: 1024,
    isDifferentSize: true,
    fileType: "png"
  });

  // 稳定化beads数组，避免不必要的重新渲染
  const beadsForGeneration = useMemo(() => {
    if (!draft?.beads?.length) return null;
    return draft.beads.map(item => ({
      image_url: item.image_url,
      diameter: item.diameter,
    }));
  }, [draft?.beads]);

  // 检查是否需要生成图像
  const shouldGenerateImage = useMemo(() => {
    return draft?.beads?.length && 
           draft.beads.length > 0 && 
           showCanvas && 
           shouldLoad && 
           !draft.bracelet_image && 
           !isGeneratingRef.current &&
           generatedBraceletImageRef.current !== draft.bracelet_image;
  }, [draft?.beads?.length, draft?.bracelet_image, showCanvas, shouldLoad]);

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
    startPolling(sessionId, draftId);
  }, [sessionId, draftId, draftData]);

  useEffect(() => {
    console.log("draft", draft);
    
    // 防止重复生成的条件检查
    if (shouldGenerateImage && beadsForGeneration) {
      
      isGeneratingRef.current = true;
      
      // 使用本地的generateCircleRing而不是传入的generateBraceletImage
      generateCircleRing(beadsForGeneration).then((braceletImage) => {
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
          // 图像生成完成后，隐藏Canvas以释放资源
          // setShowCanvas(false);
          // cleanupCanvas();
          // 调用加载完成回调
          onImageLoaded?.();
        }
      }).catch((error) => {
        console.error("生成手串图像失败:", error);
        // 即使失败也要隐藏Canvas
        // setShowCanvas(false);
      }).finally(() => {
        isGeneratingRef.current = false;
      });

    }
  }, [shouldGenerateImage, beadsForGeneration, generateCircleRing, updateDraft, onImageLoaded]);

  // 组件卸载时清理Canvas
  // useEffect(() => {
  //   return () => {
  //     setShowCanvas(false);
  //     cleanupCanvas();
  //   };
  // }, [cleanupCanvas]);

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
        url: `${pageUrls.result}?designBackendId=${draft?.design_id}&from=chat&sessionId=${sessionId}`,
      });
      return;
    }
    if (!draft?.bracelet_image) {
      return;
    }
    Taro.redirectTo({
      url: `${pageUrls.quickDesign}?sessionId=${sessionId}&draftId=${draft?.draft_id
        }&imageUrl=${encodeURIComponent(draft?.bracelet_image)}`,
    });
  };

  const handleDiy = () => {
    if (!draft?.beads || draft?.beads?.length === 0) {
      return;
    }
    Taro.redirectTo({
      url: pageUrls.customDesign + "?sessionId=" + sessionId + "&draftId=" + draft?.draft_id + "&from=chat",
    });
  }

  const viewImage = () => {
    if (!draft.bracelet_image) {
      return;
    }

    Taro.previewImage({
      current: draft.bracelet_image,
      urls: [draft.bracelet_image],
    });
  };

  const handleRegenerate = () => {
    if (!canRegenerate || draft?.design_id || isRegenerating) {
      return;
    }
    setIsRegenerating(true);
    apiSession.regenerateDraft({
      session_id: sessionId || "",
      draft_id: draft?.draft_id || "",
    }).then((res) => {
      setTimeout(() => {
        setIsRegenerating(false);
        startPolling(sessionId || "", draft?.draft_id || "");
      }, 2000);
    }).catch((err) => {
      console.error("重新设计失败:", err);
      setIsRegenerating(false);
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
      {/* 隐藏的Canvas元素，用于绘制手串图像，生成完成后销毁 */}
      {/* {showCanvas && ( */}
      {/* <View style={{
        width: canvasProps.style.width,
        height: canvasProps.style.height,
        visibility: "hidden",
        position: "absolute",
        top: "-999999px",
        left: "-999999px",
        zIndex: -100,
      }}>
          <Canvas
            canvasId={canvasProps.canvasId}
            id={canvasProps.id}
            height={canvasProps.height}
            width={canvasProps.width}
            style={{
              width: canvasProps.style.width,
              height: canvasProps.style.height,
              
            }}
          />
      </View> */}
      {/* )} */}
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
            {canRegenerate && !draft?.design_id && (<View className={styles.regenerateBtn} onClick={handleRegenerate}>
              <Image src={refreshIcon} mode="widthFix" style={{ width: '16px', height: '16px' }} />
              <View className={styles.regenerateBtnText}>{isRegenerating ? "设计中..." : "重新设计"}</View>
            </View>)}
          </View>
          <View className={styles.braceletBgImageContainer} onClick={viewImage}>
            <CircleRingImage
              imageUrl={isRegenerating ? "" : draft.bracelet_image}
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
            text="查看效果"
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
