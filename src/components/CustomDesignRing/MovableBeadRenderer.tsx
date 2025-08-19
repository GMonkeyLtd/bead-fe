import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  startTransition,
} from "react";
import {
  View,
  MovableArea,
  MovableView,
  Image,
} from "@tarojs/components";
import { Position } from "./BeadArrayCalculator";
import "./styles/MovableBeadRenderer.scss";

// 添加节流函数
const throttle = (func: Function, wait: number) => {
  let timeout: any = null;
  let previous = 0;
  return function (...args: any[]) {
    const now = Date.now();
    const remaining = wait - (now - previous);
    if (remaining <= 0) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func.apply(this, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func.apply(this, args);
      }, remaining);
    }
  };
};

interface MovableBeadRendererProps {
  beads: Position[];
  selectedBeadIndex: number;
  canvasSize: number;
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
    handleBeadSelect,
  }: {
    bead: Position;
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
    handleBeadSelect: (index: number) => void;
  }) => {
    return (
      <View key={bead.uniqueKey} className="bead-wrapper">
        {/* 可拖拽的珠子 */}
        <MovableView
          className={`bead-movable ${
            isSelected ? "selected" : notSelected ? "not-selected" : ""
          } ${
            dragState.isDragging && dragState.dragBeadIndex === index
              ? "dragging"
              : ""
          }`}
          // 统一使用x和y属性定位，避免与style冲突
          x={bead.x - bead.radius}
          y={bead.y - bead.height}
          style={{
            width: 2 * bead.radius,
            height: 2 * bead.height,
            // @ts-ignore
            '--rotation': `rotate(${bead.angle + Math.PI / 2}rad)`,
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
            // 只有在非拖拽状态下才处理点击选择，避免拖拽结束时重复选择
            if (!dragState.isDragging) {
              handleBeadSelect(index);
            }
          }}
        >
          {bead.image_url && (
            <Image
              src={bead.image_url}
              className="movable-bead-image"
              style={{
                // transformOrigin: "center center",
                width: '100%',
                height: '100%',
                transform: "rotate(" + (bead.angle + Math.PI / 2) + "rad)",
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
      prevBead.radius !== nextBead.radius
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

  // 更新珠子位置 - 确保与props保持同步，增加防抖机制
  useEffect(() => {
    // console.log("📥 更新珠子位置", {
    //   newBeads: beads.length,
    //   currentBeads: beadPositions.length,
    //   isDragging: dragState.isDragging
    // });
    
    // 只有在不拖拽时才更新位置，避免拖拽中的冲突
    if (!dragState.isDragging && beads.length > 0) {
      // 检查是否需要更新 - 比较关键位置信息
      const needsUpdate = beads.length !== beadPositions.length || 
        beads.some((bead, index) => {
          const currentBead = beadPositions[index];
          return !currentBead || 
            bead.uniqueKey !== currentBead.uniqueKey || 
            Math.abs(bead.x - currentBead.x) > 2 || // 增加容差，减少微小变化导致的更新
            Math.abs(bead.y - currentBead.y) > 2 ||
            Math.abs(bead.angle - currentBead.angle) > 0.1;
        });
      
      if (needsUpdate) {
        console.log("🔄 珠子位置发生变化，更新显示位置", beads);
        // 使用 startTransition 进行非紧急更新，避免阻塞用户交互
        startTransition(() => {
          setBeadPositions([...beads]); // 使用展开运算符确保触发重新渲染
        });
      }
    }
  }, [beads, dragState.isDragging, beadPositions]);

  // 处理珠子选择
  const handleBeadSelect = useCallback(
    (index: number) => {
      onBeadSelect(index);
    },
    [onBeadSelect]
  );

  // 处理拖拽开始
  const handleDragStart = useCallback(
    (e: any, beadIndex: number) => {
      const currentBead = beadPositions[beadIndex];
      // 选择被拖拽的珠子
      if (!currentBead) {
        console.warn("⚠️ 无法获取珠子信息，跳过拖拽", { beadIndex, beadPositionsLength: beadPositions.length });
        return;
      }
      
      // 拖拽开始时先选中当前珠子
      if (selectedBeadIndex !== beadIndex) {
        onBeadSelect(beadIndex);
      }
      
      console.log("🚀 拖拽开始", { beadIndex, bead: currentBead });
      
      setDragState({
        isDragging: true,
        dragBeadIndex: beadIndex,
        startX: e.detail.x || 0,
        startY: e.detail.y || 0,
        currentX: currentBead.x,
        currentY: currentBead.y,
        originalPosition: { x: currentBead.x, y: currentBead.y },
        previewCursor: undefined, // 确保开始时清除预览光标
      });

    },
    [selectedBeadIndex, onBeadSelect, beadPositions]
  );

  // 处理拖拽中 - 更新拖拽状态并预览插入位置
  const handleDragMove = useCallback(
    throttle((e: any, beadIndex: number) => {
      if (!dragState.isDragging || dragState.dragBeadIndex !== beadIndex)
        return;

      // 计算实际坐标：MovableView的坐标 + 珠子半径偏移
      const bead = beadPositions[beadIndex];
      const actualX = (e.detail.x || 0) + bead.radius;
      const actualY = (e.detail.y || 0) + bead.radius;

      // 预览插入位置
      let previewCursor: typeof dragState.previewCursor = undefined;
      if (onPreviewInsertPosition) {
        const previewResult = onPreviewInsertPosition(beadIndex, actualX, actualY);
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

      // 更新拖拽状态（包含预览信息）
      setDragState(prev => ({
        ...prev,
        currentX: actualX,
        currentY: actualY,
        previewCursor
      }));
    }, 16), // 减少节流时间，提高响应性
    [dragState.isDragging, dragState.dragBeadIndex, beadPositions, onPreviewInsertPosition]
  );

  // 处理拖拽结束
  const handleDragEnd = useCallback(
    async (e: any, beadIndex: number) => {
      if (!dragState.isDragging || dragState.dragBeadIndex !== beadIndex)
        return;

      // 计算最终位置：优先使用拖拽状态中的位置，备用事件位置
      const bead = beadPositions[beadIndex];
      let finalX = dragState.currentX;
      let finalY = dragState.currentY;
      
      // 如果状态中没有位置信息，从事件中计算
      if (finalX === 0 && finalY === 0 && e.detail) {
        finalX = (e.detail.x || 0) + bead.radius;
        finalY = (e.detail.y || 0) + bead.radius;
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
        if (moveDistance < 10) {
          console.log(moveDistance, "👆 判定为点击，不进行重排序");
          
          // 重置拖拽状态（包含预览光标）
          setDragState({
            isDragging: false,
            dragBeadIndex: -1,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            originalPosition: undefined,
            previewCursor: undefined,
          });
          return;
        }

        
        // 等待拖拽处理完成，确保状态更新完毕
        try {
          await onBeadDragEnd(beadIndex, finalX, finalY);
          console.log("✅ 拖拽处理完成");
        } catch (error) {
          console.error("❌ 拖拽处理失败:", error);
          // 如果拖拽失败，恢复原始位置
          setBeadPositions(prevPositions => {
            const restoredPositions = [...prevPositions];
            if (restoredPositions[beadIndex] && originalPos) {
              restoredPositions[beadIndex] = {
                ...restoredPositions[beadIndex],
                x: originalPos.x,
                y: originalPos.y
              };
            }
            return restoredPositions;
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
        previewCursor: undefined,
      });

      // 移除立即同步机制，让useEffect处理状态同步
      // 这样可以避免重复的状态更新导致的抖动
      console.log("🔄 拖拽结束，等待状态自然同步");
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

  const handleContainerClick = (e) => {
    e.stopPropagation();
  }

  return (
    <View className="movable-bead-container" style={style}>
      <View className="canvas-wrapper">
        <MovableArea
          className="movable-area"
          style={movableAreaStyle}
          onClick={onBeadDeselect}
        >
          {/* 绘制珠子 */}
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
              handleBeadSelect={handleBeadSelect}
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
