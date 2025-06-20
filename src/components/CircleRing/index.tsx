import React, { useState, useEffect, useMemo } from "react";
import { Canvas, View, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./index.scss";
import { ImageCacheManager } from "@/utils/image-cache";
import { calculateBeadArrangement } from "@/utils/cystal-tools";
import { BASE_IMAGE_URL } from "@/config";
/**
 * 水晶手链组件 - 动态计算珠子数量
 *
 * 根据珠子半径和手链半径自动计算最佳的珠子数量，形成完美的圆形手链
 *
 * @param dotRadius 珠子半径，默认16px
 * @param dotDistance 手链半径（从中心到珠子中心的距离），默认110px
 * @param size Canvas画布尺寸，默认400px
 * @param spacingFactor 间距系数，1.0表示珠子相切，1.2表示有20%的间隙，默认1.2
 * @param onDotClick 珠子点击回调函数
 *
 * 使用示例：
 * ```jsx
 * // 紧密排列的小珠子
 * <CircleComponent dotRadius={8} dotDistance={100} spacingFactor={1.0} />
 *
 * // 稀疏排列的大珠子
 * <CircleComponent dotRadius={20} dotDistance={150} spacingFactor={1.5} />
 *
 * // 默认设置
 * <CircleComponent />
 * ```
 */

const CircleRing = ({
  targetSize = 1024, // 保存图片的尺寸
  dotsBgImageData,
  canvasId = "circle-canvas",
  showCanvas = false,
  onChange = (
    status: "idle" | "downloading" | "success" | "error",
    canvasImage: string
  ) => {},
}) => {
  const [dots, setDots] = useState<any[]>([]);
  const [downloadStatus, setDownloadStatus] = useState<
    "idle" | "downloading" | "success" | "error"
  >("idle");
  const ringRadius = targetSize / 2;
  const dpr = Taro.getSystemInfoSync().pixelRatio;

  const dotsBgImagePath = useMemo(
    () => dotsBgImageData.map((item: any) => item.image_url),
    [dotsBgImageData]
  );

  const beads = calculateBeadArrangement(ringRadius, dotsBgImagePath.length);

  // 处理图片路径（下载网络图片）
  useEffect(() => {
    if (!dotsBgImagePath || dotsBgImagePath.length === 0) {
      setDownloadStatus("success");
      return;
    }
    console.log("rerender dots");

    const processImages = async () => {
      setDownloadStatus("downloading");
      try {
        const processedPaths = await ImageCacheManager.processImagePaths(
          dotsBgImagePath
        );

        const finalImagePaths = dotsBgImagePath.map((originalPath: string) => {
          return processedPaths.get(originalPath) || originalPath;
        });

        setDots(finalImagePaths);
        setDownloadStatus("success");
      } catch (error) {
        console.error("❌ 图片处理过程出错:", error);
        setDownloadStatus("error");
      }
    };

    processImages();
  }, [dotsBgImagePath, ringRadius]);

  // 绘制Canvas内容
  const drawCanvas = async() => {
    try {
     
      const ctx = Taro.createCanvasContext(canvasId);
      ctx.clearRect(0, 0, targetSize, targetSize);

      dots.forEach((dot: any, index) => {
        const { x, y, radius } = beads.beads[index];
        ctx.drawImage(dot, x - radius, y - radius, radius * 2, radius * 2);
      });

      ctx.draw(true, () => {
        Taro.canvasToTempFilePath({
          x: 0,
          y: 0,
          canvasId: canvasId,
          destHeight: targetSize * dpr,
          destWidth: targetSize * dpr,
          quality: 1,
          success: (res) => {
            onChange("success", res.tempFilePath);
            console.log("生成临时文件成功", res.tempFilePath);
          },
          fail: (err) => {
            console.error("生成临时文件失败:", err);
            Taro.showToast({ title: "生成图片失败", icon: "none" });
          },
        });
      });
    } catch (error) {
      console.log("❌ Canvas API 不可用，使用备用方案", error);
    }
  };

  const drawPlaceHolder = () => {
    try {
      const ctx = Taro.createCanvasContext(canvasId + "placeholder");
      ctx.clearRect(0, 0, targetSize, targetSize);
      ctx.setFillStyle("rgba(232, 217, 187, 0.8)");
      beads.beads.forEach(({ x, y, radius }: any) => {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();
      });
      ctx.draw();
    } catch (error) {
      console.log("❌ Canvas API 不可用，使用备用方案", error);
    }
  };

  useEffect(() => {
    if (dots.length > 0 && downloadStatus === "success") {
      setTimeout(drawCanvas, 100);
    } else {
      drawPlaceHolder();
    }
  }, [dots, downloadStatus]);

  if (downloadStatus === "success") {
    return (
      <Canvas
          canvasId={canvasId}
          id={canvasId}
          height={`${targetSize * dpr}px`}
          width={`${targetSize * dpr}px`} 
          // className={rotate ? "circle-canvas-rotate" : ""}
          style={{
            width: `${targetSize}px`,
            height: `${targetSize}px`,
            visibility: showCanvas ? "visible" : "hidden",
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: -100,
            transition: "display 0.3s ease-in-out",
          }}
        />
    )
  }
  return null;
};

export default React.memo(CircleRing);

export const CircleRingImage = ({
  size = 140, // Canvas尺寸
  backendSize = 160, // 珠子底座图像尺寸
  imageUrl,
  backgroundImage = BASE_IMAGE_URL,
  rotate = false,
}) => {
  return (
    <View
      style={{
        width: `${backendSize}px`,
        height: `${backendSize}px`,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
      }}
    >
      <Image
        src={backgroundImage}
        style={{
          width: `${backendSize}px`,
          height: `${backendSize}px`,
          position: "absolute",
        }}
      />
      <Image
        src={imageUrl}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          position: "absolute",
          transition: "opacity 0.3s ease-in-out",
        }}
        className={rotate ? "circle-image-rotate" : ""}
      />
    </View>
  )
}
