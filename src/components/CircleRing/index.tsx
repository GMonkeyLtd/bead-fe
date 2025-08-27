import React, { useState, useEffect, useMemo } from "react";
import { Canvas, View, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./index.scss";

import { BASE_IMAGE_URL } from "@/config";
import { useCircleRingCanvas } from "@/hooks/useCircleRingCanvas";

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
  // 是否区分珠子尺寸
  fileType = "png",
  onChange = (
    status: "idle" | "downloading" | "success" | "error",
    canvasImage: string,
    dotsBgImageData: any[]
  ) => {},
}) => {
  if (!dotsBgImageData || dotsBgImageData.length === 0) {
    return null;
  }

  // 使用优化的hook
  const { generateCircleRing, getResult } = useCircleRingCanvas({
    targetSize,
    fileType: fileType as "png" | "jpg" | "jpeg",
  });

  // 当dotsBgImageData变化时，生成新的手串
  useEffect(() => {
    if (dotsBgImageData && dotsBgImageData.length > 0) {
      const result = getResult(dotsBgImageData);

      // 检查是否已经有结果，避免重复生成
      if (result.status === "idle") {
        onChange("downloading", "", dotsBgImageData);

        generateCircleRing(dotsBgImageData)
          .then((imageUrl) => {
            if (imageUrl) {
              onChange("success", imageUrl, dotsBgImageData);
              // 生成完成后清理Canvas资源
            }
          })
          .catch((error) => {
            console.error("生成手串失败:", error);
            onChange("error", "", dotsBgImageData);
            // 即使失败也要清理Canvas资源
          });
      } else if (result.status === "success" && result.imageUrl) {
        // 如果已经有结果，直接调用onChange
        onChange("success", result.imageUrl, dotsBgImageData);
      } else if (result.status === "error") {
        onChange("error", "", dotsBgImageData);
      }
    }
  }, [dotsBgImageData, generateCircleRing, getResult, onChange]);

  // 渲染Canvas（隐藏的，用于绘制）
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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageOpacity, setImageOpacity] = useState(0);

  // 当imageUrl变化时，重置状态
  useEffect(() => {
    if (imageUrl) {
      setImageLoaded(false);
      setImageOpacity(0);
    }
  }, [imageUrl]);

  // 图片加载完成后的处理
  const handleImageLoad = () => {
    setImageLoaded(true);
    // 延迟一点时间后开始淡入动画
    setTimeout(() => {
      setImageOpacity(1);
    }, 100);
  };

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
          borderRadius: "100%",
          boxShadow:
            "0px 0px 18px 0px rgba(79, 42, 6, 0.02), 0px 40px 16px 0px rgba(79, 42, 6, 0.02), 0px 12px 14px 0px rgba(79, 42, 6, 0.02), 0px 3px 6px 0px rgba(217, 205, 199, 0.07)",
        }}
      />
      {imageUrl ? (
        <Image
          src={imageUrl}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            position: "absolute",
            opacity: imageOpacity,
            transition: "opacity 0.8s ease-in-out",
          }}
          className={rotate ? "circle-image-rotate" : ""}
          onLoad={handleImageLoad}
          lazyLoad={true}
        />
      ) : (
        <View
          className="image-loading-skeleton"
          style={{
            width: `${backendSize}px`,
            height: `${backendSize}px`,
            position: "absolute",
          }}
        />
      )}
    </View>
  );
};
