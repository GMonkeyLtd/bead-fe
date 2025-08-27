import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { View, Image, MovableArea } from "@tarojs/components";
import Taro, { base64ToArrayBuffer } from "@tarojs/taro";
import { useCircleRingCanvas } from "@/hooks/useCircleRingCanvas";
import { BeadPositionManager, BeadPositionManagerConfig } from "./BeadPositionManager";
import BeadSelector from "../CrystalSelector/BeadSelector";
import MovableBeadRenderer from "./MovableBeadRenderer";
import RingOperationControls from "./RingOperationControls";
import "./styles/CustomDesignRing.scss";
import { LILI_AVATAR_IMAGE_URL } from "@/config";
import { AccessoryType } from "@/utils/api-session";
import { AccessoryItem } from "@/utils/api-session";
import { Bead } from "../../../types/crystal";
import { SPU_TYPE } from "@/pages-design/custom-design";
import { imageToBase64 } from "@/utils/imageUtils";
import HistoryOperations from "./HistoryOperations";

interface BeadType {
  name: string;
  beadList: {
    id?: string | number;
    name: string;
    image_url: string;
    diameter: number;
  }[];
}

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
}

/**
 * CustomDesignRing 组件 - 重构版本
 * 使用模块化的子组件和工具类，提升代码可维护性
 */
