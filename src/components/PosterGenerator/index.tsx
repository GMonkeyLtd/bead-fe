import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { View, Canvas, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import logo from "@/assets/logo/logo.svg";
import {
  CRYSTAL_BROWN_BG_IMAGE_URL,
  CRYSTALS_BG_IMAGE_URL,
  FONT_URL,
  LOGO_IMAGE_URL,
  LOGO_SLOGAN_IMAGE_URL,
  APP_QRCODE_IMAGE_URL,
  POSTER_BG_IMAGE_URL,
} from "@/config";
import "./index.scss";

// 字体配置
const FONT_CONFIG = {
  globalFont: {
    family: "GlobalFont",
    url: FONT_URL,
  },
};

// 图片缓存管理
class ImageCache {
  private static instance: ImageCache;
  private cache: Map<string, { path: string; width: number; height: number }> = new Map();
  private loadingPromises: Map<string, Promise<any>> = new Map();

  static getInstance(): ImageCache {
    if (!ImageCache.instance) {
      ImageCache.instance = new ImageCache();
    }
    return ImageCache.instance;
  }

  async loadImage(src: string): Promise<{ path: string; width: number; height: number }> {
    // 如果已经缓存，直接返回
    if (this.cache.has(src)) {
      return this.cache.get(src)!;
    }

    // 如果正在加载中，返回相同的Promise
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!;
    }

    const promise = new Promise<{ path: string; width: number; height: number }>((resolve, reject) => {
      Taro.getImageInfo({
        src,
        success: (res) => {
          const imageInfo = { path: res.path, width: res.width, height: res.height };
          this.cache.set(src, imageInfo);
          this.loadingPromises.delete(src);
          resolve(imageInfo);
        },
        fail: (err) => {
          this.loadingPromises.delete(src);
          reject(err);
        },
      });
    });

    this.loadingPromises.set(src, promise);
    return promise;
  }

  clear() {
    this.cache.clear();
    this.loadingPromises.clear();
  }

  // 清理特定图片缓存
  clearImage(src: string) {
    this.cache.delete(src);
    this.loadingPromises.delete(src);
  }
}

// 字体加载管理
class FontManager {
  private static instance: FontManager;
  private fontsLoaded: boolean = false;
  private loadingPromise: Promise<void> | null = null;

  static getInstance(): FontManager {
    if (!FontManager.instance) {
      FontManager.instance = new FontManager();
    }
    return FontManager.instance;
  }

  async loadFonts(): Promise<void> {
    if (this.fontsLoaded) {
      return Promise.resolve();
    }

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = this.doLoadFonts();
    return this.loadingPromise;
  }

  private async doLoadFonts(): Promise<void> {
    try {
      if (Taro.loadFontFace) {
        await new Promise<void>((resolve, reject) => {
          Taro.loadFontFace({
            family: FONT_CONFIG.globalFont.family,
            source: `url("${FONT_CONFIG.globalFont.url}")`,
            success: () => {
              this.fontsLoaded = true;
              resolve();
            },
            fail: (err: any) => {
              console.warn("GlobalFont字体加载失败:", err);
              this.fontsLoaded = true; // 即使失败也标记为已加载，使用默认字体
              resolve();
            },
          });
        });
      } else {
        this.fontsLoaded = true;
      }
    } catch (error) {
      console.warn("字体加载过程中出现错误:", error);
      this.fontsLoaded = true;
    }
  }

  isFontsLoaded(): boolean {
    return this.fontsLoaded;
  }
}

interface CrystalItem {
  name: string;
  wuxing: string;
  function: string;
  image_url?: string;
}

interface PosterData {
  title: string;
  description: string;
  mainImage: string;
  crystals: CrystalItem[];
  qrCode?: string;
  designNo?: string; // 添加 designNo 属性
}

interface PosterGeneratorProps {
  data: PosterData;
  onGenerated?: (tempFilePath: string) => void;
  showPoster?: boolean;
}

/** 绘制圆角矩形的参数接口 */
interface DrawRoundedRectParams {
  ctx: any;
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
}

