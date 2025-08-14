import React, { useCallback, useEffect, useRef, useMemo, useState } from "react";
import { View, MovableArea, MovableView, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { Position } from "./BeadArrayCalculator";
import "./styles/MovableBeadRenderer.scss";

interface MovableBeadRendererProps {
  beads: Position[];
  selectedBeadIndex: number;
  canvasSize: number;
  onBeadSelect: (index: number) => void;
  onBeadDeselect: () => void;
  onBeadDragEnd: (beadIndex: number, newX: number, newY: number) => void;
  style?: React.CSSProperties;
}

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
  const handleBeadSelect = useCallback((index: number) => {
    onBeadSelect(index);
  }, [onBeadSelect]);

  // 处理拖拽开始
  const handleDragStart = useCallback((e: any, beadIndex: number) => {
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
  }, [selectedBeadIndex, onBeadSelect]);

  // 处理拖拽中
  const handleDragMove = useCallback((e: any, beadIndex: number) => {
    if (!dragState.isDragging || dragState.dragBeadIndex !== beadIndex) return;

    // 更新珠子位置
    const newX = e.detail.x || 0;
    const newY = e.detail.y || 0;
    
    setBeadPositions(prev => prev.map((bead, index) => {
      if (index === beadIndex) {
        return { ...bead, x: newX, y: newY };
      }
      return bead;
    }));
  }, [dragState.isDragging, dragState.dragBeadIndex]);

  // 处理拖拽结束
  const handleDragEnd = useCallback((e: any, beadIndex: number) => {
    if (!dragState.isDragging || dragState.dragBeadIndex !== beadIndex) return;

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
  }, [dragState.isDragging, dragState.dragBeadIndex, onBeadDragEnd]);

  console.log("beadPositions", beadPositions);
  console.log("beads prop", beads);
  console.log("canvasSize", canvasSize);
  console.log("selectedBeadIndex", selectedBeadIndex);
  
  // 检查beads数据结构
  useEffect(() => {
    if (beadPositions.length > 0) {
      console.log("First bead data:", beadPositions[0]);
      console.log("Beads with imageData:", beadPositions.map((bead, index) => ({
        index,
        id: bead.id,
        image_url: bead.image_url,
        imageData: bead.imageData,
        x: bead.x,
        y: bead.y,
        radius: bead.radius
      })));
    }
  }, [beadPositions]);
  
  // 计算MovableArea的尺寸和位置
  const movableAreaStyle = useMemo(() => ({
    width: `${canvasSize}px`,
    height: `${canvasSize}px`,
    position: 'relative' as const,
    backgroundColor: 'rgba(245, 241, 237, 0.3)', // 添加背景色便于调试
  }), [canvasSize]);

  // 计算珠子的MovableView样式
  const getBeadMovableStyle = useCallback((bead: Position, index: number) => {
    const isSelected = index === selectedBeadIndex;
    const isDragging = dragState.isDragging && dragState.dragBeadIndex === index;
    
    console.log(`Bead ${index} style:`, {
      x: Math.round(bead.x - bead.radius),
      y: Math.round(bead.y - bead.radius),
      radius: bead.radius,
      image_url: bead.image_url
    });
    
    return {
      width: `${bead.radius * 2}px`,
      height: `${bead.radius * 2}px`,
      x: Math.round(bead.x - bead.radius),
      y: Math.round(bead.y - bead.radius),
      zIndex: isSelected ? 10 : isDragging ? 9 : 1,
      transform: `rotate(${bead.angle + Math.PI / 2}rad)`,
      transition: isDragging ? 'none' : 'all 0.3s ease',
      backgroundColor: 'rgba(255, 0, 0, 0.2)', // 添加背景色便于调试
    };
  }, [selectedBeadIndex, dragState.isDragging, dragState.dragBeadIndex]);

  // 计算珠子的图片样式
  const getBeadImageStyle = useCallback((bead: Position) => ({
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover' as const,
    display: 'block', // 确保图片显示
  }), []);

  // 计算选中珠子的边框样式
  const getSelectedBeadStyle = useCallback((bead: Position, index: number) => {
    if (index !== selectedBeadIndex) return {};
    
    return {
      position: 'absolute' as const,
      left: `${bead.x - bead.radius - 4}px`,
      top: `${bead.y - bead.radius - 4}px`,
      width: `${bead.radius * 2 + 8}px`,
      height: `${bead.radius * 2 + 8}px`,
      border: '3px solid #FF6B35',
      borderRadius: '50%',
      pointerEvents: 'none' as const,
      zIndex: 11,
    };
  }, [selectedBeadIndex]);

  return (
    <View className="movable-bead-container" style={style}>
      {/* 拖拽提示 */}
      {dragState.isDragging && (
        <View className="drag-hint visible">
          拖拽中... 松开手指完成调整
        </View>
      )}
      
      {/* 触摸提示 */}
      {!dragState.isDragging && beads.length > 0 && (
        <View className="touch-hint">
          💡 拖拽珠子可调整位置
        </View>
      )}
      
      <View className="canvas-wrapper">
        <MovableArea 
          className="movable-area"
          style={movableAreaStyle}
          onClick={onBeadDeselect}
        >
          {/* 绘制珠子 */}
          {beadPositions.map((bead, index) => (
            <View key={bead.id || index} className="bead-wrapper">
              {/* 选中珠子的边框 */}
              {index === selectedBeadIndex && (
                <View 
                  className="selected-bead-border"
                  style={getSelectedBeadStyle(bead, index)}
                />
              )}
              
              {/* 可拖拽的珠子 */}
              <MovableView
                className={`bead-movable ${index === selectedBeadIndex ? 'selected' : ''} ${dragState.isDragging && dragState.dragBeadIndex === index ? 'dragging' : ''}`}
                style={getBeadMovableStyle(bead, index)}
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
                {(bead.imageData || bead.image_url) ? (
                  <Image
                    className="bead-image"
                    src={bead.imageData || bead.image_url}
                    style={getBeadImageStyle(bead)}
                    mode="aspectFill"
                    lazyLoad
                    onError={(e) => {
                      console.error(`Failed to load image for bead ${index}:`, bead.imageData || bead.image_url, e);
                    }}
                    onLoad={() => {
                      console.log(`Successfully loaded image for bead ${index}:`, bead.imageData || bead.image_url);
                    }}
                  />
                ) : (
                  <View 
                    className="bead-placeholder"
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: '#ccc',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#666',
                      fontSize: '12px'
                    }}
                  >
                    {bead.id || index}
                  </View>
                )}
              </MovableView>
            </View>
          ))}
          
          {/* 测试用的珠子 - 临时添加用于调试 */}
          {beadPositions.length === 0 && (
            <View className="bead-wrapper">
              <MovableView
                className="bead-movable test-bead"
                x={canvasSize / 2 - 30}
                y={canvasSize / 2 - 30}
                style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: 'red',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px'
                }}
                direction="all"
                inertia={false}
                outOfBounds={false}
              >
                测试珠子
              </MovableView>
            </View>
          )}
        </MovableArea>
      </View>
    </View>
  );
};

export default React.memo(MovableBeadRenderer);
