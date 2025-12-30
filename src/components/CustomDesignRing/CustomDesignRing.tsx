import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react";
import { View, Image, MovableArea, Canvas } from "@tarojs/components";
import Taro, { base64ToArrayBuffer } from "@tarojs/taro";
import { useCircleRingCanvas } from "@/hooks/useCircleRingCanvas";
import {
  BeadPositionManager,
  BeadPositionManagerConfig,
} from "./BeadPositionManager";
import BeadSelector, { BeadType } from "../CrystalSelector/BeadSelector";
import MovableBeadRenderer from "./MovableBeadRenderer";
import RingOperationControls from "./RingOperationControls";
import "./styles/CustomDesignRing.scss";
import { LILI_AVATAR_IMAGE_URL } from "@/config";
import { AccessoryType } from "@/utils/api-session";
import { AccessoryItem } from "@/utils/api-session";
import { Bead } from "../../../types/crystal";
import { SPU_TYPE } from "@/pages-design/custom-design";
import HistoryOperations from "./HistoryOperations";
import BeadSizeSelector from "../BeadSizeSelector";
import tutorialIcon from "@/assets/icons/tutorial.svg";
import questionIcon from "@/assets/icons/question.svg";
import shengchenActiveIcon from "@/assets/icons/shengchen-active.svg";
import shengchenInactiveIcon from "@/assets/icons/shengchen-inactive.svg";
import ImagePreviewModal from "../ImagePreviewModal";
import BraceletDetailDialog from "../BraceletDetailDialog";

// 定义ref暴露的接口
export interface CustomDesignRingRef {
  getState: () => {
    beads: Bead[];
    predictedLength: number;
    selectedBeadIndex: number;
  };
  generateBraceletImage: () => Promise<string | null>;
  getBeads: () => Bead[];
  getPredictedLength: () => number;
  getSelectedBeadIndex: () => number;
}

interface CustomDesignRingProps {
  beads: Bead[];
  wuxing: string[];
  canvasId?: string;
  size?: number;
  spacing?: number;
  accessoryTypeMap?: Record<AccessoryType, AccessoryItem[]>;
  beadTypeMap?: Record<string, BeadType[]>;
  renderRatio?: number;
  onOk?: (imageUrl: string, editedBeads: Bead[]) => void;
  onChange?: (imageUrl: string, editedBeads: Bead[]) => void;
  showTutorial?: () => void;
  onBirthClick?: () => void;
  isBirthSet?: boolean;
}

/**
 * CustomDesignRing 组件 - 重构版本
 * 使用模块化的子组件和工具类，提升代码可维护性
 */
