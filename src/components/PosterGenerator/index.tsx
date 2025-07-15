import React, { useRef, useEffect, useState } from "react";
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
}

interface PosterGeneratorProps {
  data: PosterData;
  onGenerated?: (tempFilePath: string) => void;
  showPoster?: boolean;
}

/** 绘制圆角矩形的参数接口 */
interface DrawRoundedRectParams {
  ctx: any; // Canvas上下文
  x: number; // 矩形左上角X坐标
  y: number; // 矩形左上角Y坐标
  width: number; // 矩形宽度
  height: number; // 矩形高度
  radius: number; // 圆角半径
}

/** 绘制文字的参数接口 */
interface DrawTextParams {
  ctx: any; // Canvas上下文
  text: string; // 要绘制的文字
  x: number; // 文字起始X坐标
  y: number; // 文字起始Y坐标
  maxWidth: number; // 最大宽度（超出自动换行）
  lineHeight: number; // 行高
  maxLine?: number; // 最大行数，默认为2
  fontSize?: number; // 字体大小，默认为36
  fontWeight?: number; // 字体粗细，默认为300
  color?: string; // 字体颜色，默认为"#1F1722"
  textAlign?: string; // 文字对齐方式，默认为"left"
}

/** 设置Canvas文本样式的参数接口 */
interface SetCanvasTextStyleParams {
  ctx: any; // Canvas上下文
  fontSize?: number; // 字体大小，默认为36
  fontWeight?: number; // 字体粗细，默认为300
  color?: string; // 字体颜色，默认为"#1F1722"
  textAlign?: string; // 文字对齐方式，默认为"left"
  textBaseline?: string; // 文字基线，默认为"top"
  fontFamily?: string; // 字体家族，默认为"GlobalFont"
}

