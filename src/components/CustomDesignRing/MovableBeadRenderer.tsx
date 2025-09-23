import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  startTransition,
} from "react";
import {
  View,
  MovableArea,
  MovableView,
  Image,
} from "@tarojs/components";
import { BeadWithPosition, Position } from "../../../types/crystal";
import "./styles/MovableBeadRenderer.scss";
import { SPU_TYPE } from "@/pages-design/custom-design";

// 优化的节流函数 - 使用RAF提升性能
const throttleWithRAF = (func: Function, wait: number = 16) => {
  let timeout: any = null;
  let rafId: number | null = null;
  let previous = 0;
  
  return function (...args: any[]) {
    const now = Date.now();
    const remaining = wait - (now - previous);
    
    if (remaining <= 0) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      
      previous = now;
      // 使用RAF确保在下一帧执行
      rafId = requestAnimationFrame(() => {
        func.apply(this, args);
        rafId = null;
      });
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
        rafId = requestAnimationFrame(() => {
          func.apply(this, args);
          rafId = null;
        });
      }, remaining);
    }
  };
};

interface MovableBeadRendererProps {
  beads: Position[];
  selectedBeadIndex: number;
  canvasSize: number;
  targetRadius: number;
  onBeadSelect: (index: number) => void;
  onBeadDeselect: () => void;
  onBeadDragEnd: (beadIndex: number, newX: number, newY: number) => void;
  onPreviewInsertPosition?: (beadIndex: number, newX: number, newY: number) => {
    isValid: boolean;
    insertIndex?: number;
    cursorX?: number;
    cursorY?: number;
    insertionType?: 'nearest-beads' | 'sector-based';
    message?: string;
  };
  style?: React.CSSProperties;
}

// 独立的珠子组件，使用React.memo优化
const Bead = React.memo(
  ({
    bead,
    index,
    isSelected,
    notSelected,
    dragState,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
  }: {
    bead: BeadWithPosition;
    index: number;
    isSelected: boolean;
    notSelected: boolean;
    dragState: {
      isDragging: boolean;
      dragBeadIndex: number;
      startX: number;
      startY: number;
      currentX: number;
      currentY: number;
    };
    handleDragStart: (e: any, index: number) => void;
    handleDragMove: (e: any, index: number) => void;
    handleDragEnd: (e: any, index: number) => void;
  }) => {
    const isFloatAccessory = bead.spu_type === SPU_TYPE.ACCESSORY && !bead.width || bead.passHeightRatio !== 0.5;
    return (
      <View key={bead.uniqueKey} className="bead-wrapper">
        {/* 可拖拽的珠子 */}
      <MovableView
        className={`bead-movable ${isSelected ? "selected" : notSelected ? "not-selected" : ""
          } ${dragState.isDragging && dragState.dragBeadIndex === index
            ? "dragging"
            : ""
          }`}
        // 统一使用x和y属性定位，避免与style冲突
        // 使用显示位置进行定位
        x={bead.x - bead.scale_width}
        y={bead.y - bead.scale_height}
        style={{
          width: 2 * bead.scale_width,
          height: 2 * bead.scale_height,
          // @ts-ignore
          '--rotation': `rotate(${bead.angle + Math.PI / 2}rad)`,
          ...(isFloatAccessory ? {
            position: 'absolute',
            zIndex: 100,
          } : {}),
        }}
        direction="all"
        inertia={false}
        outOfBounds={false}
        onTouchStart={(e) => handleDragStart(e, index)}
        onChange={(e) => handleDragMove(e, index)}
        onTouchEnd={(e) => handleDragEnd(e, index)}
        onTouchCancel={(e) => handleDragEnd(e, index)}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {bead.image_url && (
          <Image
            src={bead.image_url}
            className="movable-bead-image"
            style={{
              ...(isFloatAccessory ? {
                position: 'absolute',
                zIndex: 100
              } : {}),
              width: isFloatAccessory ? bead.scale_height * bead.image_aspect_ratio * 2 : bead.scale_width * 2,
              height: '100%',
              transform: "rotate(" + (bead.angle + Math.PI / 2) + "rad)",
            }}
          />
        )}
        {/* 珠子高光点 - 带渐变效果 */}
        {bead.image_url && (
          <View
            className="bead-highlight"
            style={{
              position: 'absolute',
              left: '25%', // 偏左位置
              top: '25%',  // 偏上位置
              width: `${2 * bead.scale_width * 0.2}px`, // 固定尺寸便于测试
              height: `${2 * bead.scale_height * 0.1}px`,
              borderRadius: '50%',
              pointerEvents: 'none',
              zIndex: 999, // 非常高的层级确保显示
              transform: "rotate(-45deg)",
            }}
          />
        )}
      </MovableView>
      </View>
    );
  },
  // 添加自定义比较函数，只有关键属性变化时才重新渲染
  (prevProps, nextProps) => {
    const prevBead = prevProps.bead;
    const nextBead = nextProps.bead;

    // 检查基本属性是否变化
    if (
      prevProps.index !== nextProps.index ||
      prevProps.isSelected !== nextProps.isSelected ||
      prevProps.notSelected !== nextProps.notSelected ||
      prevBead.id !== nextBead.id ||
      prevBead.image_url !== nextBead.image_url ||
      prevBead.scale_width !== nextBead.scale_width ||
      prevBead.uniqueKey !== nextBead.uniqueKey // 添加uniqueKey检查，确保强制重绘时能触发
    ) {
      return false; // 需要重新渲染
    }

    // 检查位置是否有明显变化（使用容差）
    if (
      Math.abs(prevBead.x - nextBead.x) > 1 ||
      Math.abs(prevBead.y - nextBead.y) > 1 ||
      Math.abs(prevBead.angle - nextBead.angle) > 0.05
    ) {
      return false; // 需要重新渲染
    }

    // 检查拖拽状态是否影响当前珠子
    const prevDragState = prevProps.dragState;
    const nextDragState = nextProps.dragState;
    const currentIndex = nextProps.index;

    if (
      prevDragState.isDragging !== nextDragState.isDragging ||
      prevDragState.dragBeadIndex !== nextDragState.dragBeadIndex ||
      (prevDragState.dragBeadIndex === currentIndex || nextDragState.dragBeadIndex === currentIndex)
    ) {
      return false; // 需要重新渲染
    }

    return true; // 不需要重新渲染
  }
);

