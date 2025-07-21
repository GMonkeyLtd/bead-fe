import { useState, useEffect, useRef, useCallback } from "react";
import Taro from "@tarojs/taro";
import { ImageCacheManager } from "@/utils/image-cache";
import {
  calculateBeadArrangement,
  calculateBeadArrangementBySize,
} from "@/utils/cystal-tools";

export interface DotImageData {
  image_url: string;
  bead_diameter?: number;
}

interface CircleRingConfig {
  targetSize?: number;   // 保存图片的尺寸
  isDifferentSize?: boolean;   // 是否区分珠子尺寸
  fileType?: "png" | "jpg" | "jpeg";   // 文件类型
  canvasId?: string;    // canvas id
}

interface CircleRingResult {
  imageUrl: string | null;
  status: "idle" | "downloading" | "success" | "error";
  error?: string;
}

/**
 * 优化的CircleRing Canvas Hook
 * 使用单个canvas实例绘制多个手串，减少内存消耗
 */
export const useCircleRingCanvas = (config: CircleRingConfig = {}) => {
  const {
    targetSize = 1024,
    isDifferentSize = false,
    fileType = "png",
    canvasId = "shared-circle-canvas",
  } = config;

  // 使用useRef存储结果，避免循环渲染
  const resultsRef = useRef<Map<string, CircleRingResult>>(new Map());
  const processingQueueRef = useRef<Set<string>>(new Set());
  const dpr = Taro.getWindowInfo().pixelRatio || 2;
  const ringRadius = targetSize / 2;

  // 生成唯一的结果ID
  const generateResultId = useCallback((dotsBgImageData: DotImageData[]) => {
    return dotsBgImageData
      .map(item => `${item.image_url}_${item.bead_diameter || 'default'}`)
      .join('|');
  }, []);

  // 处理图片下载
  const processImages = useCallback(async (dotsBgImageData: DotImageData[]) => {
    const imageUrls = dotsBgImageData.map(item => item.image_url);
    
    try {
      const processedPaths = await ImageCacheManager.processImagePaths(imageUrls);
      return dotsBgImageData.map((item, index) => {
        const originalPath = item.image_url;
        return processedPaths.get(originalPath) || originalPath;
      });
    } catch (error) {
      console.error("❌ 图片处理过程出错:", error);
      throw error;
    }
  }, []);

  // 计算珠子排列
  const calculateBeads = useCallback((dotsBgImageData: DotImageData[]) => {
    const imageUrls = dotsBgImageData.map(item => item.image_url);
    
    if (isDifferentSize) {
      const beadSizes = dotsBgImageData.map(item => item.bead_diameter || 16);
      return calculateBeadArrangementBySize(
        ringRadius,
        beadSizes,
        { x: ringRadius, y: ringRadius }
      );
    } else {
      return calculateBeadArrangement(ringRadius, imageUrls.length);
    }
  }, [ringRadius, isDifferentSize]);

  // 绘制Canvas内容
  const drawCanvas = useCallback(async (
    dots: string[],
    beads: any[],
    resultId: string
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const ctx = Taro.createCanvasContext(canvasId);
        ctx.clearRect(0, 0, targetSize, targetSize);
        
        dots.forEach((dot: string, index) => {
          const { x, y, radius, angle } = beads[index];
          
          // 保存当前Canvas状态
          ctx.save();
          
          // 移动到珠子中心
          ctx.translate(x, y);
          
          // 旋转珠子，使孔线指向圆心
          ctx.rotate(angle + Math.PI / 2);
          
          // 绘制珠子（以珠子中心为原点）
          ctx.drawImage(dot, -radius, -radius, radius * 2, radius * 2);
          
          // 恢复Canvas状态
          ctx.restore();
        });

        ctx.draw(true, () => {
          Taro.canvasToTempFilePath({
            x: 0,
            y: 0,
            canvasId: canvasId,
            destHeight: targetSize * dpr,
            destWidth: targetSize * dpr,
            quality: 1,
            fileType: fileType as keyof Taro.canvasToTempFilePath.FileType,
            success: (res) => {
              resolve(res.tempFilePath);
            },
            fail: (err) => {
              console.error("生成临时文件失败:", err);
              reject(new Error("生成图片失败"));
            },
          });
        });
      } catch (error) {
        console.log("❌ Canvas API 不可用", error);
        reject(error);
      }
    });
  }, [canvasId, targetSize, dpr, fileType]);

  // 主要绘制函数
  const generateCircleRing = useCallback(async (dotsBgImageData: DotImageData[]) => {
    if (!dotsBgImageData || dotsBgImageData.length === 0) {
      return null;
    }

    const resultId = generateResultId(dotsBgImageData);
    
    // 检查是否已经在处理中
    if (processingQueueRef.current.has(resultId)) {
      return resultsRef.current.get(resultId)?.imageUrl || null;
    }

    // 检查是否已经有结果
    const existingResult = resultsRef.current.get(resultId);
    if (existingResult?.status === "success" && existingResult.imageUrl) {
      return existingResult.imageUrl;
    }

    // 开始处理
    processingQueueRef.current.add(resultId);
    resultsRef.current.set(resultId, {
      imageUrl: null,
      status: "downloading"
    });

    try {
      // 1. 处理图片下载
      const processedDots = await processImages(dotsBgImageData);
      
      // 2. 计算珠子排列
      const beads = calculateBeads(dotsBgImageData);
      
      // 3. 绘制Canvas
      const imageUrl = await drawCanvas(processedDots, beads, resultId);
      
      // 4. 更新结果
      resultsRef.current.set(resultId, {
        imageUrl,
        status: "success"
      });

      return imageUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "未知错误";
      resultsRef.current.set(resultId, {
        imageUrl: null,
        status: "error",
        error: errorMessage
      });
      throw error;
    } finally {
      processingQueueRef.current.delete(resultId);
    }
  }, [generateResultId, processImages, calculateBeads, drawCanvas]);

  // 获取结果状态
  const getResult = useCallback((dotsBgImageData: DotImageData[]) => {
    const resultId = generateResultId(dotsBgImageData);
    return resultsRef.current.get(resultId) || {
      imageUrl: null,
      status: "idle" as const
    };
  }, [generateResultId]);

  // 清除特定结果
  const clearResult = useCallback((dotsBgImageData: DotImageData[]) => {
    const resultId = generateResultId(dotsBgImageData);
    resultsRef.current.delete(resultId);
  }, [generateResultId]);

  // 清除所有结果
  const clearAllResults = useCallback(() => {
    resultsRef.current.clear();
  }, []);

  // 获取处理状态
  const getProcessingStatus = useCallback(() => {
    return {
      isProcessing: processingQueueRef.current.size > 0,
      processingCount: processingQueueRef.current.size,
      resultsCount: resultsRef.current.size
    };
  }, []);

  return {
    generateCircleRing,
    getResult,
    clearResult,
    clearAllResults,
    getProcessingStatus,
    // 返回Canvas组件所需的props
    canvasProps: {
      canvasId,
      id: canvasId,
      height: `${targetSize * dpr}px`,
      width: `${targetSize * dpr}px`,
      style: {
        width: `${targetSize}px`,
        height: `${targetSize}px`,
        visibility: "hidden",
        position: "absolute",
        top: "-999999px",
        left: "-999999px",
        zIndex: -100,
      }
    }
  };
}; 