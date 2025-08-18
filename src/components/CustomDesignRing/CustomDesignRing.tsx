import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { View, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useCircleRingCanvas } from "@/hooks/useCircleRingCanvas";
import { BeadPositionManager, BeadPositionManagerConfig } from "./BeadPositionManager";
import BeadSelector from "../CrystalSelector/BeadSelector";
import MovableBeadRenderer from "./MovableBeadRenderer";
import RingOperationControls from "./RingOperationControls";
import "./styles/CustomDesignRing.scss";
import { LILI_AVATAR_IMAGE_URL } from "@/config";

interface Bead {
  image_url: string;
  render_diameter: number; // 渲染直径
  diameter: number; // 珠子直径
  id?: string | number;
  name?: string; // 可选名称字段
}

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
    imageUrl: string;
    beads: Bead[];
    predictedLength: number;
    selectedBeadIndex: number;
  };
  getImageUrl: () => string;
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
  beadTypeMap = {},
  renderRatio = 2,
  onOk,
}, ref) => {
  const [canvasSize, setCanvasSize] = useState<number>(0);
  const [currentWuxing, setCurrentWuxing] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [createFlag, setCreateFlag] = useState<boolean>(false);

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
    isDifferentSize: true,
    fileType: "png",
  });

  // 初始化画布尺寸
  useEffect(() => {
    try {
      const windowInfo = Taro.getWindowInfo();
      const { height: safeHeight } = windowInfo.safeArea || { height: 0 };
      const predictSize = safeHeight * 0.5 - 16 - 45 - 46 - 16;
      setCanvasSize(!size && predictSize ? predictSize : size || 400);
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

  // 初始化位置管理器
  useEffect(() => {
    if (canvasSize > 0) {
      const config: BeadPositionManagerConfig = {
        canvasSize,
        spacing,
        renderRatio,
        targetRadius: canvasSize / 2 * 0.7,
        maxWristSize: 24,
        minWristSize: 12,
      };

      positionManagerRef.current = new BeadPositionManager(config);

      // 设置初始珠子
      if (beads.length > 0) {
        positionManagerRef.current.setBeads(beads).then(() => {
          const state = positionManagerRef.current?.getState();
          if (state) {
            setPositionManagerState(state);
          }
        });
      }
    }
  }, [canvasSize, spacing, renderRatio, beads]);

  // 监听位置管理器状态变化
  useEffect(() => {
    if (!positionManagerRef.current) return;

    const updateState = () => {
      const state = positionManagerRef.current?.getState();
      if (state) {
        setPositionManagerState(state);
      }
    };

    // 这里可以添加状态监听器
    updateState();
  }, [positionManagerState.beadStatus]);

  // 生成圆环图片
  useEffect(() => {
    if (positionManagerState.beads.length > 0) {
      const dotImageData = positionManagerState.beads.map(dot => ({
        image_url: dot.image_url,
        diameter: dot.diameter,
      }));

      generateCircleRing(dotImageData).then((imageUrl) => {
        const newImageUrl = imageUrl || "";
        setImageUrl(newImageUrl);
      });
    }
  }, [positionManagerState.beads, generateCircleRing]);

  // 处理查看效果
  useEffect(() => {
    if (imageUrl && createFlag) {
      setCreateFlag(false);
      onOk?.(
        imageUrl,
        positionManagerState.beads.map((item) => ({
          id: item.id,
          image_url: item.image_url,
          diameter: item.diameter,
          render_diameter: item.render_diameter,
        }))
      );
    }
  }, [imageUrl, createFlag, positionManagerState.beads, onOk]);

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    getState: () => ({
      imageUrl,
      beads: positionManagerState.beads.map((item) => ({
        id: item.id,
        image_url: item.image_url,
        diameter: item.diameter,
        render_diameter: item.render_diameter,
      })),
      predictedLength: positionManagerState.predictedLength,
      selectedBeadIndex: positionManagerState.selectedBeadIndex,
    }),
    getImageUrl: () => imageUrl,
    getBeads: () => positionManagerState.beads.map((item) => ({
      id: item.id,
      image_url: item.image_url,
      diameter: item.diameter,
      render_diameter: item.render_diameter,
    })),
    getPredictedLength: () => positionManagerState.predictedLength,
    getSelectedBeadIndex: () => positionManagerState.selectedBeadIndex,
  }), [imageUrl, positionManagerState.beads, positionManagerState.predictedLength, positionManagerState.selectedBeadIndex]);

  // 处理珠子点击
  const handleBeadClick = useCallback(async (bead: {
    id?: string | number;
    name: string;
    image_url: string;
    diameter: number;
  }) => {
    if (!positionManagerRef.current) return;

    try {
      // 转换为Bead类型
      const beadData: Bead = {
        ...bead,
        render_diameter: bead.diameter * renderRatio,
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

  // 处理五行类型变化
  const handleWuxingChange = useCallback((wuxing: string) => {
    setCurrentWuxing(wuxing);
  }, []);

  // 处理查看效果
  const handleViewEffect = useCallback(() => {
    setCreateFlag(true);
  }, []);

  // 处理珠子拖拽结束
  const handleBeadDragEnd = useCallback(async (beadIndex: number, newX: number, newY: number) => {
    if (!positionManagerRef.current) return;

    try {
      await positionManagerRef.current.dragBeadToPosition(beadIndex, newX, newY);
      const state = positionManagerRef.current.getState();
      setPositionManagerState(state);

    } catch (error) {
      if (error instanceof Error) {
        Taro.showToast({
          title: error.message || "拖拽失败",
          icon: "none",
          duration: 2500,
        });
      }
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
            {`你的喜用神为【${wuxing?.join('')}】`}
          </View>
        </View>
        <View
          className={`view-effect-button ${!imageUrl ? 'disabled' : ''}`}
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
        </View>
      </View>

      {/* 底部珠子选择器 */}
      <View className="custom-design-ring-bottom-container">
        <BeadSelector
          beadTypeMap={beadTypeMap}
          currentWuxing={currentWuxing}
          renderRatio={renderRatio}
          predictedLength={positionManagerState.predictedLength}
          onWuxingChange={handleWuxingChange}
          onBeadClick={handleBeadClick}
        />
      </View>
    </View>
  );
});

export default React.memo(CustomDesignRing);
