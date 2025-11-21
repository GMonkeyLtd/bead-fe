import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { View, Canvas, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import {
  RESULT_IMAGE_SLOGAN_IMAGE_URL,
  RESULT_IMAGE_TEXTURE_IMAGE_URL,
  RESULT_IMAGE_LOGO_IMAGE_URL,
} from "@/config";
import { ImageCacheManager } from "@/utils/image-cache";


interface ProductImageData {
  bgImage: string; // 添加 designNo 属性
  braceletImage: string;
}

interface ProductImageGeneratorProps {
  data: ProductImageData;
  onGenerated?: (tempFilePath: string) => void;
  showProductImage?: boolean;
  canvasId?: string; // 添加可自定义的 Canvas ID
  autoDestroy?: boolean; // 生成完成后是否自动销毁
}


const ProductImageGenerator: React.FC<ProductImageGeneratorProps> = ({
  data,
  onGenerated,
  showProductImage = false,
  canvasId,
  autoDestroy = true,
}) => {
  const [canvasImageUrl, setCanvasImageUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false); // 跟踪是否已完成

  // 防抖生成海报的引用
  const generateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);
  
  // 生成唯一的 Canvas ID
  const uniqueCanvasId = useMemo(() => {
    return canvasId || `product-image-canvas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, [canvasId]);

  // 画布尺寸计算
  const canvasConfig = useMemo(() => {
    const windowInfo = Taro.getWindowInfo();
    const dpr = windowInfo.pixelRatio || 2;
    const canvasWidth = 345 * dpr;
    const canvasHeight = 345 * dpr;
    const scaleRatio = (windowInfo.screenWidth - 20) / canvasWidth;

    return { dpr, canvasWidth, canvasHeight, scaleRatio };
  }, []);

  const loadImage = async (src: string): Promise<{ path: string; width: number; height: number }> => {
    const promise = new Promise<{ path: string; width: number; height: number }>((resolve, reject) => {
      Taro.getImageInfo({
        src,
        success: (res) => {
          const imageInfo = { path: res.path, width: res.width, height: res.height };
          resolve(imageInfo);
        },
        fail: (err) => {
          reject(err);
        },
      });
    });
    return promise;
  }

  // 绘制海报
  const drawPoster = useCallback(async () => {
    if (isGenerating || isUnmountedRef.current) {
      return;
    }

    setIsGenerating(true);

    try {
      if (isUnmountedRef.current) {
        return;
      }

      const { dpr, canvasWidth, canvasHeight } = canvasConfig;

      const ctx = Taro.createCanvasContext(uniqueCanvasId);

      // 背景图
      const { path: bgImgPath } = await loadImage(RESULT_IMAGE_TEXTURE_IMAGE_URL);

      ctx.drawImage(
        bgImgPath,
        0, 0, canvasWidth, canvasHeight
      );
      const processedPaths = await ImageCacheManager.processImagePaths([data.bgImage, data.braceletImage]);
      console.log('processedPaths', processedPaths);
      // 绘制侧边图片 
      // const { path: sideImgPath, width: sideImgWidth, height: sideImgHeight } = await loadImage(data.bgImage);
      // const bgImageBase64 = await imageToBase64(data.bgImage, true, false);  
      // console.log('bgImageBase64', bgImageBase64);
      // const sideImage = processedPaths.get(data.bgImage);
      // if (!sideImage) {
      //   return;
      // }

      // 裁剪逻辑：从原图中心位置裁剪出115px宽度的部分
      // const cropWidth = 342; // 固定裁剪宽度115px
      // const cropHeight = 1024; // 裁剪高度 = 原图高度
      // const cropX = Math.max(0, (746 - cropWidth) / 2); // 居中裁剪，确保不超出边界
      // const cropY = 0;

      // 计算缩放比例：选择宽度和高度缩放比例中较小的那个，确保图片完全显示在Canvas内
      // const scaleRatioWidth = canvasWidth / cropWidth;
      // const scaleRatioHeight = canvasHeight / cropHeight;
      // const scaleRatio = Math.min(scaleRatioWidth, scaleRatioHeight);

      // const targetWidth = cropWidth * scaleRatio;
      // const targetHeight = cropHeight * scaleRatio;

      // ctx.drawImage(
      //   sideImage,
      //   cropX, cropY, cropWidth, cropHeight, // 源图片裁剪区域
      //   0, 0, targetWidth, targetHeight // 目标Canvas区域（居中）
      // );
      // ctx.restore();

      
      // 绘制手链图片
      const braceletImage = processedPaths.get(data.braceletImage);
      if (!braceletImage) {
        return;
      }
      const braceletImageSize = 345;
      // const braceletImageSize = 160;
      // const imgBase64 = await imageToBase64(data.braceletImage, true, false);
      const heightCenter = (canvasHeight - braceletImageSize * dpr) / 2;
      const widthCenter = (canvasWidth - braceletImageSize * dpr) / 2;

      ctx.drawImage(
        braceletImage,
        widthCenter, 
        heightCenter,
        braceletImageSize * dpr,
        braceletImageSize * dpr
      );
      ctx.restore();

      // 绘制logo
      const { path: logoImgPath } = await loadImage(RESULT_IMAGE_LOGO_IMAGE_URL);
      const logoHeight = 36;
      const logoWidth = 22;
      ctx.drawImage(
        logoImgPath,
        (canvasHeight - logoWidth * dpr) / 2,
        (canvasHeight - logoHeight * dpr) / 2,
        logoWidth * dpr,
        logoHeight * dpr
      );

      // 绘制slogan
      const { path: sloganImgPath } = await loadImage(RESULT_IMAGE_SLOGAN_IMAGE_URL);
      const sloganHeight = 11;
      const sloganWidth = 86;
      ctx.drawImage(
        sloganImgPath,
        canvasWidth / 2,
        heightCenter + braceletImageSize * dpr + 56 * dpr,
        sloganWidth * dpr,
        sloganHeight * dpr
      );

      // 绘制并导出
      ctx.draw(false, () => {
        if (isUnmountedRef.current) {
          return;
        }
        console.log('canvasWidth', canvasWidth);
        console.log('canvasHeight', canvasHeight);
        // 导出图片
        Taro.canvasToTempFilePath({
          canvasId: uniqueCanvasId,
          width: canvasWidth,
          height: canvasHeight,
            success: (res) => {
              if (!isUnmountedRef.current) {
                console.log("res", res);
                setCanvasImageUrl(res.tempFilePath);
                setIsCompleted(true); // 标记为已完成
                onGenerated?.(res.tempFilePath);
                
                // 如果启用自动销毁，延迟清理资源
                if (autoDestroy) {
                  setTimeout(() => {
                    if (!isUnmountedRef.current) {
                      cleanup();
                    }
                  }, 1000); // 1秒后清理，给上传时间
                }
              }
            },
          fail: (err) => {
            console.error("生成海报失败:", err);
          },
          complete: () => {
            setIsGenerating(false);
          },
        });
      });

    } catch (error) {
      console.error("绘制海报失败:", error);
      setIsGenerating(false);
    }
  }, [
    isGenerating,
    canvasConfig,
    data,
    onGenerated,
  ]);

  // 防抖生成海报
  const debouncedDrawPoster = useCallback(() => {
    if (generateTimeoutRef.current) {
      clearTimeout(generateTimeoutRef.current);
    }

    generateTimeoutRef.current = setTimeout(() => {
      drawPoster();
    }, 300);
  }, [drawPoster]);

  // 清理内存
  const cleanup = useCallback(() => {
    if (generateTimeoutRef.current) {
      clearTimeout(generateTimeoutRef.current);
      generateTimeoutRef.current = null;
    }

    // 清理画布图片URL
    if (canvasImageUrl) {
      setCanvasImageUrl("");
    }

    setIsGenerating(false);
  }, [canvasImageUrl]);


  // 当字体加载完成且数据可用时开始绘制
  useEffect(() => {
    if (data?.braceletImage && !isUnmountedRef.current) {
      debouncedDrawPoster();
    }
  }, [data?.bgImage, data?.braceletImage, debouncedDrawPoster]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      cleanup();
    };
  }, [cleanup]);

  console.log('canvasImageUrl', canvasImageUrl, showProductImage);

  // 如果已完成且启用自动销毁，不渲染任何内容
  if (isCompleted && autoDestroy) {
    return null;
  }

  return (
    <View style={{ position: "relative" }}>
      <Canvas
        id={uniqueCanvasId}
        canvasId={uniqueCanvasId}
        style={{
          height: canvasConfig.canvasHeight,
          width: canvasConfig.canvasWidth,
          position: "absolute",
          top: `-999999px`,
          left: `-999999px`,
          zIndex: -100,
          transition: "display 0.3s ease-in-out",
        }}
        height={`${canvasConfig.canvasHeight}px`}
        width={`${canvasConfig.canvasWidth}px`}
        onTouchStart={() => {
          if (canvasImageUrl) {
            Taro.previewImage({
              urls: [canvasImageUrl],
            });
          }
        }}
      />
      {showProductImage && canvasImageUrl && (
        <Image
          src={canvasImageUrl}
          style={{
            height: canvasConfig.canvasHeight * canvasConfig.scaleRatio,
            width: canvasConfig.canvasWidth * canvasConfig.scaleRatio,
          }}
          mode="widthFix"
          onClick={() => {
            Taro.saveImageToPhotosAlbum({
              filePath: canvasImageUrl,
              success: () => {
                Taro.showToast({ title: "保存成功" });
              },
              fail: () => {
                Taro.showToast({ title: "保存失败", icon: "error" });
              },
            });
          }}
        />
      )}
    </View>
  );
};

export default ProductImageGenerator;