/**
 * 基于MovableArea的珠子渲染器组件
 * 支持拖拽调整珠子位置，提供更好的交互体验
 */
const MovableBeadRenderer: React.FC<MovableBeadRendererProps> = ({
  beads,
  selectedBeadIndex,
  canvasSize,
  targetRadius,
  onBeadSelect,
  onBeadDeselect,
  onBeadDragEnd,
  onPreviewInsertPosition,
  style,
}) => {
  // 拖拽状态管理（增强版，支持插入预览）
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    dragBeadIndex: number;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    originalPosition?: { x: number; y: number };
    touchStartTime?: number; // 添加触摸开始时间，用于区分点击和拖拽
    // 插入预览相关
    previewCursor?: {
      isVisible: boolean;
      x: number;
      y: number;
      insertIndex: number;
      insertionType: 'nearest-beads' | 'sector-based';
    };
  }>({
    isDragging: false,
    dragBeadIndex: -1,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    originalPosition: undefined,
    touchStartTime: undefined,
    previewCursor: undefined,
  });

  // 珠子位置状态 - 用于内部管理珠子位置
  const [beadPositions, setBeadPositions] = useState<Position[]>(beads);

  // 初始化珠子位置
  useEffect(() => {
    if (beads.length > 0 && beadPositions.length === 0) {
      setBeadPositions([...beads]);
    }
  }, [beads, beadPositions.length]);

  // 防抖更新珠子位置
  const updateBeadPositionsDebounced = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (newBeads: Position[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        startTransition(() => {
          setBeadPositions([...newBeads]);
        });
      }, 50); // 防抖50ms
    };
  }, []);

  // 优化的珠子位置更新逻辑
  useEffect(() => {
    if (!dragState.isDragging && beads.length > 0) {
      // 使用更高效的比较方式
      const needsUpdate = beads.length !== beadPositions.length ||
        beads.some((bead, index) => {
          const currentBead = beadPositions[index];
          return !currentBead ||
            bead.uniqueKey !== currentBead.uniqueKey ||
            Math.abs(bead.x - currentBead.x) > 3 || // 增加容差
            Math.abs(bead.y - currentBead.y) > 3;
        });

      if (needsUpdate) {
        updateBeadPositionsDebounced(beads);
      }
    }
  }, [beads, dragState.isDragging, beadPositions, updateBeadPositionsDebounced]);



  // 处理拖拽开始
  const handleDragStart = useCallback(
    (e: any, beadIndex: number) => {
      const currentBead = beadPositions[beadIndex];
      // 选择被拖拽的珠子
      if (!currentBead) {
        console.warn("⚠️ 无法获取珠子信息，跳过拖拽", { beadIndex, beadPositionsLength: beadPositions.length });
        return;
      }

      setDragState({
        isDragging: true,
        dragBeadIndex: beadIndex,
        startX: e.detail.x || 0,
        startY: e.detail.y || 0,
        currentX: currentBead.x,
        currentY: currentBead.y,
        originalPosition: { x: currentBead.x, y: currentBead.y },
        touchStartTime: Date.now(), // 记录触摸开始时间
        previewCursor: undefined, // 确保开始时清除预览光标
      });

    },
    [selectedBeadIndex, onBeadSelect, beadPositions]
  );

  // 缓存拖拽计算结果
  const dragCalculationCacheRef = useRef<Map<string, any>>(new Map());
  
  // 处理拖拽中 - 优化版本，减少重复计算
  const handleDragMove = useCallback(
    throttleWithRAF((e: any, beadIndex: number) => {
      if (!dragState.isDragging || dragState.dragBeadIndex !== beadIndex)
        return;

      const bead = beadPositions[beadIndex];
      if (!bead) return;
      
      // 计算实际坐标
      const actualX = (e.detail.x || 0) + bead.scale_width;
      const actualY = (e.detail.y || 0) + bead.scale_height;

      // 生成缓存键
      const cacheKey = `${beadIndex}_${Math.round(actualX)}_${Math.round(actualY)}`;
      
      // 检查缓存
      if (dragCalculationCacheRef.current.has(cacheKey)) {
        const cached = dragCalculationCacheRef.current.get(cacheKey);
        setDragState(prev => ({
          ...prev,
          currentX: cached.threadX,
          currentY: cached.threadY,
          previewCursor: cached.previewCursor
        }));
        return;
      }

      // 计算穿线位置
      let threadX = actualX;
      let threadY = actualY;
      
      if (bead.passHeightRatio !== undefined && bead.passHeightRatio !== 0.5) {
        const heightOffset = (bead.passHeightRatio - 0.5) * bead.scale_height * 2;
        const normalX = -Math.cos(bead.angle);
        const normalY = -Math.sin(bead.angle);
        threadX = actualX - normalX * heightOffset;
        threadY = actualY - normalY * heightOffset;
      }

      // 预览插入位置
      let previewCursor: typeof dragState.previewCursor = undefined;
      if (onPreviewInsertPosition) {
        const previewResult = onPreviewInsertPosition(beadIndex, threadX, threadY);
        if (previewResult.isValid && previewResult.cursorX !== undefined && previewResult.cursorY !== undefined) {
          previewCursor = {
            isVisible: true,
            x: previewResult.cursorX,
            y: previewResult.cursorY,
            insertIndex: previewResult.insertIndex || 0,
            insertionType: previewResult.insertionType || 'nearest-beads'
          };
        }
      }

      // 缓存结果（限制缓存大小）
      if (dragCalculationCacheRef.current.size > 100) {
        const firstKey = dragCalculationCacheRef.current.keys().next().value;
        dragCalculationCacheRef.current.delete(firstKey);
      }
      dragCalculationCacheRef.current.set(cacheKey, { threadX, threadY, previewCursor });

      // 更新状态
      setDragState(prev => ({
        ...prev,
        currentX: threadX,
        currentY: threadY,
        previewCursor
      }));
    }, 20), // 稍微增加节流时间，减少计算频率
    [dragState.isDragging, dragState.dragBeadIndex, beadPositions, onPreviewInsertPosition]
  );

  const resetBeadPosition = useCallback((originalPos: { x: number; y: number }, beadIndex: number) => {
    if (originalPos) {
      setBeadPositions(prevPositions => {
        const restoredPositions = [...prevPositions];
        if (restoredPositions[beadIndex]) {
          // 重新生成uniqueKey来强制触发Bead组件重绘
          const newUniqueKey = `${restoredPositions[beadIndex].id}_${Date.now()}_restored`;
          restoredPositions[beadIndex] = {
            ...restoredPositions[beadIndex],
            x: originalPos.x,
            y: originalPos.y,
            // 确保角度也恢复
            angle: restoredPositions[beadIndex].angle || 0,
            // 重新生成uniqueKey强制重绘
            uniqueKey: newUniqueKey
          };
        }
        return restoredPositions;
      });
    }
  }, [beadPositions]);

  // 处理拖拽结束
  const handleDragEnd = useCallback(
    async (e: any, beadIndex: number) => {
      if (!dragState.isDragging || dragState.dragBeadIndex !== beadIndex)
        return;

      // 计算最终位置：优先使用拖拽状态中的位置（已经是穿线位置），备用事件位置
      const bead = beadPositions[beadIndex];
      let finalX = dragState.currentX;
      let finalY = dragState.currentY;

      // 如果状态中没有位置信息，从事件中计算并转换为穿线位置
      if (finalX === 0 && finalY === 0 && e.detail) {
        const actualX = (e.detail.x || 0) + bead.scale_width;
        const actualY = (e.detail.y || 0) + bead.scale_height;
        
        // 对于非中心穿线的珠子，需要将显示位置转换为穿线位置
        if (bead.passHeightRatio !== undefined && bead.passHeightRatio !== 0.5) {
          const heightOffset = (bead.passHeightRatio - 0.5) * bead.scale_height * 2;
          const normalX = -Math.cos(bead.angle);
          const normalY = -Math.sin(bead.angle);
          
          finalX = actualX - normalX * heightOffset;
          finalY = actualY - normalY * heightOffset;
        } else {
          finalX = actualX;
          finalY = actualY;
        }
      }

      console.log("🎯 拖拽结束事件", {
        beadIndex,
        finalX,
        finalY,
        fromState: { x: dragState.currentX, y: dragState.currentY },
        fromEvent: { x: e.detail?.x, y: e.detail?.y },
        originalPos: dragState.originalPosition
      });

      const originalPos = dragState.originalPosition;
      if (originalPos) {
        const moveDistance = Math.sqrt(
          Math.pow(finalX - originalPos.x, 2) + Math.pow(finalY - originalPos.y, 2)
        );

        // 如果移动距离太小，认为是点击而不是拖拽
        if (moveDistance < 2) {
          console.log(moveDistance, "👆 判定为点击，不进行重排序");

          // 重置拖拽状态
          setDragState({
            isDragging: false,
            dragBeadIndex: -1,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            originalPosition: undefined,
            touchStartTime: undefined,
            previewCursor: undefined,
          });

          // 点击选中珠子（不需要resetBeadPosition，因为位置没有真正改变）
          onBeadSelect(beadIndex);
          return;
        }

        // 等待拖拽处理完成，确保状态更新完毕
        try {
          await onBeadDragEnd(beadIndex, finalX, finalY);
          console.log("✅ 拖拽处理完成");
        } catch (error) {
          console.error("❌ 拖拽处理失败:", error);
          // 如果拖拽失败，立即恢复原始位置
          if (originalPos) {
            resetBeadPosition(originalPos, beadIndex);
            return;
          }
        } finally {
          // 重置拖拽状态（清除预览）
          setDragState({
            isDragging: false,
            dragBeadIndex: -1,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            originalPosition: undefined,
            touchStartTime: undefined,
            previewCursor: undefined,
          });
        }
      }

      // 重置拖拽状态（清除预览）
      setDragState({
        isDragging: false,
        dragBeadIndex: -1,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        originalPosition: undefined,
        touchStartTime: undefined,
        previewCursor: undefined,
      });
    },
    [dragState.isDragging, dragState.dragBeadIndex, dragState.currentX, dragState.currentY, dragState.originalPosition, onBeadDragEnd, beadPositions.length, beads]
  );

  // 计算MovableArea的尺寸和位置
  const movableAreaStyle = useMemo(
    () => ({
      width: `${canvasSize}px`,
      height: `${canvasSize}px`,
      position: "relative" as const,
    }),
    [canvasSize]
  );

  // 清理资源 - 增强版
  useEffect(() => {
    return () => {
      // 清理拖拽计算缓存
      if (dragCalculationCacheRef.current) {
        dragCalculationCacheRef.current.clear();
      }
    };
  }, []);

  return (
    <View className="movable-bead-container" style={style}>
      <View className="canvas-wrapper">
        {/* 手环线圈背景层 - 在最底层 */}
        <View 
          className="bracelet-ring-background"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${targetRadius * 2}px`, // 线圈直径约为画布的70%
            height: `${targetRadius * 2}px`,
            borderRadius: '50%',
            border: '2px solid #b19c7d',
            zIndex: 1, // 改为正数，确保显示
          }}
        />
        
        {/* 绘制穿线路径 */}
        {beadPositions.length > 1 && (
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${canvasSize}px`,
              height: `${canvasSize}px`,
              zIndex: 3, // 在背景之上，珠子之下
              pointerEvents: 'none',
            }}
          >
            {beadPositions.map((bead, index) => {
              const nextIndex = (index + 1) % beadPositions.length;
              const nextBead = beadPositions[nextIndex];
              
              // 使用穿线点位置，如果没有则使用显示位置
              const startX = bead.threadX !== undefined ? bead.threadX : bead.x;
              const startY = bead.threadY !== undefined ? bead.threadY : bead.y;
              const endX = nextBead.threadX !== undefined ? nextBead.threadX : nextBead.x;
              const endY = nextBead.threadY !== undefined ? nextBead.threadY : nextBead.y;
              
              return (
                <line
                  key={`thread-${bead.uniqueKey}`}
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke="#8B7355"
                  strokeWidth="3"
                  opacity="0.8"
                />
              );
            })}
          </svg>
        )}
        
        <MovableArea
          className="movable-area"
          style={{
            ...movableAreaStyle,
            zIndex: 5, // 确保MovableArea在背景层之上，但允许背景层显示
          }}
          onClick={onBeadDeselect}
        >
          
          {/* 渲染所有珠子的阴影层 - 确保在最底层 */}
          {beadPositions.map((bead, index) => {
            // 如果当前珠子正在被拖拽，不渲染阴影
            if (dragState.isDragging && dragState.dragBeadIndex === index) {
              return null;
            }
            // 使用显示位置渲染阴影
            let shadowX = bead.x;
            let shadowY = bead.y;

            return bead.image_url ? (
              <View
                key={`shadow-${bead.uniqueKey}`}
                className="bead-shadow-layer"
                style={{
                  position: 'absolute',
                  left: shadowX - bead.scale_width + 2, // 阴影偏移 - 额外的边距用于模糊扩展
                  top: shadowY - bead.scale_height + 2,
                  width: 2 * bead.scale_width, // 增加更多尺寸以容纳模糊边界
                  height: 2 * bead.scale_height,
                  zIndex: 2, // 阴影层在背景之上，珠子之下
                  pointerEvents: 'none', // 阴影不拦截事件
                  filter: 'blur(4px)',
                }}
              >
                <Image
                  src={bead.image_url}
                  className="movable-bead-image-shadow"
                  style={{
                    width: '100%',
                    height: '100%',
                    transform: `rotate(${bead.angle + Math.PI / 2}rad)`, // 稍微放大以确保模糊边界不被裁切
                  }}
                />
              </View>
            ) : null;
          })}

          {/* 绘制珠子主体层 */}
          {beadPositions.map((bead, index) => (
            <Bead
              key={bead.uniqueKey}
              bead={bead}
              index={index}
              isSelected={index === selectedBeadIndex}
              notSelected={selectedBeadIndex !== -1 && index !== selectedBeadIndex}
              dragState={dragState}
              handleDragStart={handleDragStart}
              handleDragMove={handleDragMove}
              handleDragEnd={handleDragEnd}
            />
          ))}

          {/* 插入位置预览光标 */}
          {dragState.previewCursor?.isVisible && dragState.previewCursor.insertionType === 'sector-based' && (
            <View
              className={`insertion-cursor ${dragState.previewCursor.insertionType}`}
              style={{
                position: 'absolute',
                left: dragState.previewCursor.x, // 调整偏移量以适应新的尺寸 (6px/2 + 10px border = 13px)
                top: dragState.previewCursor.y,
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: 'rgba(247, 240, 229)',
                border: `10px solid rgba(195, 129, 71)`,
                zIndex: 100,
                pointerEvents: 'none',
                animation: 'pulse 1s infinite'
              }}
            />
          )}
        </MovableArea>
      </View>
    </View>
  );
};

export default React.memo(MovableBeadRenderer);