const PosterGenerator: React.FC<PosterGeneratorProps> = ({
  data,
  onGenerated,
  showPoster = false,
}) => {
  const canvasRef = useRef<any>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [canvasImageUrl, setCanvasImageUrl] = useState("");

  // 画布尺寸
  const windowInfo = Taro.getWindowInfo();
  const dpr = windowInfo.pixelRatio || 2; // 使用默认值2作为备用
  const canvasWidth = 566 * dpr;
  const canvasHeight = 754 * dpr;

  // 计算缩放比例
  const scaleRatio = (windowInfo.screenWidth - 20) / canvasWidth;

  // 预加载字体
  const loadFonts = async () => {
    try {
      // 检查Taro版本和字体加载能力
      if (Taro.loadFontFace) {
        console.log("开始加载GlobalFont字体...");

        // 使用Promise包装字体加载
        await new Promise<void>((resolve, reject) => {
          Taro.loadFontFace({
            family: FONT_CONFIG.globalFont.family,
            source: `url("${FONT_CONFIG.globalFont.url}")`,
            success: () => {
              console.log("GlobalFont字体加载成功");
              resolve();
            },
            fail: (err: any) => {
              console.warn("GlobalFont字体加载失败:", err);
              resolve(); // 即使失败也继续，使用默认字体
            },
          });
        });
      } else {
        console.warn("当前环境不支持loadFontFace，将使用默认字体");
      }

      setFontsLoaded(true);
    } catch (error) {
      console.warn("字体加载过程中出现错误:", error);
      setFontsLoaded(true); // 即使失败也继续，使用默认字体
    }
  };

  // 获取字体名称（带备用字体）
  const getFontFamily = (isGlobalFont: boolean) => {
    // 优先使用已加载的GlobalFont，然后回退到系统字体
    const fontFamily =
      fontsLoaded && isGlobalFont
        ? `"${FONT_CONFIG.globalFont.family}", "PingFang SC", "Source Han Serif CN", "Microsoft YaHei", serif`
        : '"PingFang SC", "Source Han Serif CN", "Microsoft YaHei", serif';

    return fontFamily;
  };

  // 设置canvas文本样式的统一方法
  const setCanvasTextStyle = (params: SetCanvasTextStyleParams) => {
    const {
      ctx,
      fontSize = 36 * dpr,
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
  };

  // 绘制圆角矩形
  const drawRoundedRect = (params: DrawRoundedRectParams) => {
    let { ctx, x, y, width, height, radius } = params;

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
  };

  // 绘制文字（支持换行和字体设置）
  const drawText = (params: DrawTextParams) => {
    const {
      ctx,
      text,
      x,
      y,
      maxWidth,
      lineHeight,
      maxLine = 2,
      fontSize = 36 * dpr,
      fontWeight = 300,
      color = "#1F1722",
      textAlign = "left",
    } = params;

    // 设置字体样式
    setCanvasTextStyle({
      ctx,
      fontSize: fontSize,
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
          // ctx.fillText(line + '...', x, currentY);
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
  };

  // 加载图片
  const loadImage = (
    src: string
  ): Promise<{ path: string; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      Taro.getImageInfo({
        src,
        success: (res) => {
          resolve({ path: res.path, width: res.width, height: res.height });
        },
        fail: reject,
      });
    });
  };

  // 绘制海报
  const drawPoster = async () => {
    if (!fontsLoaded) {
      console.log("字体或画布未准备就绪，等待中...", { fontsLoaded });
      return;
    }

    try {
      const ctx = Taro.createCanvasContext("poster-canvas");
      // ctx.antialias = 'smooth';

      // 设置画布缩放
      // ctx.scale(scaleRatio, scaleRatio);
      // ctx.scale(2, 2);
      // ctx.scale(dpr, dpr);

      // 加载背景图片
      const { path: bgImgPath } = await loadImage(POSTER_BG_IMAGE_URL);
      ctx.drawImage(bgImgPath, 0, 0, canvasWidth, canvasHeight);

      // crystals bg
      const {
        path: crystalsBgImgPath,
        height: crystalsBgImgHeight,
        width: crystalsBgImgWidth,
      } = await loadImage(CRYSTAL_BROWN_BG_IMAGE_URL);
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
      const { path: mainImgPath, width: mainImgWidth, height: mainImgHeight } = await loadImage(
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
        0,
        mainImgWidth,
        mainImgHeight,
        98 * dpr,
        38 * dpr,
        370 * dpr,
        370 * dpr
      );
      ctx.restore();

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

      // 绘制标题 - 使用统一的样式设置方法

      setCanvasTextStyle({
        ctx,
        fontSize: 40 * dpr,
        fontWeight: 300,
        color: "#1F1722",
        textAlign: "left",
        textBaseline: "top",
        fontFamily: getFontFamily(true),
      });
      ctx.fillText(data.title, 135 * dpr, 360 * dpr);

      // 绘制描述文字（如果需要）
      if (data.description) {
        drawText({
          ctx,
          text: data.description,
          x: 135 * dpr,
          y: 446 * dpr,
          maxWidth: 300 * dpr,
          lineHeight: 20 * dpr,
          fontSize: 14 * dpr,
          fontWeight: 300,
        });
      }

      // 绘制水晶信息卡片背景
      // ctx.fillStyle = "#FBF7F4";
      // drawRoundedRect(ctx, 37, 520, 297, 60, 8);
      // ctx.fill();

      // 绘制水晶信息
      let crystalX = 138 * dpr,
        crystalY = 516 * dpr;
      let crystalImgPath: any[] = [];
      if (data.crystals?.[0]) {
        const res = await Taro.downloadFile({
          url: data.crystals[0].image_url || "",
        });
        console.log(res, 'res')
        crystalImgPath[0] = res.tempFilePath;
      }
      if (data.crystals?.[1]) {
        const res = await Taro.downloadFile({
          url: data.crystals[1].image_url || "",
        });
        crystalImgPath[1] = res.tempFilePath;
      }
      crystalImgPath.forEach(async (_, index) => {
        // 绘制水晶圆形图标
        crystalImgPath[index]?.path &&
          ctx.drawImage(
            crystalImgPath[index]?.path,
            crystalX,
            crystalY,
            16 * dpr,
            16 * dpr
          );

        // 绘制水晶名称
        drawText({
          ctx,
          text: `${data.crystals[index].name}「${data.crystals[index].wuxing}」`,
          x: crystalX + 28 * dpr,
          y: crystalY,
          maxWidth: 300 * dpr,
          lineHeight: 16 * dpr,
          fontSize: 12 * dpr,
          fontWeight: 300,
          textAlign: "left",
        });

        //绘制效果
        drawText({
          ctx,
          text: data.crystals[index].function,
          x: crystalX + 28 * dpr,
          y: crystalY + 18 * dpr,
          maxWidth: 300 * dpr,
          lineHeight: 12 * dpr,
          fontSize: 12 * dpr,
          fontWeight: 300,
          textAlign: "left",
        });

        crystalY += 40 * dpr;
      });

      // 绘制右下角二维码/开启定制区域
      if (data.qrCode) {
        const { path: qrImgPath } = await loadImage(APP_QRCODE_IMAGE_URL);
        ctx.drawImage(qrImgPath, 362 * dpr, 510 * dpr, 68 * dpr, 68 * dpr);
      }

      // 绘制"开启专属定制"文字
      setCanvasTextStyle({
        ctx,
        fontSize: 12 * dpr,
        fontWeight: 300,
        textAlign: "left",
      });
      ctx.fillText("开启专属定制", 360 * dpr, 580 * dpr);

      // 绘制logo和slogan
      const { path: logoSloganImgPath } = await loadImage(
        LOGO_IMAGE_URL
      );
      ctx.drawImage(
        logoSloganImgPath,
        236 * dpr,
        674 * dpr,
        94 * dpr,
        44 * dpr
      );

      ctx.draw();
      // 导出图片
      Taro.canvasToTempFilePath({
        canvasId: "poster-canvas",
        width: canvasWidth,
        height: canvasHeight,
        success: (res) => {
          console.log("绘制海报成功")
          setCanvasImageUrl(res.tempFilePath);
          onGenerated?.(res.tempFilePath);
        },
        fail: (err) => {
          console.error("生成海报失败:", err);
        },
      });
    } catch (error) {
      console.error("绘制海报失败:", error);
    }
  };

  // 初始化字体加载
  useEffect(() => {
    loadFonts();
  }, []);

  // 当字体加载完成且数据可用时开始绘制
  useEffect(() => {
    console.log("Canvas绘制状态检查:", {
      fontsLoaded,
      hasTitle: !!data?.title,
    });

    if (fontsLoaded && data?.title) {
      console.log("开始绘制海报:", {
        title: data.title,
        hasMainImage: !!data.mainImage,
      });

      drawPoster();
    }
  }, [fontsLoaded, data]);

  return (
    <View style={{ position: "relative" }}>
      <Canvas
        id="poster-canvas"
        canvasId="poster-canvas"
        style={{
          height: canvasHeight,
          width: canvasWidth,
          position: "absolute",
          top: `-999999px`,
          left: `-999999px`,
          zIndex: -100,
          transition: "display 0.3s ease-in-out",
        }}
        height={`${canvasHeight}px`}
        width={`${canvasWidth}px`}
        onTouchStart={() => {
          Taro.previewImage({
            urls: [canvasImageUrl],
          });
        }}
      />
      {showPoster && (
        <Image
          src={canvasImageUrl}
          style={{
            height: canvasHeight * scaleRatio,
            width: canvasWidth * scaleRatio,
          }}
          mode="widthFix"
          onClick={() => {
            // 保存图片到相册
            Taro.saveImageToPhotosAlbum({
              filePath: canvasImageUrl,
              success: () => {
                Taro.showToast({ title: "保存成功" });
              },
            });
          }}
        />
      )}
    </View>
  );
};

export default PosterGenerator;
