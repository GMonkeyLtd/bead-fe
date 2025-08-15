import React, {
  useCallback,
  useEffect,
  useRef,
  useMemo,
  useState,
} from "react";
import {
  View,
  MovableArea,
  MovableView,
  Image,
  Text,
} from "@tarojs/components";
import Taro from "@tarojs/taro";
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
  style?: React.CSSProperties;
}

// 独立的珠子组件，使用React.memo优化
const Bead = React.memo(
  ({
    bead,
    index,
    selectedBeadIndex,
    dragState,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleBeadSelect,
    getBeadMovableStyle,
    getBeadImageStyle,
  }: {
    bead: Position;
    index: number;
    selectedBeadIndex: number;
    dragState: {
      isDragging: boolean;
      dragBeadIndex: number;
      startX: number;
      startY: number;
    };
    handleDragStart: (e: any, index: number) => void;
    handleDragMove: (e: any, index: number) => void;
    handleDragEnd: (e: any, index: number) => void;
    handleBeadSelect: (index: number) => void;
    getBeadMovableStyle: (bead: Position, index: number) => React.CSSProperties;
    getBeadImageStyle: (bead: Position) => React.CSSProperties;
  }) => {
    return (
      <View key={bead.id || index} className="bead-wrapper">
        {/* 可拖拽的珠子 */}
        <MovableView
          className={`bead-movable ${
            index === selectedBeadIndex ? "selected" : ""
          } ${
            dragState.isDragging && dragState.dragBeadIndex === index
              ? "dragging"
              : ""
          }`}
          // 统一使用style属性而不是单独的x和y属性，避免冲突
          style={{
            width: 2 * bead.radius,
            height: 2 * bead.radius,
            left: bead.x - bead.radius,
            top: bead.y - bead.radius,
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
            handleBeadSelect(index);
          }}
        >
          {(bead.imageData || bead.image_url) && (
            <Image
              src={bead.imageData || bead.image_url}
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
  style,
}) => {
  // 拖拽状态管理
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    dragBeadIndex: number;
    startX: number;
    startY: number;
  }>({
    isDragging: false,
    dragBeadIndex: -1,
    startX: 0,
    startY: 0,
  });

  // 珠子位置状态
  const [beadPositions, setBeadPositions] = useState<Position[]>(beads);

  // 更新珠子位置
  useEffect(() => {
    setBeadPositions(beads);
  }, [beads]);

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
      setDragState({
        isDragging: true,
        dragBeadIndex: beadIndex,
        startX: e.detail.x || 0,
        startY: e.detail.y || 0,
      });

      // 选择被拖拽的珠子
      if (selectedBeadIndex !== beadIndex) {
        onBeadSelect(beadIndex);
      }
    },
    [selectedBeadIndex, onBeadSelect]
  );

  // 处理拖拽中 - 使用节流优化
  const handleDragMove = useCallback(
    throttle((e: any, beadIndex: number) => {
      if (!dragState.isDragging || dragState.dragBeadIndex !== beadIndex)
        return;

      // 更新珠子位置
      const newX = e.detail.x || 0;
      const newY = e.detail.y || 0;

      // 直接更新当前珠子的位置，避免每次都映射整个数组
      setBeadPositions((prev) => {
        const newPositions = [...prev];
        newPositions[beadIndex] = {
          ...newPositions[beadIndex],
          x: newX,
          y: newY,
        };
        return newPositions;
      });
    }, 50),
    [dragState.isDragging, dragState.dragBeadIndex]
  );

  // 处理拖拽结束
  const handleDragEnd = useCallback(
    (e: any, beadIndex: number) => {
      if (!dragState.isDragging || dragState.dragBeadIndex !== beadIndex)
        return;

      const finalX = e.detail.x || 0;
      const finalY = e.detail.y || 0;

      // 调用拖拽结束回调
      onBeadDragEnd(beadIndex, finalX, finalY);

      // 重置拖拽状态
      setDragState({
        isDragging: false,
        dragBeadIndex: -1,
        startX: 0,
        startY: 0,
      });
    },
    [dragState.isDragging, dragState.dragBeadIndex, onBeadDragEnd]
  );

  console.log("beadPositions", beadPositions);
  console.log("beads prop", beads);
  console.log("canvasSize", canvasSize);
  console.log("selectedBeadIndex", selectedBeadIndex);

  // 计算MovableArea的尺寸和位置
  const movableAreaStyle = useMemo(
    () => ({
      width: `${canvasSize}px`,
      height: `${canvasSize}px`,
      position: "relative" as const,
      backgroundColor: "rgba(245, 241, 237, 0.3)", // 添加背景色便于调试
    }),
    [canvasSize]
  );

  // 计算珠子的MovableView样式
  const getBeadMovableStyle = useCallback(
    (bead: Position, index: number) => {
      const isSelected = index === selectedBeadIndex;
      const isDragging =
        dragState.isDragging && dragState.dragBeadIndex === index;

      // 调试信息 - 输出原始坐标和计算后的坐标
      const calculatedX = Math.round(bead.x - bead.radius);
      const calculatedY = Math.round(bead.y - bead.radius);

      // 添加额外的调试信息 - 验证坐标是否在画布范围内
      if (
        calculatedX < 0 ||
        calculatedX + bead.radius * 2 > canvasSize ||
        calculatedY < 0 ||
        calculatedY + bead.radius * 2 > canvasSize
      ) {
        console.warn(`Bead ${index} is outside canvas bounds!`);
      }

      return {
        width: `${bead.radius * 2}px`,
        height: `${bead.radius * 2}px`,
        x: calculatedX,
        y: calculatedY,
        zIndex: isSelected ? 10 : isDragging ? 9 : 1,
        transform: `rotate(${bead.angle + Math.PI / 2}rad)`,
        transition: isDragging ? "none" : "all 0.3s ease",
        // backgroundColor: 'rgba(255, 0, 0, 0.2)', // 添加背景色便于调试
      };
    },
    [
      selectedBeadIndex,
      dragState.isDragging,
      dragState.dragBeadIndex,
      canvasSize,
    ]
  );

  // 计算珠子的图片样式
  const getBeadImageStyle = useCallback(
    (bead: Position) => ({
      width: "100%",
      height: "100%",
      objectFit: "cover" as const,
      display: "block", // 确保图片显示
    }),
    []
  );

  // 计算选中珠子的边框样式
  const getSelectedBeadStyle = useCallback(
    (bead: Position, index: number) => {
      if (index !== selectedBeadIndex) return {};

      return {
        position: "absolute" as const,
        left: `${bead.x - bead.radius - 4}px`,
        top: `${bead.y - bead.radius - 4}px`,
        width: `${bead.radius * 2 + 8}px`,
        height: `${bead.radius * 2 + 8}px`,
        border: "3px solid #FF6B35",
        borderRadius: "50%",
        pointerEvents: "none" as const,
        zIndex: 11,
      };
    },
    [selectedBeadIndex]
  );

  return (
    <View className="movable-bead-container" style={style}>
      {/* 拖拽提示 */}
      {/* {dragState.isDragging && (
        <View className='drag-hint visible'>
          拖拽中... 松开手指完成调整
        </View>
      )} */}

      {/* 触摸提示 */}
      {/* {!dragState.isDragging && beads.length > 0 && (
        <View className='touch-hint'>
          💡 拖拽珠子可调整位置
        </View>
      )} */}

      <View className="canvas-wrapper">
        <MovableArea
          className="movable-area"
          style={movableAreaStyle}
          onClick={onBeadDeselect}
        >
          {/* 绘制珠子 */}
          {beadPositions.map((bead, index) => (
            <Bead
              key={bead.id || index}
              bead={bead}
              index={index}
              selectedBeadIndex={selectedBeadIndex}
              dragState={dragState}
              handleDragStart={handleDragStart}
              handleDragMove={handleDragMove}
              handleDragEnd={handleDragEnd}
              handleBeadSelect={handleBeadSelect}
              getBeadMovableStyle={getBeadMovableStyle}
              getBeadImageStyle={getBeadImageStyle}
            />
          ))}

          {/* 测试用的珠子 - 临时添加用于调试 */}
          {/* {beadPositions.length === 0 && (
            <View className="bead-wrapper">
              <MovableView
                className="bead-movable test-bead"
                x={218}
                y={145}
                style={{}}
                direction="all"
                inertia={false}
                outOfBounds={false}
              >
                <Image src='https://zhuluoji.cn-sh2.ufileos.com/beads0807/%E9%BB%84%E8%83%B6%E8%8A%B1.webp' />
              </MovableView>
            </View>
          )} */}
        </MovableArea>
      </View>
    </View>
  );
};

export default React.memo(MovableBeadRenderer);
