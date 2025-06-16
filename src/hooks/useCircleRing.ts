import { useState, useEffect } from "react";
import Taro from "@tarojs/taro";
import { ImageCacheManager } from "@/utils/image-cache";
import { calculateBeadArrangement } from "@/utils/cystal-tools";

interface CircleRingOptions {
  canvasId: string;
  size?: number;
}

interface CircleRingResult {
  imageUrl: string;
  status: "idle" | "downloading" | "success" | "error";
  isLoading: boolean;
  error: Error | null;
  generateCircleRing: (dotsBgImagePath: string[]) => Promise<void>;
}

export const useCircleRing = ({
  canvasId = "circle-canvas",
  size = 140,
}: CircleRingOptions): CircleRingResult => {
  const [status, setStatus] = useState<
    "idle" | "downloading" | "success" | "error"
  >("idle");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [error, setError] = useState<Error | null>(null);
  const [dots, setDots] = useState<string[]>([]);

  console.log(imageUrl, canvasId, 'imageUrl 222222')

  const ringRadius = size / 2;

  const generateCircleRing = async (dotsBgImagePath: string[]) => {
    if (!dotsBgImagePath || dotsBgImagePath.length === 0) {
      setStatus("success");
      return;
    }

    const processImages = async () => {
      setStatus("downloading");
      setError(null);

      try {
        // 使用ImageCacheManager处理图片路径
        const processedPaths = await ImageCacheManager.processImagePaths(
          dotsBgImagePath
        );

        // 将处理后的路径映射回原始数组结构
        const finalImagePaths = dotsBgImagePath.map((originalPath: string) => {
          return processedPaths.get(originalPath) || originalPath;
        });

        setDots(finalImagePaths);
        setStatus("success");
      } catch (err) {
        console.error("❌ 图片处理过程出错:", err);
        setError(err instanceof Error ? err : new Error("图片处理失败"));
        setStatus("error");
      }
    };

    processImages();
  };

  // 绘制Canvas内容并转换为图片
  useEffect(() => {
    if (status !== "success" || dots.length === 0) {
      return;
    }

    const drawCanvasAndExport = async () => {
      try {
        console.log(canvasId, dots, 'canvasId 999999 1')
        const ctx = Taro.createCanvasContext(canvasId);

        // 清除画布
        ctx.clearRect(0, 0, size, size);

        const beads = calculateBeadArrangement(ringRadius, dots.length);

        // 绘制所有珠子
        dots.forEach((dot: string, index) => {
          const { x, y, radius } = beads.beads[index];
          ctx.drawImage(dot, x - radius, y - radius, radius * 2, radius * 2);
        });

        // 绘制完成后导出图片
        ctx.draw(true, () => {
            console.log('draw ', '7777777777')
          setTimeout(() => {
            Taro.canvasToTempFilePath({
              canvasId,
              success: (res) => {
                console.log(res, 'res 333333')
                setImageUrl(res.tempFilePath);
              },
              fail: (err) => {
                console.error("导出图片失败:", err);
                setError(new Error("导出图片失败"));
                setStatus("error");
              },
            });
          }, 100); // 给一点时间确保绘制完成
        });
      } catch (err) {
        console.error("❌ Canvas API 不可用:", err);
        setError(err instanceof Error ? err : new Error("Canvas API 不可用"));
        setStatus("error");
      }
    };

    drawCanvasAndExport();
  }, [dots, status]);

  return {
    imageUrl,
    status,
    isLoading: status === "downloading",
    error,
    generateCircleRing,
  };
};