/** 绘制文字的参数接口 */
interface DrawTextParams {
  ctx: any;
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  lineHeight: number;
  maxLine?: number;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  textAlign?: string;
}

/** 设置Canvas文本样式的参数接口 */
interface SetCanvasTextStyleParams {
  ctx: any;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  textAlign?: string;
  textBaseline?: string;
  fontFamily?: string;
}

const PosterGenerator: React.FC<PosterGeneratorProps> = ({
  data,
  onGenerated,
  showPoster = false,
}) => {
  const canvasRef = useRef<any>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [canvasImageUrl, setCanvasImageUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // 获取缓存实例
  const imageCache = useMemo(() => ImageCache.getInstance(), []);
  const fontManager = useMemo(() => FontManager.getInstance(), []);
  
  // 防抖生成海报的引用
  const generateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);

  // 画布尺寸计算
  const canvasConfig = useMemo(() => {
    const windowInfo = Taro.getWindowInfo();
    const dpr = windowInfo.pixelRatio || 2;
    const canvasWidth = 566 * dpr;
    const canvasHeight = 754 * dpr;
    const scaleRatio = (windowInfo.screenWidth - 20) / canvasWidth;
    
    return { dpr, canvasWidth, canvasHeight, scaleRatio };
  }, []);

  // 获取字体名称（带备用字体）
  const getFontFamily = useCallback((isGlobalFont: boolean) => {
    return fontsLoaded && isGlobalFont
      ? `"${FONT_CONFIG.globalFont.family}", "PingFang SC", "Source Han Serif CN", "Microsoft YaHei", serif`
      : '"PingFang SC", "Source Han Serif CN", "Microsoft YaHei", serif';
  }, [fontsLoaded]);

  // 设置canvas文本样式的统一方法
  const setCanvasTextStyle = useCallback((params: SetCanvasTextStyleParams) => {
    const {
      ctx,
      fontSize = 36 * canvasConfig.dpr,
      fontWeight = 300,
      color = "#1F1722",
      textAlign = "left",
      textBaseline = "top",
      fontFamily = getFontFamily(false),
    } = params;

    ctx.fillStyle = color;
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.setTextAlign(textAlign);
    ctx.setTextBaseline(textBaseline);
  }, [canvasConfig.dpr, getFontFamily]);

  // 绘制圆角矩形
  const drawRoundedRect = useCallback((params: DrawRoundedRectParams) => {
    const { ctx, x, y, width, height, radius } = params;

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }, []);

  // 绘制文字（支持换行和字体设置）
  const drawText = useCallback((params: DrawTextParams) => {
    const {
      ctx,
      text,
      x,
      y,
      maxWidth,
      lineHeight,
      maxLine = 2,
      fontSize = 36 * canvasConfig.dpr,
      fontWeight = 300,
      color = "#1F1722",
      textAlign = "left",
    } = params;

    setCanvasTextStyle({
      ctx,
      fontSize,
      fontWeight,
      color,
      textAlign,
      textBaseline: "top",
    });

    const words = text.split("");
    let line = "";
    let currentY = y;
    let lineCount = 0;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i];
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth > maxWidth && line !== "") {
        lineCount++;
        if (lineCount >= maxLine) {
          break;
        }
        ctx.fillText(line, x, currentY);
        line = words[i];
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
    return currentY + lineHeight;
  }, [canvasConfig.dpr, setCanvasTextStyle]);

  // 预加载所有图片
  const preloadImages = useCallback(async () => {
    const imagesToLoad = [
      POSTER_BG_IMAGE_URL,
      CRYSTAL_BROWN_BG_IMAGE_URL,
      LOGO_IMAGE_URL,
      APP_QRCODE_IMAGE_URL,
      data.mainImage,
    ];

    // 添加水晶图片
    data.crystals?.forEach((crystal) => {
      if (crystal.image_url) {
        imagesToLoad.push(crystal.image_url);
      }
    });

    // 并发加载所有图片
    const loadPromises = imagesToLoad.map(url => 
      imageCache.loadImage(url).catch(err => {
        console.warn(`图片加载失败: ${url}`, err);
        return null;
      })
    );

    await Promise.all(loadPromises);
  }, [data.mainImage, data.crystals, imageCache]);

  // 绘制海报
  const drawPoster = useCallback(async () => {
    if (!fontsLoaded || isGenerating || isUnmountedRef.current) {
      return;
    }

    setIsGenerating(true);

    try {
      // 预加载所有图片
      await preloadImages();

      if (isUnmountedRef.current) {
        return;
      }

      const { dpr, canvasWidth, canvasHeight } = canvasConfig;
      const ctx = Taro.createCanvasContext("poster-canvas");

      // 加载背景图片
      const { path: bgImgPath } = await imageCache.loadImage(POSTER_BG_IMAGE_URL);
      ctx.drawImage(bgImgPath, 0, 0, canvasWidth, canvasHeight);

      // crystals bg
      const {
        path: crystalsBgImgPath,
        height: crystalsBgImgHeight,
        width: crystalsBgImgWidth,
      } = await imageCache.loadImage(CRYSTAL_BROWN_BG_IMAGE_URL);
      ctx.drawImage(
        crystalsBgImgPath,
        0,
        0,
        crystalsBgImgWidth,
        crystalsBgImgHeight * 0.5,
        0,
        canvasHeight - crystalsBgImgHeight * dpr * 0.5,
        canvasWidth,
        crystalsBgImgHeight * dpr * 0.5
      );

      // 绘制卡片白色背景
      ctx.save();
      ctx.setFillStyle("#ffffff");
      drawRoundedRect({
        ctx,
        x: 98 * dpr,
        y: 38 * dpr,
        width: 370 * dpr,
        height: 600 * dpr,
        radius: 20 * dpr,
      });
      ctx.fill();

      // 卡片上半部份图片
      const { path: mainImgPath, width: mainImgWidth, height: mainImgHeight } = await imageCache.loadImage(
        data.mainImage
      );
      drawRoundedRect({
        ctx,
        x: 98 * dpr,
        y: 38 * dpr,
        width: 370 * dpr,
        height: 612 * dpr,
        radius: 20 * dpr,
      });
      ctx.clip();
      ctx.drawImage(
        mainImgPath,
        0,
        80,
        mainImgWidth,
        mainImgHeight - 160,
        98 * dpr,
        38 * dpr,
        370 * dpr,
        300 * dpr
      );
      ctx.restore();

      // 设计编号
      if (data.designNo) {
        drawText({
          ctx,
          text: `设计编号：${data.designNo}`,
          x: 125 * dpr,
          y: 58 * dpr,
          maxWidth: 300 * dpr,
          lineHeight: 12 * dpr,
          fontSize: 12 * dpr,
          fontWeight: 300,
          color: "rgba(0, 0, 0, 0.6)",
        });
      }

      // 绘制渐变边框
      const gradient = ctx.createLinearGradient(0, 370, 0, 0);
      gradient.addColorStop(0, "rgba(174, 171, 168, 0.21)");
      gradient.addColorStop(0.75, "rgba(255, 255, 255, 0.72)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0.32)");

      ctx.strokeStyle = gradient as any;
      ctx.lineWidth = 2 * dpr;
      drawRoundedRect({
        ctx,
        x: 98 * dpr,
        y: 38 * dpr,
        width: 370 * dpr,
        height: 600 * dpr,
        radius: 20 * dpr,
      });
      ctx.stroke();

      // 绘制标题
      setCanvasTextStyle({
        ctx,
        fontSize: 40 * dpr,
        fontWeight: 300,
        color: "#1F1722",
        textAlign: "left",
        textBaseline: "top",
        fontFamily: getFontFamily(true),
      });
      ctx.fillText(data.title, 125 * dpr, 370 * dpr);

      // 绘制描述文字
      if (data.description) {
        drawText({
          ctx,
          text: data.description,
          x: 125 * dpr,
          y: 426 * dpr,
          maxWidth: 320 * dpr,
          lineHeight: 20 * dpr,
          fontSize: 14 * dpr,
          fontWeight: 300,
        });
      }

      // 绘制水晶信息
      let crystalX = 128 * dpr;
      let crystalY = 516 * dpr;
      
      // 并发加载水晶图片
      const crystalImages = await Promise.all(
        data.crystals?.slice(0, 2).map(async (crystal) => {
          if (crystal.image_url) {
            try {
              const { path } = await imageCache.loadImage(crystal.image_url);
              return path;
            } catch (error) {
              console.warn('加载珠子图出错:', error);
              return null;
            }
          }
          return null;
        }) || []
      );

      // 绘制水晶信息
      crystalImages.forEach((imagePath, index) => {
        if (imagePath && data.crystals[index]) {
          const crystal = data.crystals[index];
          
          // 绘制水晶圆形图标
          ctx.drawImage(imagePath, crystalX, crystalY, 16 * dpr, 16 * dpr);

          // 绘制水晶名称
          drawText({
            ctx,
            text: `${crystal.name}「${crystal.wuxing}」`,
            x: crystalX + 28 * dpr,
            y: crystalY,
            maxWidth: 300 * dpr,
            lineHeight: 16 * dpr,
            fontSize: 12 * dpr,
            fontWeight: 300,
            textAlign: "left",
          });

          // 绘制效果
          drawText({
            ctx,
            text: crystal.function,
            x: crystalX + 28 * dpr,
            y: crystalY + 18 * dpr,
            maxWidth: 300 * dpr,
            lineHeight: 12 * dpr,
            fontSize: 12 * dpr,
            fontWeight: 300,
            textAlign: "left",
          });

          crystalY += 40 * dpr;
        }
      });

      // 绘制右下角二维码
      if (data.qrCode) {
        const { path: qrImgPath } = await imageCache.loadImage(APP_QRCODE_IMAGE_URL);
        ctx.drawImage(qrImgPath, 362 * dpr, 510 * dpr, 68 * dpr, 68 * dpr);
      }

      // 绘制"开启专属定制"文字
      setCanvasTextStyle({
        ctx,
        fontSize: 12 * dpr,
        fontWeight: 300,
        textAlign: "left",
      });
      ctx.fillText("开启专属定制", 360 * dpr, 590 * dpr);

      // 绘制logo和slogan
      const { path: logoSloganImgPath } = await imageCache.loadImage(LOGO_IMAGE_URL);
      ctx.drawImage(logoSloganImgPath, 236 * dpr, 674 * dpr, 94 * dpr, 44 * dpr);

      // 绘制并导出
      ctx.draw(false, () => {
        if (isUnmountedRef.current) {
          return;
        }

        // 导出图片
        Taro.canvasToTempFilePath({
          canvasId: "poster-canvas",
          width: canvasWidth,
          height: canvasHeight,
          success: (res) => {
            if (!isUnmountedRef.current) {
              setCanvasImageUrl(res.tempFilePath);
              onGenerated?.(res.tempFilePath);
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
    fontsLoaded,
    isGenerating,
    canvasConfig,
    data,
    preloadImages,
    drawRoundedRect,
    drawText,
    setCanvasTextStyle,
    getFontFamily,
    onGenerated,
    imageCache,
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

  // 初始化字体加载
  useEffect(() => {
    let isMounted = true;
    
    fontManager.loadFonts().then(() => {
      if (isMounted && !isUnmountedRef.current) {
        setFontsLoaded(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [fontManager]);

  // 当字体加载完成且数据可用时开始绘制
  useEffect(() => {
    if (fontsLoaded && data?.title && !isUnmountedRef.current) {
      debouncedDrawPoster();
    }
  }, [fontsLoaded, data?.title, data?.mainImage, data?.crystals, debouncedDrawPoster]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      cleanup();
    };
  }, [cleanup]);

  return (
    <View style={{ position: "relative" }}>
      <Canvas
        id="poster-canvas"
        canvasId="poster-canvas"
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
      {showPoster && canvasImageUrl && (
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

export default PosterGenerator;
