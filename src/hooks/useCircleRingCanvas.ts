import { useRef, useCallback, useMemo } from "react";
import Taro from "@tarojs/taro";
import { ImageCacheManager } from "@/utils/image-cache";
import {
  calculateBeadArrangementBySize,
} from "@/utils/cystal-tools";

export interface DotImageData {
  image_url: string;
  diameter?: number;
  width?: number;
  image_aspect_ratio?: number;
  isFloatAccessory?: boolean;   // 是否浮在别的珠子上的配饰
}

interface CircleRingConfig {
  targetSize?: number;   // 保存图片的尺寸
  fileType?: "png" | "jpg" | "jpeg";   // 文件类型
  canvasId?: string;
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
    fileType = "png",
    canvasId = "shared-circle-canvas",
  } = config;

  // const canvas = useMemo(
  //   () => {
  //     return Taro.createOffscreenCanvas({ type: '2d', width: targetSize, height: targetSize })
  //   },
  //   [targetSize]
  // );

  // console.log('canvas instance', canvas)

  // 使用useRef存储结果，避免循环渲染
  const resultsRef = useRef<Map<string, CircleRingResult>>(new Map());
  const processingQueueRef = useRef<Set<string>>(new Set());
  const dpr = Taro.getWindowInfo().pixelRatio || 2;
  const ringRadius = targetSize / 2;

  // 生成唯一的结果ID
  const generateResultId = useCallback((dotsBgImageData: DotImageData[]) => {
    return dotsBgImageData
      .map(item => `${item.image_url}_${item.diameter || 'default'}`)
      .join('|');
  }, []);

  // 处理图片下载
  const processImages = useCallback(async (dotsBgImageData: DotImageData[]) => {
    const imageUrls = dotsBgImageData.map(item => item.image_url);

    try {
      const processedPaths = await ImageCacheManager.processImagePaths(imageUrls);
      return dotsBgImageData.map((item) => {
        const originalPath = item.image_url;
        return processedPaths.get(originalPath) || originalPath;
      });
    } catch (error) {
      console.error("❌ 图片处理过程出错:", error);
      throw error;
    }
  }, []);

  // 计算珠子排列
  const calculateBeads = useCallback(async (dotsBgImageData: DotImageData[]) => {
    // 获取图片的宽
    return calculateBeadArrangementBySize(
      ringRadius,
      dotsBgImageData.map(item => {
        const ratioBeadWidth = item.isFloatAccessory ? 1 : (item.diameter || 10) * (item.image_aspect_ratio || 1);
        return { ratioBeadWidth, beadDiameter: item.diameter || 10 }
      }),
      { x: ringRadius, y: ringRadius }
    );
  }, [ringRadius]);

  // 绘制Canvas内容
  const drawCanvas = useCallback(async (
    dots: string[],
    beads: any[],
    dotsBgImageData: DotImageData[]
  ): Promise<string> => {
    console.log('canvas 开始绘制')
    return new Promise(async (resolve, reject) => {
      try {
        // const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
        const ctx = Taro.createCanvasContext(canvasId);
        console.log('canvas context: ', ctx);
        ctx.clearRect(0, 0, targetSize, targetSize);

        const finalBeadsData = dots.map((item, index) => {
          return {
            image_url: item,
            isFloatAccessory: dotsBgImageData[index]?.isFloatAccessory,
            image_aspect_ratio: dotsBgImageData[index]?.image_aspect_ratio,
            ...beads[index]
          }
        })

        const regularBeads = finalBeadsData.filter(item => !item.isFloatAccessory);
        const floatAccessoryBeads = finalBeadsData.filter(item => item.isFloatAccessory);
        const sortedBeads = [...regularBeads, ...floatAccessoryBeads];
        console.log('canvas sortedBeads:', sortedBeads);
        // 顺序绘制珠子，确保圆形排列正确
        for (let index = 0; index < dots.length; index++) {
          const { x, y, scale_width, angle, scale_height, image_url, isFloatAccessory, image_aspect_ratio } = sortedBeads[index];

          // 保存当前Canvas状态
          ctx.save();

          // 移动到珠子中心
          ctx.translate(x, y);

          // 旋转珠子，使孔线指向圆心
          ctx.rotate(angle + Math.PI / 2);

          // 1. 先把网络背景图下载到本地
          // const bgImg = canvas.createImage();
          // await new Promise<void>(r => { bgImg.onload = r; bgImg.src = image_url; });
          // console.log('canvas bgImg:', bgImg.src);
          if (isFloatAccessory) {
            console.log('canvas isFloatAccessory:', isFloatAccessory);
            ctx.drawImage(image_url as any, -(scale_height * image_aspect_ratio), -scale_height, 2 * scale_height * image_aspect_ratio, scale_height * 2);
          } else {
            console.log('canvas is not floatAccessory:', isFloatAccessory);
            ctx.drawImage(image_url as any, -scale_width, -scale_height, scale_width * 2, scale_height * 2);
          }

          // 绘制珠子高光效果 - 参考MovableBeadRenderer的实现
          if (!isFloatAccessory) {
            // 创建径向渐变 - 模拟CSS的 radial-gradient(ellipse at 30% 30%, rgba(255,255,255) 0%, rgba(255,255,255,0.4) 75%, transparent 100%)
            const highlightWidth = scale_width * 2 * 0.2; // 宽度为直径的20%
            const highlightHeight = scale_height * 2 * 0.1; // 高度为直径的10%
            
            // 高光位置：左上角25%，25%的位置（相对于珠子中心的偏移）
            const highlightX = -scale_width + (scale_width * 2 * 0.25); // 左上角25%位置
            const highlightY = -scale_height + (scale_height * 2 * 0.25); // 左上角25%位置
            
            // 保存当前状态以应用高光旋转
            ctx.save();
            
            // 移动到高光中心位置
            ctx.translate(highlightX, highlightY);
            
            // 旋转-45度
            ctx.rotate(-Math.PI / 4);
            
            // 创建椭圆形径向渐变
            // const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(highlightWidth, highlightHeight) / 2);
            // gradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); // 中心白色
            // gradient.addColorStop(0.75, 'rgba(255, 255, 255, 0.4)'); // 75%处半透明白色
            // gradient.addColorStop(1, 'rgba(255, 255, 255, 0)'); // 边缘透明
            
            // // 设置填充样式
            // ctx.fillStyle = gradient;
            
            // 绘制椭圆高光
            // ctx.beginPath();
            // ctx.ellipse(0, 0, highlightWidth / 2, highlightHeight / 2, 0, 0, 2 * Math.PI);
            // ctx.fill();
            
            // 恢复状态
            ctx.restore();
          }

          // 恢复Canvas状态
          ctx.restore();
        }
        console.log('canvas 绘制完成')
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
              console.log('canvas 生成临时文件成功: ', res.tempFilePath)
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
      console.log('canvas processedDots:', processedDots);
      // 2. 计算珠子排列
      const beads = await calculateBeads(dotsBgImageData);
      console.log('canvas beads:', beads);
      // 3. 绘制Canvas
      const imageUrl = await drawCanvas(processedDots, beads, dotsBgImageData);

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
    canvasProps: {
      canvasId,
      id: canvasId,
      height: `${targetSize * dpr}px`,
      width: `${targetSize * dpr}px`,
      style: {
        width: `${targetSize}px`,
        height: `${targetSize}px`,
        visibility: "hidden",
        position: "fixed",
        top: "-999999px",
        left: "-999999px",
        zIndex: -100,
      }
    }
  };
}; 