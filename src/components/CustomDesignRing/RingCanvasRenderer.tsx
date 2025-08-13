import React, { useCallback, useEffect, useRef, useMemo } from "react";
import { Canvas, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { ImageCacheManager } from "@/utils/image-cache";
import { Position } from "./BeadArrayCalculator";
import "./styles/RingCanvasRenderer.scss";

interface RingCanvasRendererProps {
  beads: Position[];
  selectedBeadIndex: number;
  canvasId: string;
  canvasSize: number;
  onBeadSelect: (index: number) => void;
  onBeadDeselect: () => void;
  style?: React.CSSProperties;
}

/**
 * 圆环Canvas渲染器组件
 * 负责珠子的绘制、交互和状态管理
 */
const RingCanvasRenderer: React.FC<RingCanvasRendererProps> = ({
  beads,
  selectedBeadIndex,
  canvasId,
  canvasSize,
  onBeadSelect,
  onBeadDeselect,
  style,
}) => {
  const dpr = Taro.getWindowInfo().pixelRatio || 2;
  
  // 性能优化：使用ref缓存计算结果和Canvas上下文
  const canvasContextRef = useRef<any>(null);
  const imageProcessCacheRef = useRef<Map<string, string>>(new Map());
  const isProcessingRef = useRef<boolean>(false);
  const requestAnimationFrameId = useRef<number>(0);

  // 获取Canvas上下文，并缓存
  const getCanvasContext = useCallback(() => {
    if (!canvasContextRef.current) {
      canvasContextRef.current = Taro.createCanvasContext(canvasId);
    }
    return canvasContextRef.current;
  }, [canvasId]);

  // 清理Canvas上下文缓存
  const clearCanvasContext = useCallback(() => {
    if (canvasContextRef.current) {
      canvasContextRef.current = null;
    }
  }, []);

  // 图片处理缓存
  const processImages = useCallback(async (beads: Position[]) => {
    const cacheKey = beads
      .map(item => `${item.image_url}_${item.render_diameter}_${item.diameter}_${item.id}`)
      .join(",");

    if (imageProcessCacheRef.current.has(cacheKey)) {
      const cachedData = imageProcessCacheRef.current.get(cacheKey);
      return JSON.parse(cachedData || "[]");
    }

    try {
      const processedPaths = await ImageCacheManager.processImagePaths(
        beads.map(item => item.image_url)
      );

      const beadsWithImageData = beads.map(bead => ({
        ...bead,
        imageData: processedPaths.get(bead.image_url) || bead.image_url,
      }));

      // 缓存结果
      imageProcessCacheRef.current.set(cacheKey, JSON.stringify(beadsWithImageData));

      // 限制缓存大小，避免内存泄漏
      if (imageProcessCacheRef.current.size > 50) {
        const firstKey = imageProcessCacheRef.current.keys().next().value;
        imageProcessCacheRef.current.delete(firstKey);
      }

      return beadsWithImageData;
    } catch (error) {
      console.error("图片处理失败:", error);
      throw error;
    }
  }, []);

  // 防抖Canvas绘制
  const debouncedDrawCanvas = useMemo(
    () => {
      let timeoutId: NodeJS.Timeout;
      
      return async (beads: Position[], selectedBeadIndex: number) => {
        clearTimeout(timeoutId);
        
        timeoutId = setTimeout(async () => {
          if (!beads.length) return;

          const ctx = getCanvasContext();
          if (!ctx) return;

          try {
            // 处理图片
            const processedBeads = await processImages(beads);
            
            ctx.clearRect(0, 0, canvasSize, canvasSize);

            // 批量绘制非选中的珠子
            const normalBeads = processedBeads.filter(
              (_, index) => index !== selectedBeadIndex
            );
            const selectedBead =
              selectedBeadIndex !== -1 ? processedBeads[selectedBeadIndex] : null;

            // 绘制普通珠子
            normalBeads.forEach((item) => {
              const { x, y, radius, imageData, angle } = item;

              // 保存当前Canvas状态
              ctx.save();

              // 移动到珠子中心
              ctx.translate(x, y);

              // 旋转珠子，使孔线指向圆心
              ctx.rotate(angle + Math.PI / 2);

              // 绘制珠子（以珠子中心为原点）
              ctx.drawImage(imageData, -radius, -radius, radius * 2, radius * 2);

              // 恢复Canvas状态
              ctx.restore();

              // 如果有选中珠子且当前珠子不是选中的，添加半透明遮罩
              if (selectedBeadIndex !== -1) {
                ctx.beginPath();
                ctx.arc(x, y, radius + 2, 0, 2 * Math.PI);
                ctx.setFillStyle("rgba(245, 241, 237, 0.6)");
                ctx.fill();
              }
            });

            // 绘制选中的珠子（在最后绘制确保在最上层）
            if (selectedBead) {
              const { x, y, radius, imageData, angle } = selectedBead;

              // 保存当前Canvas状态
              ctx.save();

              // 移动到珠子中心
              ctx.translate(x, y);

              // 旋转珠子，使孔线指向圆心
              ctx.rotate(angle + Math.PI / 2);

              // 绘制珠子（以珠子中心为原点）
              ctx.drawImage(imageData, -radius, -radius, radius * 2, radius * 2);

              // 恢复Canvas状态
              ctx.restore();

              // 绘制选中边框
              ctx.beginPath();
              ctx.arc(x, y, radius + 2, 0, 2 * Math.PI);
              ctx.setStrokeStyle("#ffffff");
              ctx.setLineWidth(4);
              ctx.stroke();
            }

            ctx.draw();
          } catch (error) {
            console.error("Canvas绘制失败:", error);
          }
        }, 50);
      };
    },
    [getCanvasContext, canvasSize, processImages]
  );

  // 处理Canvas点击事件
  const handleCanvasClick = useCallback(
    (e: any) => {
      if (!beads.length) return;

      // 获取Canvas元素的位置信息
      const query = Taro.createSelectorQuery();
      query.select(`#${canvasId}`).boundingClientRect((rectResult) => {
        const rect = Array.isArray(rectResult) ? rectResult[0] : rectResult;
        if (!rect) return;

        // 获取点击坐标
        let clickX = 0;
        let clickY = 0;

        if (e.detail && e.detail.x !== undefined) {
          // 小程序环境
          clickX = e.detail.x - rect.left;
          clickY = e.detail.y - rect.top;
        } else if (e.touches && e.touches[0]) {
          // 触摸事件
          clickX = e.touches[0].clientX - rect.left;
          clickY = e.touches[0].clientY - rect.top;
        } else if (e.clientX !== undefined) {
          // 鼠标事件
          clickX = e.clientX - rect.left;
          clickY = e.clientY - rect.top;
        }

        // 检查点击是否在某个珠子内
        for (let i = 0; i < beads.length; i++) {
          const bead = beads[i];
          const distance = Math.sqrt(
            Math.pow(clickX - bead.x, 2) + Math.pow(clickY - bead.y, 2)
          );

          if (distance <= bead.radius) {
            // 点击在珠子内
            if (selectedBeadIndex === i) {
              onBeadDeselect();
            } else {
              onBeadSelect(i);
            }
            break;
          }
        }
      });
      query.exec();
    },
    [beads, canvasId, selectedBeadIndex, onBeadSelect, onBeadDeselect]
  );

  // 绘制Canvas
  useEffect(() => {
    if (beads.length > 0) {
      debouncedDrawCanvas(beads, selectedBeadIndex);
    }
  }, [beads, selectedBeadIndex, debouncedDrawCanvas]);

  // 清理资源
  useEffect(() => {
    return () => {
      clearCanvasContext();
      if (requestAnimationFrameId.current) {
        cancelAnimationFrame(requestAnimationFrameId.current);
      }
      // 清理缓存
      imageProcessCacheRef.current.clear();
    };
  }, [clearCanvasContext]);

  return (
    <View className="ring-canvas-container" style={style}>
      <View 
        className="canvas-wrapper"
        onClick={onBeadDeselect}
      >
        <Canvas
          canvasId={canvasId}
          id={canvasId}
          height={`${canvasSize * dpr}px`}
          width={`${canvasSize * dpr}px`}
          style={{
            width: `${canvasSize}px`,
            height: `${canvasSize}px`,
          }}
          onTouchEnd={handleCanvasClick}
          onClick={handleCanvasClick}
        />
      </View>
    </View>
  );
};

export default React.memo(RingCanvasRenderer);
