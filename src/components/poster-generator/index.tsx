import React, { useRef, useEffect, useState } from "react";
import { View, Canvas, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./index.scss";

interface CrystalItem {
  name: string;
  element: string;
  effect: string;
  color: string;
  image?: string;
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
}

const PosterGenerator: React.FC<PosterGeneratorProps> = ({
  data,
  onGenerated,
}) => {
  const canvasRef = useRef<any>(null);
  const dpr = Taro.getSystemInfoSync().pixelRatio;
  const canvasWidth = 370;
  const canvasHeight = 612;
  console.log(dpr, "dpr");

  // 绘制圆角矩形
  const drawRoundedRect = (
    ctx: any,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
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

  // 绘制文字（支持换行）
  const drawText = (
    ctx: any,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) => {
    const words = text.split("");
    let line = "";
    let currentY = y;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i];
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth > maxWidth && line !== "") {
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
  const loadImage = (src: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      Taro.getImageInfo({
        src,
        success: (res) => {
          resolve(res.path);
        },
        fail: reject,
      });
    });
  };

  // 绘制海报
  const drawPoster = async () => {
    try {
      const ctx = Taro.createCanvasContext("poster-canvas");

      // 背景色
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvasWidth * dpr, canvasHeight * dpr);

      // 绘制主图
      const mainImgPath = await loadImage(data.mainImage);
      drawRoundedRect(ctx, 0, 0, 370, 370, 10);
      ctx.clip();
      ctx.drawImage(mainImgPath, 0, 0, 370, 370);
      ctx.restore();

      // 绘制渐变边框
      const gradient = ctx.createLinearGradient(0, 370, 0, 0);
      gradient.addColorStop(0, "rgba(174, 171, 168, 0.21)");
      gradient.addColorStop(0.75, "rgba(255, 255, 255, 0.72)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0.32)");

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      drawRoundedRect(ctx, 1, 1, 368, 368, 10);
      ctx.stroke();

      // 绘制标题
      // ctx.fillStyle = "rgba(31, 23, 34, 0.9)";
      // ctx.font = "40px HuXiaoBo-LangManSong, serif";
      // ctx.textAlign = "center";
      // ctx.fillText(data.title, 185, 440);
      console.log(data.title, "data.title");
      ctx.font = 'HuXiaoBo-LangManSong'
      ctx.setFontSize(20)
      // ctx.fillText('Hello', 20, 20)
      ctx.fillText(data.title, 100, 100)
      // ctx.draw()  

      // 绘制描述文字
      ctx.fillStyle = "rgba(31, 23, 34, 0.6)";
      ctx.font = "13px Source Han Serif CN, serif";
      ctx.textAlign = "left";
      drawText(ctx, data.description, 37, 470, 297, 18);

      // 绘制水晶信息卡片背景
      ctx.fillStyle = "#FBF7F4";
      drawRoundedRect(ctx, 37, 520, 297, 60, 8);
      ctx.fill();

      // 绘制水晶信息
      let crystalX = 50;
      data.crystals.forEach(async (crystal, index) => {
        // 绘制水晶圆形图标
        ctx.fillStyle = crystal.color || "#D9D9D9";
        ctx.beginPath();
        ctx.arc(crystalX + 9, 540, 7.5, 0, 2 * Math.PI);
        ctx.fill();

        // 绘制水晶名称
        ctx.fillStyle = "rgba(40, 29, 3, 0.9)";
        ctx.font = "13px Source Han Serif CN, serif";
        ctx.textAlign = "center";
        ctx.fillText(crystal.name, crystalX + 36, 545);

        // 绘制效果
        ctx.fillStyle = "rgba(31, 23, 34, 0.6)";
        ctx.font = "11px PingFang SC, sans-serif";
        ctx.fillText(crystal.effect, crystalX + 36, 560);

        crystalX += 95;
      });

      // 绘制右下角二维码/开启定制区域
      if (data.qrCode) {
        const qrImgPath = await loadImage(data.qrCode);
        ctx.drawImage(qrImgPath, 263, 492, 62, 62);
      }

      // 绘制"开启专属定制"文字
      ctx.fillStyle = "rgba(31, 23, 34, 0.9)";
      ctx.font = "11px Source Han Serif CN, serif";
      ctx.textAlign = "center";
      ctx.fillText("开启专属定制", 294, 570);

      ctx.draw();
      // 导出图片
      // Taro.canvasToTempFilePath({
      //   canvasId: "poster-canvas",
      //   success: (res) => {
      //     onGenerated?.(res.tempFilePath);
      //   },
      //   fail: (err) => {
      //     console.error("生成海报失败:", err);
      //   },
      // });
    } catch (error) {
      console.error("绘制海报失败:", error);
    }
  };

  useEffect(() => {
    console.log(data, "canvasReady");
    if (data) {
      console.log(data, "drawPoster");
      drawPoster();
    }
  }, [data]);

  return (
    // <View className="poster-generator">
      <Canvas
        id="poster-canvas"
        canvasId="poster-canvas"
        style={{ position: "absolute", top: 150, left: 20, height: canvasHeight, width: canvasWidth }}
        // className="poster-canvas"
        height={`${canvasHeight * dpr}px`}
        width={`${canvasWidth * dpr}px`}
      />
    // </View>
  );
};

export default PosterGenerator;
