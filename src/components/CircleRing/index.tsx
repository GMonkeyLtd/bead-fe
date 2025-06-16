import React, { useState, useEffect, useRef } from "react";
import { Canvas, View, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./index.scss";
import { getDotRingData } from "@/utils/cystal-tools";
import { ImageCacheManager } from "@/utils/image-cache";
import base from "@/assets/base.png";
import { calculateBeadArrangement } from "@/utils/cystal-tools";
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
  size = 140, // Canvas尺寸
  backendSize = 160, // 珠子底座图像尺寸
  dotsBgImagePath,
  rotate = false,
  canvasId = "circle-canvas",
  onChange = (status: 'idle' | 'downloading' | 'success' | 'error', canvasImage: string) => {}
}) => {
  const [dots, setDots] = useState<any[]>([]);
  const [downloadStatus, setDownloadStatus] = useState<
    "idle" | "downloading" | "success" | "error"
  >("idle");
  const [canvasImage, setCanvasImage] = useState<string>("");
  const ringRadius = size / 2; // 从中心到珠子中心的距离

   // 绘制环绕的水晶珠子

   const beads = calculateBeadArrangement(ringRadius, dotsBgImagePath.length);

  useEffect(() => {
    onChange(downloadStatus, canvasImage);
  }, [canvasImage, downloadStatus]);

  // 处理图片路径（下载网络图片）
  useEffect(() => {
    if (!dotsBgImagePath || dotsBgImagePath.length === 0) {
      setDownloadStatus("success");
      return;
    }

    const processImages = async () => {
      setDownloadStatus("downloading");
      try {
        // 使用ImageCacheManager处理图片路径
        const processedPaths = await ImageCacheManager.processImagePaths(
          dotsBgImagePath
        );

        // 将处理后的路径映射回原始数组结构
        const finalImagePaths = dotsBgImagePath.map((originalPath: string) => {
          return processedPaths.get(originalPath) || originalPath;
        });

        // 生成珠子位置数据
        // const dotRingData = getDotRingData(finalImagePaths, ringRadius, size / 2, size / 2);
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
  const drawCanvas = () => {
    try {
      const ctx = Taro.createCanvasContext(canvasId);

      // 清除画布
      ctx.clearRect(0, 0, size, size);

      // 绘制背景圆环轨道（可选）
      // ctx.beginPath();
      // ctx.arc(size / 2, size / 2, dotDistance, 0, 2 * Math.PI);
      // ctx.setStrokeStyle('rgba(255, 255, 255, 0.2)');
      // ctx.setLineWidth(2);
      // ctx.stroke();

     

      dots.forEach((dot: any, index) => {
        const { x, y, radius } = beads.beads[index];
        ctx.drawImage(dot, x - radius, y - radius, radius * 2, radius * 2);
      });

      ctx.draw(true, () => {
        Taro.canvasToTempFilePath({
          canvasId: canvasId,
          success: (res) => {
            setCanvasImage(res.tempFilePath);
            console.log(res, "res 111111");
          },
          fail: (err) => {
            console.error("生成临时文件失败:", err);
            Taro.showToast({ title: "生成图片失败", icon: "none" });
          },
        });
      });
      console.log(`🎨 Canvas绘制完成，绘制了 ${dots.length} 个珠子`);
    } catch (error) {
      // 兼容处理：如果Canvas API不可用，使用备用方案
      console.log("❌ Canvas API 不可用，使用备用方案", error);
    }
  };

  const drawPlaceHolder = () => {
    try {
        const ctx = Taro.createCanvasContext(canvasId + 'placeholder');
        ctx.clearRect(0, 0, size, size);
        ctx.setFillStyle('rgba(232, 217, 187, 0.8)')
        beads.beads.forEach(({ x, y, radius }: any) => {
          ctx.beginPath() // 开始新路径
          ctx.arc(x, y, radius, 0, 2 * Math.PI)
          ctx.fill()
        })
        ctx.draw();
    } catch (error) {
      console.log("❌ Canvas API 不可用，使用备用方案", error);
    }
  }

  // 当数据更新时重新绘制
  useEffect(() => {
    if (dots.length > 0 && downloadStatus === "success") {
      setTimeout(drawCanvas, 100); // 延迟绘制确保Canvas已准备好
    } else {
      drawPlaceHolder()
    }
  }, [dots, downloadStatus]);
  

  // 处理画布点击事件
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
        src={base}
        style={{
          width: `${backendSize}px`,
          height: `${backendSize}px`,
          position: "absolute",
          zIndex: 100,
        }}
      />
      {/* 下载状态提示 */}
      {downloadStatus !== "success" && (
        <Canvas
          canvasId={canvasId + 'placeholder'}
          style={{ width: `${size}px`, height: `${size}px`, zIndex: 101 }}
        />
      )}
      
      {downloadStatus === "success" && !canvasImage && (
        <Canvas
          canvasId={canvasId}
          className={rotate ? "circle-canvas-rotate" : ""}
          style={{ width: `${size}px`, height: `${size}px`, zIndex: 102 }}
        />
      )}
      {canvasImage && (
        <Image
          src={canvasImage}
          style={{ width: `${size}px`, height: `${size}px`, zIndex: 200 }}
          className={rotate ? "circle-image-rotate" : ""}
        />
      )}
    </View>
  );
};

export default React.memo(CircleRing);