const CustomDesignRing = forwardRef<CustomDesignRingRef, CustomDesignRingProps>(({
  beads = [],
  wuxing = [],
  size,
  spacing = 0,
  accessoryTypeMap = {},
  beadTypeMap = {},
  renderRatio = 2,
  onOk,
}, ref) => {
  const [canvasSize, setCanvasSize] = useState<number>(0);
  const [currentWuxing, setCurrentWuxing] = useState<string>("");
  const [currentAccessoryType, setCurrentAccessoryType] = useState<AccessoryType | ''>("");
  const [imageUrl, setImageUrl] = useState<string>("");

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

  const { generateCircleRing } = useCircleRingCanvas({
    targetSize: 1024,
    fileType: "png",
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
    if (allWuxing.length > 0) {
      setCurrentWuxing(allWuxing[0]); // 默认选择"土"模式
    }
  }, [beadTypeMap]);


  const initBeads = useCallback(async (beads: Bead[]) => {

    if (!canvasSize || canvasSize <= 0) {
      console.warn('canvasSize is not ready:', canvasSize);
      return;
    }

    if (!beads || beads.length === 0) {
      console.warn('beads is empty:', beads);
      return;
    }

    const config: BeadPositionManagerConfig = {
      canvasSize,
      spacing,
      renderRatio,
      targetRadius: canvasSize / 2 * 0.7,
      maxWristSize: 24,
      minWristSize: 8,
      enableHistory: true,
      maxHistoryLength: 50,
    };

    positionManagerRef.current = new BeadPositionManager(config);

    try {
      if (positionManagerRef.current) {
        await positionManagerRef.current.setBeads(beads, true);
        const state = positionManagerRef.current.getState();
        if (state) {
          setPositionManagerState(state);
        }
      }
    } catch (error) {
      console.error('Error in initBeads:', error);
    }
  }, [canvasSize, spacing, renderRatio]);

  // 初始化位置管理器
  useEffect(() => {
    if (canvasSize > 0 && beads.length > 0) {
      initBeads(beads);
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

  // 处理查看效果
  const handleViewEffect = useCallback(() => {
    if (positionManagerState.beads.length > 0) {
      const dotImageData = positionManagerState.beads.map(dot => ({
        image_url: dot.image_url,
        diameter: dot.diameter,
        width: dot.width,
        image_aspect_ratio: dot.image_aspect_ratio,
        isFloatAccessory: dot.spu_type === SPU_TYPE.ACCESSORY && !dot.width,
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
        onOk?.(
          newImageUrl,
          positionManagerState.beads
        );
      });
    }

  }, [positionManagerState.beads, onOk, generateCircleRing]);

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    getState: () => ({
      beads: positionManagerState.beads,
      predictedLength: positionManagerState.predictedLength,
      selectedBeadIndex: positionManagerState.selectedBeadIndex,
    }),
    generateBraceletImage: () => generateCircleRing(positionManagerState.beads),
    getBeads: () => positionManagerState.beads,
    getPredictedLength: () => positionManagerState.predictedLength,
    getSelectedBeadIndex: () => positionManagerState.selectedBeadIndex,
  }), [imageUrl, positionManagerState.beads, positionManagerState.predictedLength, positionManagerState.selectedBeadIndex]);

  // 处理珠子点击
  const handleBeadClick = useCallback(async (bead: {
    id?: string | number;
    name: string;
    image_url: string;
    diameter: number;
    image_aspect_ratio?: number;
  }) => {
    if (!positionManagerRef.current) return;
    try {
      // 转换为Bead类型
      const beadData: Bead = {
        ...bead,
        width: bead.diameter, // 添加必需的width属性
        id: bead.id || `bead_${Date.now()}`, // 确保id不为undefined
      };

      if (positionManagerState.selectedBeadIndex === -1) {
        // 添加新珠子
        await positionManagerRef.current.addBead(beadData);
      } else {
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
  }, [positionManagerState.selectedBeadIndex, renderRatio]);

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
      await positionManagerRef.current.moveBead('clockwise');
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
      await positionManagerRef.current.moveBead('counterclockwise');
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

  // 处理拖拽删除
  const handleBeadDelete = useCallback(async (beadIndex: number) => {
    if (!positionManagerRef.current) return;

    try {
      // 先选中要删除的珠子，然后删除
      positionManagerRef.current.selectBead(beadIndex);
      await positionManagerRef.current.removeBead();
      const state = positionManagerRef.current.getState();
      setPositionManagerState(state);

      Taro.showToast({
        title: "删除成功",
        icon: "success",
        duration: 1500,
      });
    } catch (error) {
      if (error instanceof Error) {
        Taro.showToast({
          title: error.message || "删除失败",
          icon: "none",
          duration: 2000,
        });
      }
    }
  }, []);

  // 处理五行类型变化
  const handleWuxingChange = useCallback((wuxing: string) => {
    setCurrentWuxing(wuxing);
  }, []);

  // 处理珠子拖拽结束
  const handleBeadDragEnd = useCallback(async (beadIndex: number, newX: number, newY: number) => {
    if (!positionManagerRef.current) return;

    try {
      const result = await positionManagerRef.current.dragBeadToPosition(beadIndex, newX, newY);
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
  }, []);

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
  const handlePreviewInsertPosition = useCallback((beadIndex: number, newX: number, newY: number) => {
    if (!positionManagerRef.current) {
      return { isValid: false, message: "位置管理器未初始化" };
    }

    return positionManagerRef.current.previewInsertionPosition(beadIndex, newX, newY);
  }, []);

  // 清理资源
  useEffect(() => {
    return () => {
      if (positionManagerRef.current) {
        positionManagerRef.current.cleanup();
      }
    };
  }, []);

  return (
    <View className="custom-design-ring-container">
      {/* 顶部内容区域 */}
      <View className="custom-design-ring-tip-container">
        <View className="custom-design-ring-tip-content-container">
          <View className="custom-design-ring-tip-content-prefix">
            <Image
              src={LILI_AVATAR_IMAGE_URL}
              className="custom-design-ring-lili-avatar"
            />
          </View>
          <View className="custom-design-ring-tip-content">
            <View>{`你的喜用神为`}</View>
            <View className="custom-design-ring-tip-tag">
              {wuxing?.join('')}
            </View>
          </View>
        </View>
        <View
          className={`view-effect-button`}
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
          {/* Canvas渲染器 */}
          <View
            style={{
              position: "relative",
              height: `${canvasSize}px`,
              width: `${canvasSize}px`,
            }}
          >
            <View className="custom-design-ring-wrist-length-container">
              <View className="custom-design-ring-wrist-length-content-prefix">
                适合手围：
              </View>
              <View className="custom-design-ring-wrist-length-content-value">
                {positionManagerState.predictedLength} ~ {positionManagerState.predictedLength + 0.5}cm
              </View>
            </View>
            {/* <Image className="custom-crystal-backend" src={CUSTOM_CRYSTAL_BACKEND_IMAGE} style={{ width: `${canvasSize}px`, height: `${canvasSize}px` }} /> */}
            <MovableBeadRenderer
              style={{
                position: "absolute",
                top: 0,
                left: 0,
              }}
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
          />
          <HistoryOperations
            canUndo={positionManagerRef.current?.canUndo() || false}
            canRedo={positionManagerRef.current?.canRedo() || false}
            onHistoryBack={handleHistoryBack}
            onHistoryForward={handleHistoryForward}
          />
        </View>
      </View>

      {/* 底部珠子选择器 */}
      <View className="custom-design-ring-bottom-container">
        <BeadSelector
          accessoryTypeMap={accessoryTypeMap as Record<AccessoryType, AccessoryItem[]>}
          beadTypeMap={beadTypeMap}
          currentWuxing={currentWuxing}
          currentAccessoryType={currentAccessoryType}
          renderRatio={renderRatio}
          predictedLength={positionManagerState.predictedLength}
          onWuxingChange={handleWuxingChange}
          onAccessoryTypeChange={setCurrentAccessoryType}
          onBeadClick={handleBeadClick}
        />
      </View>
    </View>
  );
});

export default React.memo(CustomDesignRing);
