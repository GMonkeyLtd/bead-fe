import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Canvas, View, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { ImageCacheManager } from "@/utils/image-cache";
import CrystalButton from "../CrystalButton";
import "./CustomDesignRing.scss";
import { computeBraceletLength } from "@/utils/cystal-tools";
import CircleRing, { CircleRingImage } from "../CircleRing";

interface Bead {
  image_url: string;
  render_diameter: number; // 渲染直径
  bead_diameter: number; // 珠子直径
  id?: string | number;
}

interface Position {
  x: number;
  y: number;
  angle: number;
  radius: number;
  imageData: string;
  id?: string | number;
}

const WUXING_MAP = ["金", "火", "土", "木", "水"];
const targetSize = 1024;

const SIZE_MAP = {
  8: 34,
  10: 48,
  12: 56,
};

// 防抖函数
const debounce = (func: Function, wait: number) => {
  let timeout: any;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * CustomCircleRing 组件
 * @param beads 珠子数组，每个珠子包含 image（图片地址）和 radius（半径，px）
 * @param canvasId 画布ID
 * @param size 画布尺寸，默认400px
 * @param spacing 珠子间距，默认0px
 * @param onBeadClick 珠子点击回调函数
 */
const CustomDesignRing = ({
  beads = [],
  canvasId = "custom-circle-canvas",
  size = 0,
  spacing = 0,
  beadTypeMap = {},
  renderRatio = 2,
  onOk,
}: {
  beads: Bead[];
  canvasId?: string;
  size?: number;
  spacing?: number;
  beadTypeMap?: any;
  renderRatio?: number;
  onOk?: (imageUrl: string, editedBeads: Bead[]) => void;
}) => {
  const dpr = Taro.getWindowInfo().pixelRatio || 2;
  const [dots, setDots] = useState<any[]>([]);
  const [selectedBeadIndex, setSelectedBeadIndex] = useState<number>(-1);
  const [beadStatus, setBeadStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");

  const [curWuxing, setCurWuxing] = useState<string>("");
  const [predictedLength, setPredictedLength] = useState<number>(0);
  const [canvasSize, setCanvasSize] = useState<number>(0);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [createFlag, setCreateFlag] = useState<boolean>(false);

  // 性能优化：使用ref缓存计算结果和Canvas上下文
  const canvasContextRef = useRef<any>(null);
  const imageProcessCacheRef = useRef<Map<string, string>>(new Map());
  const positionCacheRef = useRef<Map<string, Position[]>>(new Map());
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

  useEffect(() => {
    try {
      const windowInfo = Taro.getWindowInfo();
      const { height: safeHeight } = windowInfo.safeArea || { height: 0 };
      const predictSize = safeHeight / 2 - 16 - 45;
      setCanvasSize(!size && predictSize ? predictSize : size);
    } catch (error) {
      console.warn('Failed to get window info:', error);
      // 降级使用固定尺寸
      const fallbackSize = 300;
      setCanvasSize(!size ? fallbackSize : size);
    }
  }, [size]);

  // 优化：使用稳定的引用避免不必要的重新计算
  const allWuxing = useMemo(
    () => Object.keys(beadTypeMap),
    [beadTypeMap]
  );

  useEffect(() => {
    if (allWuxing.length > 0) {
      setCurWuxing(allWuxing[0]);
    }
  }, [allWuxing]);

  // 优化：防抖计算手围长度
  const debouncedCalculatePredictedLength = useMemo(
    () => debounce((dots: any[]) => {
      if (dots.length > 0) {
        const predictLength = computeBraceletLength(dots, 'bead_diameter');
        setPredictedLength(predictLength);
      }
    }, 100),
    []
  );

  useEffect(() => {
    debouncedCalculatePredictedLength(dots);
  }, [dots, debouncedCalculatePredictedLength]);

  useEffect(() => {
    if (imageUrl && createFlag) {
      setCreateFlag(false);
      onOk?.(
        imageUrl,
        dots.map((item) => ({
          id: item.id,
          image_url: item.image_url,
          bead_diameter: item.bead_diameter,
          render_diameter: item.render_diameter,
        }))
      );
    }
  }, [imageUrl, createFlag, dots, onOk]);

  // 优化：图片处理缓存
  const processImages = useCallback(async (_beads: Bead[]) => {
    const cacheKey = _beads.map(item => item.image_url).join(',');
    
    if (imageProcessCacheRef.current.has(cacheKey)) {
      const cachedData = imageProcessCacheRef.current.get(cacheKey);
      return JSON.parse(cachedData || '[]');
    }

    try {
      const processedPaths = await ImageCacheManager.processImagePaths(
        _beads.map((item: Bead) => item.image_url)
      );

      const beadsWithImageData = _beads.map((bead: Bead) => {
        return {
          ...bead,
          imageData: processedPaths.get(bead.image_url) || bead.image_url,
        };
      });

      // 缓存结果
      imageProcessCacheRef.current.set(cacheKey, JSON.stringify(beadsWithImageData));
      
      // 限制缓存大小，避免内存泄漏
      if (imageProcessCacheRef.current.size > 50) {
        const firstKey = imageProcessCacheRef.current.keys().next().value;
        imageProcessCacheRef.current.delete(firstKey);
      }

      return beadsWithImageData;
    } catch (error) {
      console.error('图片处理失败:', error);
      throw error;
    }
  }, []);

  // 优化：位置计算缓存
  const computeBeadPositions = useCallback((beads: Bead[], spacing: number) => {
    const cacheKey = `${JSON.stringify(beads.map(b => ({d: b.render_diameter, id: b.id})))}_${spacing}_${canvasSize}`;
    
    if (positionCacheRef.current.has(cacheKey)) {
      return positionCacheRef.current.get(cacheKey)!;
    }

    const ringRadius = calcRingRadius(beads, spacing);
    const calculatedPositions = calcPositions(beads, spacing, ringRadius);
    
    // 缓存结果
    positionCacheRef.current.set(cacheKey, calculatedPositions);
    
    // 限制缓存大小
    if (positionCacheRef.current.size > 20) {
      const firstKey = positionCacheRef.current.keys().next().value;
      positionCacheRef.current.delete(firstKey);
    }

    return calculatedPositions;
  }, [canvasSize]);

  // 优化：异步处理珠子，避免阻塞UI
  const processBeads = useCallback(async (_beads: Bead[]) => {
    if (isProcessingRef.current) {
      return; // 避免重复处理
    }

    isProcessingRef.current = true;
    setBeadStatus("processing");
    setImageUrl("");
    console.log(_beads, 'processBeads')

    try {
      // 分批处理，避免长时间阻塞
      const beadsWithImageData = await processImages(_beads);
      
      // 使用 requestAnimationFrame 确保UI响应
      requestAnimationFrameId.current = requestAnimationFrame(() => {
        try {
          const positions = computeBeadPositions(beadsWithImageData, spacing);
          console.log(positions, 'positions') 
          setDots(positions);
          setBeadStatus("success");
        } catch (error) {
          console.error("位置计算失败:", error);
          setBeadStatus("error");
        } finally {
          isProcessingRef.current = false;
        }
      });
    } catch (error) {
      console.error("❌ 珠子处理过程出错:", error);
      setBeadStatus("error");
      isProcessingRef.current = false;
    }
  }, [processImages, computeBeadPositions, spacing]);

  // 优化：使用稳定的key避免不必要的重新处理
  const beadsKey = useMemo(() => {
    return JSON.stringify(beads.map(b => ({ 
      id: b.id, 
      image_url: b.image_url, 
      render_diameter: b.render_diameter, 
      bead_diameter: b.bead_diameter 
    })));
  }, [beads]);

  useEffect(() => {
    if (!beads || beads.length === 0 || !canvasSize) {
      setBeadStatus("success");
      return;
    }

    try {
      processBeads(beads);
    } catch (error) {
      console.error("❌ 珠子处理过程出错:", error);
      setBeadStatus("error");
    }

    // 清理函数
    return () => {
      if (requestAnimationFrameId.current) {
        cancelAnimationFrame(requestAnimationFrameId.current);
      }
      isProcessingRef.current = false;
    };
  }, [beadsKey, canvasSize, processBeads]);

  // 动态计算圆环半径
  function calcRingRadius(beads: any[], spacing: number) {
    if (!beads.length) return 0;
    
    // 计算所有珠子的总直径和总间距
    const totalBeadDiameter = beads.reduce((sum, b) => sum + b.render_diameter, 0);
    const totalSpacing = beads.length * spacing; // n个珠子需要n个间距
    const totalArcLen = totalBeadDiameter + totalSpacing;
    
    // 基础圆环半径
    const baseRadius = totalArcLen / (2 * Math.PI);
    
    // 确保最小半径，避免珠子过度拥挤
    const maxBeadRadius = Math.max(...beads.map(b => b.render_diameter / 2));
    const minRingRadius = maxBeadRadius * 2; // 至少是最大珠子直径的1倍
    
    // 限制最大半径，避免在小画布上显示过大
    const maxRingRadius = canvasSize * 0.4; // 不超过画布的40%
    
    return Math.max(minRingRadius, Math.min(maxRingRadius, baseRadius));
  }

  // 计算每个珠子的圆心坐标 - 优化版本，避免角度累积误差
  function calcPositions(
    dots: any[],
    spacing: number,
    ringRadius: number
  ): Position[] {
    if (!dots.length) return [];
    
    const positions: Position[] = [];
    const center = canvasSize / 2;

    // 首先计算所有相邻珠子之间的角度
    const angles: number[] = [];
    let totalAngle = 0;
    
    for (let i = 0; i < dots.length; i++) {
      const j = (i + 1) % dots.length;
      const r1 = dots[i].render_diameter / 2;
      const r2 = dots[j].render_diameter / 2;
      const L = r1 + r2 + spacing;
      
      // 确保不会出现无效的计算
      const sinValue = Math.min(1, L / (2 * ringRadius));
      const theta = 2 * Math.asin(sinValue);
      
      if (!isFinite(theta) || theta <= 0) {
        // 如果计算出现问题，使用均匀分布作为备用方案
        console.warn('角度计算异常，使用均匀分布');
        const uniformAngle = (2 * Math.PI) / dots.length;
        for (let k = 0; k < dots.length; k++) {
          positions.push({
            ...dots[k],
            radius: dots[k].render_diameter / 2,
            x: center + ringRadius * Math.cos(k * uniformAngle),
            y: center + ringRadius * Math.sin(k * uniformAngle),
            angle: k * uniformAngle,
          });
        }
        return positions;
      }
      
      angles.push(theta);
      totalAngle += theta;
    }

    // 如果总角度不等于2π，进行比例调整以避免重叠或间隙
    const targetAngle = 2 * Math.PI;
    const angleRatio = targetAngle / totalAngle;
    
    // 重新分布角度，确保总和为2π
    const adjustedAngles = angles.map(angle => angle * angleRatio);
    
    // 根据调整后的角度计算位置
    let currentAngle = 0;
    for (let i = 0; i < dots.length; i++) {
      const radius = dots[i].render_diameter / 2;
      
      positions.push({
        ...dots[i],
        radius: radius,
        x: center + ringRadius * Math.cos(currentAngle),
        y: center + ringRadius * Math.sin(currentAngle),
        angle: currentAngle,
      });

      // 更新角度
      currentAngle += adjustedAngles[i];
    }
    
    return positions;
  }

  // 优化：防抖Canvas绘制
  const debouncedDrawCanvas = useMemo(
    () => debounce(async (dotList: any[], selectedBeadIndex: number) => {
      if (!dotList.length) return;

      const ctx = getCanvasContext();
      if (!ctx) return;

      try {
        ctx.clearRect(0, 0, canvasSize, canvasSize);

        // 批量绘制非选中的珠子
        const normalBeads = dotList.filter((_, index) => index !== selectedBeadIndex);
        const selectedBead = selectedBeadIndex !== -1 ? dotList[selectedBeadIndex] : null;

        // 绘制普通珠子
        normalBeads.forEach((item, originalIndex) => {
          const actualIndex = dotList.indexOf(item);
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
          if (selectedBeadIndex !== -1 && actualIndex !== selectedBeadIndex) {
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
        console.error('Canvas绘制失败:', error);
      }
    }, 50),
    [getCanvasContext, canvasSize]
  );

  // 处理Canvas点击事件
  const handleCanvasClick = useCallback((e: any) => {
    if (!dots.length) return;

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
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        const distance = Math.sqrt(
          Math.pow(clickX - dot.x, 2) + Math.pow(clickY - dot.y, 2)
        );

        if (distance <= dot.radius) {
          // 点击在珠子内
          setSelectedBeadIndex((prev) => (prev === i ? -1 : i));
          break;
        }
      }
    });
    query.exec();
  }, [dots, canvasId]);

  const onWuxingChange = useCallback((wuxing: string) => {
    setCurWuxing(wuxing);
  }, []);

  useEffect(() => {
    if (beadStatus === "success") {
      debouncedDrawCanvas(dots, selectedBeadIndex);
    }
  }, [beadStatus, dots, selectedBeadIndex, debouncedDrawCanvas]);

  // 优化：防抖更新珠子
  const debouncedUpdateBeads = useMemo(
    () => debounce((newDots: any[]) => {
      processBeads(newDots);
      setImageUrl("");
    }, 100),
    [processBeads]
  );

  const updateBeads = useCallback((newDots: any[]) => {
    debouncedUpdateBeads(newDots);
  }, [debouncedUpdateBeads]);

  const onClockwiseMove = useCallback(() => {
    if (selectedBeadIndex === -1) {
      Taro.showToast({
        title: "请先选择要移动的珠子",
        icon: "none",
      });
      return;
    }
    const newDots = [...dots];
    const selectedBead = newDots[selectedBeadIndex || 0];
    if (!selectedBead) return;
    const nextIndex = (selectedBeadIndex + 1) % newDots.length;
    newDots[selectedBeadIndex || 0] = newDots[nextIndex];
    newDots[nextIndex] = selectedBead;
    updateBeads(newDots);
    setSelectedBeadIndex(nextIndex);
  }, [selectedBeadIndex, dots, updateBeads]);

  const onCounterclockwiseMove = useCallback(() => {
    if (selectedBeadIndex === -1) {
      Taro.showToast({
        title: "请先选择要移动的珠子",
        icon: "none",
      });
      return;
    }
    const newDots = [...dots];
    const selectedBead = newDots[selectedBeadIndex || 0];
    if (!selectedBead) return;
    const nextIndex = (selectedBeadIndex - 1 + newDots.length) % newDots.length;
    newDots[selectedBeadIndex || 0] = newDots[nextIndex];
    newDots[nextIndex] = selectedBead;
    updateBeads(newDots);
    setSelectedBeadIndex(nextIndex);
  }, [selectedBeadIndex, dots, updateBeads]);

  const onDelete = useCallback(() => {
    if (selectedBeadIndex === -1) {
      Taro.showToast({
        title: "请先选择要删除的珠子",
        icon: "none",
      });
      return;
    }
    const newDots = [...dots];
    newDots.splice(selectedBeadIndex, 1);
    const nextIndex = Math.min(selectedBeadIndex, newDots.length - 1);
    updateBeads(newDots);
    setSelectedBeadIndex(newDots.length > 0 ? nextIndex : -1);
  }, [selectedBeadIndex, dots, updateBeads]);

  const handleBeadClick = useCallback((bead: any, size: number) => {
    const newDots = [...dots];
    if (selectedBeadIndex === -1) {
      newDots.push({
        ...bead,
        render_diameter: size * renderRatio,
        bead_diameter: size,
      });
    } else {
      console.log(selectedBeadIndex, size, dots[selectedBeadIndex], 'selectedBeadIndex')
      newDots[selectedBeadIndex] = {
        ...bead,
        render_diameter: size * renderRatio,
        bead_diameter: size,
      };
      console.log(newDots[selectedBeadIndex], 'newDots[selectedBeadIndex]')
    }
    console.log(newDots, 'newDots')
    updateBeads(newDots);
  }, [dots, selectedBeadIndex, renderRatio, updateBeads]);

  // 清理资源
  useEffect(() => {
    return () => {
      clearCanvasContext();
      if (requestAnimationFrameId.current) {
        cancelAnimationFrame(requestAnimationFrameId.current);
      }
      // 清理缓存
      imageProcessCacheRef.current.clear();
      positionCacheRef.current.clear();
    };
  }, [clearCanvasContext]);

  const renderBeads = () => {
    const typeBeads = beadTypeMap[curWuxing];
    if (!typeBeads || typeBeads.length === 0) return null;
    return (
      <View
        key={curWuxing}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          overflowY: "auto",
          width: "100%",
          padding: "0px 0px 24px 12px",
          gap: "16px",
          borderRadius: "0 8px 8px 0",
          height: "100%",
          boxSizing: "border-box",
          // backgroundColor: "#f7eed4e8",
          // boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        {typeBeads?.map((item: any) => {
          return (
            <View
              key={item.id}
              style={{
                width: "100%",
                height: "120px",
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignContent: "center",
                gap: "8px",
                // boxSizing: "border-box",
              }}
            >
              {[8, 10, 12].map((size) => {
                return (
                  <View
                    key={`${item.id}-${size}`}
                    onClick={() => handleBeadClick(item, size)}
                    style={{
                      flex: 1,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "72px",
                        width: "72px",
                        backgroundColor: "#ffffff8a",
                        borderRadius: "4px",
                      }}
                    >
                      <Image
                        src={item.image_url}
                        style={{
                          width: `${SIZE_MAP[size] * 0.7}px`,
                          height: `${SIZE_MAP[size] * 0.7}px`,
                        }}
                      />
                    </View>
                    <View
                      style={{
                        fontSize: "12px",
                        color: "#333",
                        textAlign: "center",
                        marginTop: "4px",
                      }}
                    >
                      {item.name}
                    </View>
                    <View
                      style={{
                        fontSize: "10px",
                        color: "#8e7767",
                        textAlign: "center",
                      }}
                    >
                      {size}mm
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View className="custom-design-ring-container">
      {/* 顶部内容区域 */}
      <View
        className="custom-design-ring-top-container"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          height: `${canvasSize + 16 + 45}px`,
          // height: '50%',
          flexShrink: 0,
          flexGrow: 0,
        }}
      >
        <View
          style={{
            width: "100%",
            position: "relative",
            height: `${canvasSize}px`,
          }}
        >
          <View
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              height: "100%",
            }}
          >
            <View style={{ fontSize: "12px", color: "#333" }}>适合手围:</View>
            <View style={{ fontSize: "12px", color: "#333" }}>
              {`${predictedLength}cm ~ ${predictedLength + 0.5}cm`}
            </View>
          </View>
          <View
            style={{
              width: "100%",
              height: "100%",
              position: "absolute",
              top: 0,
              left: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexShrink: 0,
              flexGrow: 0,
            }}
            onClick={() => setSelectedBeadIndex(-1)}
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
        <View
          style={{
            position: "absolute",
            top: "24px",
            right: "24px",
            border: "1px solid #e4c0a0",
            opacity: !imageUrl ? 0.5 : 1,
            background: "#e4c0a038",
            borderRadius: "8px",
            padding: "4px 8px",
            fontSize: "14px",
            boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.1)",
          }}
          onClick={() => {
            onOk?.(imageUrl, dots.map((item) => ({
              id: item.id,
              image_url: item.image_url,
              bead_diameter: item.bead_diameter,
              render_diameter: item.render_diameter,
            })));
          }}
        >
          去制作
        </View>

        <View
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            width: "80%",
            gap: "16px",
          }}
        >
          <CrystalButton onClick={onCounterclockwiseMove} text="右移" />
          <CrystalButton onClick={onClockwiseMove} text="左移" />

          <CrystalButton onClick={onDelete} text="删除" />
        </View>
      </View>
      {/* 左侧纵向Tab选择器 */}
      <View className="custom-design-ring-bottom-container">
        <View
          style={{
            width: "60px",
            height: "100%",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px 0 0 8px",
            padding: "8px",
            overflowY: "auto",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            // boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.1)",
            // borderRight: "1px solid #efd8c4b8"
          }}
        >
          {allWuxing.map((wuxing, index) => (
            <View
              key={wuxing}
              onClick={() => onWuxingChange(wuxing)}
              style={{
                padding: "8px 12px",
                marginBottom: "8px",
                borderRadius: "6px",
                backgroundColor: curWuxing === wuxing ? "#fdf6eae8" : "#f5f5f5",
                color: curWuxing === wuxing ? "#fffff" : "#333",
                fontSize: "12px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
                // border:
                //   selectedBeadType === beadType
                //     ? "1px solid #ecbd2d"
                //     : "1px solid #e0e0e0",
                boxShadow:
                  curWuxing === wuxing ? "0 2px 4px rgb(194 216 226)" : "none",
              }}
            >
              {wuxing}
              {beadTypeMap[wuxing] && beadTypeMap[wuxing].length > 0 && (
                <View
                  style={{
                    fontSize: "10px",
                    marginTop: "4px",
                    opacity: 0.8,
                  }}
                >
                  ({beadTypeMap[wuxing].length}个)
                </View>
              )}
            </View>
          ))}
        </View>
        {renderBeads()}
      </View>
      <CircleRing
        dotsBgImageData={dots}
        targetSize={1024}
        canvasId="circle-ring-canvas111"
        isDifferentSize
        fileType="jpg"
        onChange={(status, canvasImage) => {
          setImageUrl(canvasImage);
        }}
      />
    </View>
  );
};

export default CustomDesignRing;