const CustomDesignRing = forwardRef<CustomDesignRingRef, CustomDesignRingProps>(
  (
    {
      beads = [],
      wuxing = [],
      size,
      spacing = 0,
      accessoryTypeMap = {},
      beadTypeMap = {},
      renderRatio = 2,
      onOk,
      showTutorial,
      onBirthClick,
      isBirthSet = false,
    },
    ref
  ) => {
    const [canvasSize, setCanvasSize] = useState<number>(0);
    const [currentWuxing, setCurrentWuxing] = useState<string>("");
    const [currentAccessoryType, setCurrentAccessoryType] = useState<
      AccessoryType | ""
    >("");
    const [imageUrl, setImageUrl] = useState<string>("");
    const [beadSizeList, setBeadSizeList] = useState<number[]>([
      8, 10, 12, 13, 14, 15,
    ]);
    const [currentBeadSize, setCurrentBeadSize] = useState<number>(10);
    const [detailBeadItem, setDetailBeadItem] = useState<Bead | null>(null);
    const [showBeadsDetailDialog, setShowBeadsDetailDialog] =
      useState<boolean>(false);

    // 稳定化 beadPositionConfig，避免不必要的重新初始化
    const beadPositionConfig = useMemo<BeadPositionManagerConfig>(
      () => ({
        canvasSize,
        spacing,
        renderRatio,
        targetRadius: (canvasSize / 2) * 0.6,
        maxWristSize: 24,
        minWristSize: 8,
        enableHistory: true,
        maxHistoryLength: 10,
        displayScale: 3.4,
      }),
      [canvasSize, spacing, renderRatio]
    );

    // 使用珠子位置管理器
    const positionManagerRef = useRef<BeadPositionManager | null>(null);
    const [positionManagerState, setPositionManagerState] = useState<{
      beads: any[];
      selectedBeadIndex: number;
      predictedLength: number;
      beadStatus: "idle" | "processing" | "success" | "error";
    }>({
      beads: [],
      selectedBeadIndex: -1,
      predictedLength: 0,
      beadStatus: "idle",
    });

    const { generateCircleRing, canvasProps } = useCircleRingCanvas({
      targetSize: 640,
      fileType: "png",
      canvasId: "custom-design-ring-canvas",
    });

    // 初始化画布尺寸
    useEffect(() => {
      if (size) {
        setCanvasSize(size);
        return;
      }
      try {
        const windowInfo = Taro.getWindowInfo();
        const { height: safeHeight } = windowInfo.safeArea || { height: 0 };
        const predictSize = safeHeight * 0.5 - 16 - 45 - 46 - 16;
        setCanvasSize(predictSize ? predictSize : size || 400);
      } catch (error) {
        console.warn("Failed to get window info:", error);
        const fallbackSize = 400;
        setCanvasSize(!size ? fallbackSize : size);
      }
    }, [size]);

    // 初始化五行类型
    useEffect(() => {
      const allWuxing = Object.keys(beadTypeMap);
      if (allWuxing.length > 0 && !currentWuxing) {
        if (beadTypeMap['推荐']) {
          setCurrentWuxing("推荐");
        } else {
          setCurrentWuxing("金"); // 默认选择"金"模式
        }
      }
    }, [beadTypeMap, currentWuxing]);

    const beadsTotalPrice = useMemo(() => {
      return positionManagerState.beads?.reduce((acc, bead) => {
        return acc + (bead.reference_price || 0);
      }, 0);
    }, [positionManagerState.beads]);

    const initBeads = useCallback(
      async (beads: Bead[]) => {
        if (!canvasSize || canvasSize <= 0) {
          console.warn("canvasSize is not ready:", canvasSize);
          return;
        }

        // 只有在没有实例或者配置发生变化时才创建新实例
        if (!positionManagerRef.current) {
          positionManagerRef.current = new BeadPositionManager(
            beadPositionConfig
          );
        }

        if (!beads || beads.length === 0) {
          console.warn("beads is empty:", beads);
          // 即使珠子为空，也要保持现有状态，不要重置
          return;
        }

        try {
          if (positionManagerRef.current) {
            await positionManagerRef.current.setBeads(beads);
            const state = positionManagerRef.current.getState();
            if (state) {
              setPositionManagerState(state);
            }
          }
        } catch (error) {
          console.error("Error in initBeads:", error);
        }
      },
      [beadPositionConfig]
    );

    // 初始化位置管理器 - 只在必要时重新初始化
    useEffect(() => {
      if (canvasSize > 0) {
        // 如果已经有实例且珠子数据相同，则不重新初始化
        const currentBeads = positionManagerRef.current?.getState()?.beads;
        const beadsChanged =
          JSON.stringify(currentBeads) !== JSON.stringify(beads);

        if (!positionManagerRef.current || beadsChanged) {
          initBeads(beads);
        }
      }
    }, [canvasSize, beads, initBeads]);

    // 监听位置管理器状态变化
    useEffect(() => {
      if (!positionManagerRef.current) return;

      const updateState = () => {
        const state = positionManagerRef.current?.getState();
        if (state && positionManagerRef.current) {
          setPositionManagerState(state);
        }
      };

      // 这里可以添加状态监听器
      updateState();
    }, [positionManagerState.beadStatus]);

    const getBeadCluster = (bead: Bead) => {
      const { spu_type, wuxing, spu_id, type } = bead;
      const belongTo =
        spu_type === SPU_TYPE.BEAD
          ? beadTypeMap[wuxing[0] as string]
          : accessoryTypeMap[type as string];
      const typeBeads = belongTo?.find((item) => item.id === spu_id);
      return typeBeads;
    };

    // 选中珠子变化联动显示对应珠子可选尺寸范围
    useEffect(() => {
      if (positionManagerState.selectedBeadIndex === -1) return;
      const currentSelectedBead =
        positionManagerState.beads[positionManagerState.selectedBeadIndex];

      const newBeadCluster = getBeadCluster(currentSelectedBead);
      setBeadSizeList(newBeadCluster?.beadSizeList || []);
      setCurrentBeadSize(currentSelectedBead?.diameter || 0);
    }, [positionManagerState.selectedBeadIndex, beadTypeMap, accessoryTypeMap]);

    // 处理查看效果
    const handleViewEffect = useCallback(() => {
      Taro.reportEvent("diy_event", {
        view_diy_result: 1,
      });
      if (positionManagerState.predictedLength < 13) {
        Taro.showToast({
          title: "哎呀，珠子有点少啦！一般手围建议至少不少于13cm噢。",
          icon: "none",
          duration: 2000,
        });
        return;
      }
      if (positionManagerState.beads.length > 0) {
        const dotImageData = positionManagerState.beads.map((dot) => ({
          image_url: dot.image_url,
          diameter: dot.diameter,
          width: dot.width,
          image_aspect_ratio: dot.image_aspect_ratio,
          hole_postion: dot.hole_postion,
          display_width: dot.display_width,
          isFloatAccessory:
            dot.spu_type === SPU_TYPE.ACCESSORY &&
            (!dot.width || (dot.hole_postion && dot.hole_postion !== 0.5)),
        }));
        generateCircleRing(dotImageData).then((imageUrl) => {
          const newImageUrl = imageUrl || "";
          // Taro.previewImage({
          //   urls: [newImageUrl],
          // });
          // imageToBase64(newImageUrl, true, false, undefined, 'png')
          // .then(base64 => {
          //   // 将base64复制到剪贴板
          //   Taro.setClipboardData({
          //     data: base64,
          //     success: () => {
          //       console.log('base64复制到剪贴板成功')
          //     }
          //   })
          // })
          onOk?.(newImageUrl, positionManagerState.beads);
        });
      }
    }, [positionManagerState.beads, onOk, generateCircleRing]);

    // 暴露方法给父组件
    useImperativeHandle(
      ref,
      () => ({
        getState: () => ({
          beads: positionManagerState.beads,
          predictedLength: positionManagerState.predictedLength,
          selectedBeadIndex: positionManagerState.selectedBeadIndex,
        }),
        generateBraceletImage: () =>
          generateCircleRing(positionManagerState.beads),
        getBeads: () => positionManagerState.beads,
        getPredictedLength: () => positionManagerState.predictedLength,
        getSelectedBeadIndex: () => positionManagerState.selectedBeadIndex,
      }),
      [
        imageUrl,
        positionManagerState.beads,
        positionManagerState.predictedLength,
        positionManagerState.selectedBeadIndex,
      ]
    );

    // 处理珠子点击
    const processBeadClick = useCallback(
      async (
        bead: {
          id?: string | number;
          name: string;
          image_url: string;
          diameter: number;
          image_aspect_ratio?: number;
        },
        action: "add" | "replace"
      ) => {
        if (!positionManagerRef.current) return;
        try {
          // 转换为Bead类型
          const beadData: Bead = {
            ...bead,
            id: bead.id || `bead_${Date.now()}`, // 确保id不为undefined
          };

          if (action === "add") {
            // 添加新珠子
            await positionManagerRef.current.addBead(beadData);
          } else if (
            action === "replace" &&
            positionManagerState.selectedBeadIndex !== -1
          ) {
            // 替换选中的珠子
            await positionManagerRef.current.replaceBead(beadData);
          }

          // 更新状态
          const state = positionManagerRef.current.getState();
          setPositionManagerState(state);
        } catch (error) {
          if (error instanceof Error) {
            Taro.showToast({
              title: error.message,
              icon: "none",
              duration: 3000,
            });
          }
        }
      },
      [positionManagerState.selectedBeadIndex, renderRatio]
    );

    const handleBeadClick = useCallback(
      async (bead: BeadType, action: "add" | "replace" | "select") => {
        if (action === "select") {
          setBeadSizeList(bead.beadSizeList);
          setCurrentBeadSize(bead.diameter);
          return;
        }
        setBeadSizeList(bead.beadSizeList);
        const newBeadSize = bead.beadSizeList.includes(currentBeadSize)
          ? currentBeadSize
          : bead.beadSizeList.includes(10)
            ? 10
            : bead.beadSizeList[0];
        setCurrentBeadSize(newBeadSize);
        const newBead = bead.beadList.find(
          (item) => item.diameter === newBeadSize
        );
        processBeadClick(newBead as Bead, action);
      },
      [processBeadClick, currentBeadSize]
    );

    // 处理珠子选择
    const handleBeadSelect = useCallback((index: number) => {
      if (positionManagerRef.current) {
        positionManagerRef.current.selectBead(index);
        const state = positionManagerRef.current.getState();
        setPositionManagerState(state);
      }
    }, []);

    // 处理珠子取消选择
    const handleBeadDeselect = useCallback(() => {
      if (positionManagerRef.current) {
        positionManagerRef.current.deselectBead();
        const state = positionManagerRef.current.getState();
        setPositionManagerState(state);
      }
    }, []);

    // 处理珠子移动
    const handleClockwiseMove = useCallback(async () => {
      if (!positionManagerRef.current) return;

      try {
        await positionManagerRef.current.moveBead("clockwise");
        const state = positionManagerRef.current.getState();
        setPositionManagerState(state);
      } catch (error) {
        if (error instanceof Error) {
          Taro.showToast({
            title: error.message,
            icon: "none",
          });
        }
      }
    }, []);

    const handleCounterclockwiseMove = useCallback(async () => {
      if (!positionManagerRef.current) return;

      try {
        await positionManagerRef.current.moveBead("counterclockwise");
        const state = positionManagerRef.current.getState();
        setPositionManagerState(state);
      } catch (error) {
        if (error instanceof Error) {
          Taro.showToast({
            title: error.message,
            icon: "none",
          });
        }
      }
    }, []);

    // 处理珠子删除
    const handleDelete = useCallback(async () => {
      if (!positionManagerRef.current) return;

      try {
        await positionManagerRef.current.removeBead();
        const state = positionManagerRef.current.getState();
        setPositionManagerState(state);
      } catch (error) {
        if (error instanceof Error) {
          Taro.showToast({
            title: error.message,
            icon: "none",
          });
        }
      }
    }, []);

    // 处理五行类型变化
    const handleWuxingChange = useCallback((wuxing: string) => {
      setCurrentWuxing(wuxing);
    }, []);

    // 处理珠子拖拽结束
    const handleBeadDragEnd = useCallback(
      async (beadIndex: number, newX: number, newY: number) => {
        if (!positionManagerRef.current) return;

        try {
          const result = await positionManagerRef.current.dragBeadToPosition(
            beadIndex,
            newX,
            newY
          );
          const state = positionManagerRef.current.getState();
          setPositionManagerState(state);

          // 如果拖拽失败，抛出错误以触发MovableBeadRenderer中的恢复逻辑
          if (!result.success) {
            throw new Error(result.message || "拖拽失败");
          }
        } catch (error) {
          if (error instanceof Error) {
            // 确保错误信息已经显示过Toast，避免重复显示
            if (!error.message.includes("拖拽失败")) {
              Taro.showToast({
                title: error.message || "拖拽失败",
                icon: "none",
                duration: 2500,
              });
            }
            // 重新抛出错误，让MovableBeadRenderer处理位置恢复
            throw error;
          }
        }
      },
      []
    );

    // 处理历史记录回退
    const handleHistoryBack = useCallback(async () => {
      if (!positionManagerRef.current) return;

      try {
        const previousState = positionManagerRef.current.undo();
        if (previousState) {
          setPositionManagerState(previousState);
        }
      } catch (error) {
        Taro.showToast({
          title: "撤销失败",
          icon: "none",
          duration: 2000,
        });
      }
    }, []);

    // 处理历史记录前进
    const handleHistoryForward = useCallback(async () => {
      if (!positionManagerRef.current) return;

      try {
        const nextState = positionManagerRef.current.redo();
        if (nextState) {
          setPositionManagerState(nextState);
        }
      } catch (error) {
        Taro.showToast({
          title: "重做失败",
          icon: "none",
          duration: 2000,
        });
      }
    }, []);

    // 处理插入位置预览
    const handlePreviewInsertPosition = useCallback(
      (beadIndex: number, newX: number, newY: number) => {
        if (!positionManagerRef.current) {
          return { isValid: false, message: "位置管理器未初始化" };
        }

        return positionManagerRef.current.previewInsertionPosition(
          beadIndex,
          newX,
          newY
        );
      },
      []
    );

    // 清理资源 - 增强版
    useEffect(() => {
      return () => {
        if (positionManagerRef.current) {
          positionManagerRef.current.cleanup();
          positionManagerRef.current = null;
        }
      };
    }, []);

    const handleBeadSizeChange = useCallback(
      (size: number) => {
        if (positionManagerState.selectedBeadIndex === -1) {
          return;
        }
        setCurrentBeadSize(size);
        const currentSelectedBead =
          positionManagerState.beads[positionManagerState.selectedBeadIndex];
        const newBeadCluster = getBeadCluster(currentSelectedBead);
        const newBead = newBeadCluster?.beadList.find(
          (item) => item.diameter === size
        );
        if (newBead) {
          processBeadClick(newBead, "replace");
        }
      },
      [
        positionManagerState.selectedBeadIndex,
        processBeadClick,
        positionManagerState.beads,
        getBeadCluster,
      ]
    );

    const handleBeadImageClick = useCallback((bead: Bead) => {
      setDetailBeadItem(bead);
    }, []);

    const handleDiyInspirationResponse = useCallback(
      async (diyInspiration: any) => {
        if (diyInspiration.length > 0) {
          if (!positionManagerRef.current) return;

          try {
            await positionManagerRef.current.setBeads(diyInspiration);
            const state = positionManagerRef.current.getState();
            setPositionManagerState(state);
            Taro.showToast({
              title: "已添加灵感",
              icon: "none",
            });
          } catch (error) {
            if (error instanceof Error) {
              Taro.showToast({
                title: error.message,
                icon: "none",
              });
            }
          }
        }
      },
      []
    );

    return (
      <View className="custom-design-ring-container">
        {/* 顶部内容区域 */}
        <View
          className="custom-design-ring-tip-container"
          style={{
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <View className="custom-design-ring-tip-left" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {beadsTotalPrice > 0 && (
              <View className="custom-design-ring-tip-content-container">
                <View className="custom-design-ring-tip-content-prefix">
                  <Image
                    src={LILI_AVATAR_IMAGE_URL}
                    className="custom-design-ring-lili-avatar"
                  />
                </View>
                <View
                  className="custom-design-ring-tip-content"
                  onClick={() => setShowBeadsDetailDialog(true)}
                >
                  <View
                    style={{ display: "flex", alignItems: "center", gap: "2px" }}
                  >
                    <View>{`总价：`}</View>
                    <View
                      style={{
                        fontSize: "13px",
                        fontWeight: "bold",
                        color: "#9c560f",
                      }}
                    >{`${Math.floor(beadsTotalPrice / 100)}`}</View>
                    <View>{`元`}</View>
                  </View>
                  <Image
                    src={questionIcon}
                    className="custom-design-ring-question-icon"
                    style={{ width: "14px", height: "14px" }}
                  />
                </View>
              </View>
            )}
          </View>

          <View
            className={`view-effect-button ${positionManagerState.predictedLength < 13 ? "disabled" : ""
              }`}
            onClick={handleViewEffect}
          >
            查看效果
          </View>
        </View>
        <View
          className="custom-design-ring-top-container"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            height: `${canvasSize + 48}px`,
          }}
          onClick={handleBeadDeselect}
        >
          <View className="custom-design-ring-top-content">
            <View
              onClick={onBirthClick}
              className="birth-button-container"
            >
              <View className="birth-icon-wrapper">
                <Image
                  src={isBirthSet ? shengchenActiveIcon : shengchenInactiveIcon}
                  className="birth-icon"
                />
              </View>
              <View className={`birth-button-text ${isBirthSet ? 'active' : 'inactive'}`}>
                生辰
              </View>
            </View>

            <View
              onClick={() => {
                Taro.reportEvent("diy_event", {
                  view_tutorial: 1,
                });
                showTutorial?.();
              }}
              className="custom-design-ring-tutorial-container"
            >
              <Image
                src={tutorialIcon}
                className="custom-design-ring-tutorial-icon"
                style={{ width: "18px", height: "18px" }}
              />
              <View className="custom-design-ring-tutorial-text">教程</View>
            </View>
            {/* Canvas渲染器 */}
            <View
              style={{
                position: "relative",
                height: `${canvasSize}px`,
                width: `${canvasSize}px`,
              }}
            >
              {positionManagerState.beads?.length > 0 && (
                <View className="custom-design-ring-wrist-length-container">
                  <View className="custom-design-ring-wrist-length-content-prefix">
                    适合手围：
                  </View>
                  <View className="custom-design-ring-wrist-length-content-value">
                    {positionManagerState.predictedLength?.toFixed(1)} ~{" "}
                    {(positionManagerState.predictedLength + 0.5)?.toFixed(1)}cm
                  </View>
                </View>
              )}
              {/* <Image className="custom-crystal-backend" src={CUSTOM_CRYSTAL_BACKEND_IMAGE} style={{ width: `${canvasSize}px`, height: `${canvasSize}px` }} /> */}
              <Canvas {...canvasProps} />
              <MovableBeadRenderer
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                }}
                targetRadius={beadPositionConfig.targetRadius}
                beads={positionManagerState.beads}
                selectedBeadIndex={positionManagerState.selectedBeadIndex}
                canvasSize={canvasSize}
                onBeadSelect={handleBeadSelect}
                onBeadDeselect={handleBeadDeselect}
                onBeadDragEnd={handleBeadDragEnd}
                onPreviewInsertPosition={handlePreviewInsertPosition}
              />
            </View>

            {/* 操作控制 */}
            <RingOperationControls
              selectedBeadIndex={positionManagerState.selectedBeadIndex}
              onClockwiseMove={handleClockwiseMove}
              onCounterclockwiseMove={handleCounterclockwiseMove}
              onDelete={handleDelete}
              enableRotate={positionManagerState.predictedLength >= 13}
            />
            <HistoryOperations
              canUndo={positionManagerRef.current?.canUndo() || false}
              canRedo={positionManagerRef.current?.canRedo() || false}
              onHistoryBack={handleHistoryBack}
              onHistoryForward={handleHistoryForward}
              onDiyInspirationResponse={handleDiyInspirationResponse}
              wuxing={wuxing}
            />
          </View>
        </View>

        {/* 底部珠子选择器 */}
        <View
          className="custom-design-ring-bottom-container"
          style={{ height: `calc(100% - ${canvasSize}px - 60px)` }}
        >
          <View className="custom-design-bead-size-selector-container">
            <View className="custom-design-bead-size-selector-title-container">
              <View className="custom-design-bead-size-selector-title">
                {/**展示当前选中珠子的名称 */}
                {positionManagerState.beads?.[
                  positionManagerState.selectedBeadIndex
                ]?.name &&
                  `${positionManagerState.beads?.[
                    positionManagerState.selectedBeadIndex
                  ]?.name
                  }`}
              </View>
              <View className="custom-design-bead-size-selector-price">
                {/**展示当前选中珠子的价格 */}
                {positionManagerState.beads?.[
                  positionManagerState.selectedBeadIndex
                ]?.reference_price &&
                  `（${(
                    positionManagerState.beads?.[
                      positionManagerState.selectedBeadIndex
                    ]?.reference_price / 100
                  ).toFixed(1)}元）:`}
              </View>
            </View>
            {positionManagerState.selectedBeadIndex === -1 ? (
              <View className="custom-design-bead-size-selector-tip">
                请先选择珠子
              </View>
            ) : (
              <BeadSizeSelector
                value={currentBeadSize}
                options={beadSizeList}
                onChange={handleBeadSizeChange}
              />
            )}
          </View>
          <BeadSelector
            accessoryTypeMap={
              accessoryTypeMap as Record<AccessoryType, AccessoryItem[]>
            }
            beadTypeMap={beadTypeMap}
            currentWuxing={currentWuxing}
            currentAccessoryType={currentAccessoryType}
            renderRatio={renderRatio}
            recommendWuxing={wuxing}
            predictedLength={positionManagerState.predictedLength}
            onWuxingChange={handleWuxingChange}
            onAccessoryTypeChange={setCurrentAccessoryType}
            onBeadClick={handleBeadClick}
            onBeadImageClick={handleBeadImageClick}
            currentSelectedBead={
              positionManagerState.beads?.[
              positionManagerState.selectedBeadIndex
              ]
            }
          />
          {/* 图片预览弹窗 */}
          <ImagePreviewModal
            visible={!!detailBeadItem?.image_url}
            imageUrl={detailBeadItem?.image_url || ""}
            title={detailBeadItem?.name}
            onClose={() => setDetailBeadItem(null)}
            imageNeedRotate={detailBeadItem?.type === AccessoryType.GuaShi}
          />
          {showBeadsDetailDialog && (
            <BraceletDetailDialog
              visible={showBeadsDetailDialog}
              beads={positionManagerState.beads}
              title="水晶明细"
              showPrice={true}
              onClose={() => setShowBeadsDetailDialog(false)}
            />
          )}
        </View>
      </View>
    );
  }
);

export default React.memo(CustomDesignRing);
