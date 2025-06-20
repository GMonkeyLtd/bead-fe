import React, { useEffect, useState } from "react";
import { Canvas, Button, View, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { ImageCacheManager } from "@/utils/image-cache";

interface Bead {
  image: string;
  radius: number;
  id?: string | number;
}

interface Position {
  x: number;
  y: number;
  angle: number;
  radius: number;
  imageData: string;
  id?: string | number;
}

const WUXING_MAP = ["金", "火", "土", "木", "水"];
/**
 * CustomCircleRing 组件
 * @param beads 珠子数组，每个珠子包含 image（图片地址）和 radius（半径，px）
 * @param canvasId 画布ID
 * @param size 画布尺寸，默认400px
 * @param spacing 珠子间距，默认0px
 * @param onBeadClick 珠子点击回调函数
 */
const CustomDesignRing = ({
  beads = [],
  canvasId = "custom-circle-canvas",
  size = 300,
  spacing = 0,
  beadTypeMap = {},
}: {
  beads: Bead[];
  canvasId?: string;
  size?: number;
  spacing?: number;
  beadTypeMap?: any;
}) => {
  const dpr = Taro.getSystemInfoSync().pixelRatio;
  const [dots, setDots] = useState<any[]>([]);
  const [selectedBeadIndex, setSelectedBeadIndex] = useState<number>(-1);
  const [beadStatus, setBeadStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [selectedBeadType, setSelectedBeadType] = useState<string>("");

  useEffect(() => {
    setSelectedBeadType(Object.keys(beadTypeMap)[0]);
  }, [beadTypeMap]);

  const processImages = async () => {
    const processedPaths = await ImageCacheManager.processImagePaths(
      beads.map((item: Bead) => item.image)
    );

    const beadsWithImageData = beads.map((bead: Bead) => {
      return {
        ...bead,
        imageData: processedPaths.get(bead.image) || bead.image,
      };
    });

    return beadsWithImageData;
  };

  const computeBeadPositions = (beads: Bead[], spacing: number) => {
    const ringRadius = calcRingRadius(beads, spacing);
    const calculatedPositions = calcPositions(beads, spacing, ringRadius);
    return calculatedPositions;
  };

  const processBeads = async () => {
    setBeadStatus("processing");
    const beadsWithImageData = await processImages();
    const positions = computeBeadPositions(beadsWithImageData, spacing);
    setDots(positions);
    setBeadStatus("success");
  };

  useEffect(() => {
    if (!beads || beads.length === 0) {
      setBeadStatus("success");
      return;
    }

    try {
      processBeads();
    } catch (error) {
      console.error("❌ 珠子处理过程出错:", error);
      setBeadStatus("error");
    }
  }, [JSON.stringify(beads)]);

  // 动态计算圆环半径
  function calcRingRadius(beads: any[], spacing: number) {
    if (!beads.length) return 0;
    const totalArcLen = beads.reduce(
      (sum, b) => sum + 2 * b.radius + spacing,
      0
    );
    return totalArcLen / (2 * Math.PI);
  }

  // 计算每个珠子的圆心坐标
  function calcPositions(
    dots: any[],
    spacing: number,
    ringRadius: number
  ): Position[] {
    let currentAngle = 0;
    const positions: Position[] = [];
    // 圆心坐标
    const center = size / 2;

    for (let i = 0; i < dots.length; i++) {
      const j = (i + 1) % dots.length;
      const r1 = dots[i].radius;
      const r2 = dots[j].radius;
      const L = r1 + r2 + spacing;
      // 计算相邻小圆的中心角 theta_ij
      const theta = 2 * Math.asin(L / (2 * ringRadius));

      // 记录当前小圆的位置
      positions.push({
        ...dots[i],
        x: center + ringRadius * Math.cos(currentAngle),
        y: center + ringRadius * Math.sin(currentAngle),
        angle: currentAngle,
      });

      // 更新角度
      currentAngle += theta;
    }
    return positions;
  }

  const drawCanvas = async (dotList: any[], selectedBeadIndex: number) => {
    if (!dotList.length) return;
    const ctx = Taro.createCanvasContext(canvasId);
    ctx.clearRect(0, 0, size, size);
    dotList.forEach((item, index) => {
      if (index === selectedBeadIndex) {
        return;
      }
      const { x, y, radius, imageData } = item;
      ctx.drawImage(imageData, x - radius, y - radius, radius * 2, radius * 2);
      // 如果是选中的珠子，绘制红色边框
    });
    if (selectedBeadIndex !== -1) {
      const { x, y, radius, imageData } = dotList[selectedBeadIndex];
      ctx.drawImage(imageData, x - radius, y - radius, radius * 2, radius * 2);
      ctx.beginPath();
      ctx.arc(x, y, radius + 2, 0, 2 * Math.PI);
      ctx.setStrokeStyle("#ff0000");
      ctx.setLineWidth(4);
      ctx.stroke();
    }
    ctx.draw();
  };

  // 处理Canvas点击事件
  const handleCanvasClick = (e: any) => {
    if (!dots.length) return;

    // 获取Canvas元素的位置信息
    const query = Taro.createSelectorQuery();
    query.select(`#${canvasId}`).boundingClientRect((rectResult) => {
      const rect = Array.isArray(rectResult) ? rectResult[0] : rectResult;
      if (!rect) return;

      // 获取点击坐标
      let clickX = 0;
      let clickY = 0;

      if (e.detail && e.detail.x !== undefined) {
        // 小程序环境
        clickX = e.detail.x - rect.left;
        clickY = e.detail.y - rect.top;
      } else if (e.touches && e.touches[0]) {
        // 触摸事件
        clickX = e.touches[0].clientX - rect.left;
        clickY = e.touches[0].clientY - rect.top;
      } else if (e.clientX !== undefined) {
        // 鼠标事件
        clickX = e.clientX - rect.left;
        clickY = e.clientY - rect.top;
      }
      const newDots = [...dots];
      // 检查点击是否在某个珠子内
      for (let i = 0; i < newDots.length; i++) {
        const dot = newDots[i];
        const distance = Math.sqrt(
          Math.pow(clickX - dot.x, 2) + Math.pow(clickY - dot.y, 2)
        );

        if (distance <= dot.radius) {
          // 点击在珠子内
          setSelectedBeadIndex((prev) => (prev === i ? -1 : i));
          break;
        }
      }
      setDots(newDots);
    });
    query.exec();
  };

  const onChangeBeadType = (beadType: string) => {
    setSelectedBeadType(beadType);
  };

  useEffect(() => {
    if (beadStatus === "success") {
      drawCanvas(dots, selectedBeadIndex);
    }
    // eslint-disable-next-line
  }, [beadStatus, dots, selectedBeadIndex]);

  const onClockwiseMove = () => {
    if (selectedBeadIndex === -1) return;
    const newDots = [...dots];
    const selectedBead = newDots[selectedBeadIndex || 0];
    if (!selectedBead) return;
    const nextIndex = (selectedBeadIndex + 1) % newDots.length;
    newDots[selectedBeadIndex || 0] = newDots[nextIndex];
    newDots[nextIndex] = selectedBead;
    const dotsWithNewPositions = computeBeadPositions(newDots, spacing);
    setDots(dotsWithNewPositions);
    setSelectedBeadIndex(nextIndex);
  };

  const onCounterclockwiseMove = () => {
    if (selectedBeadIndex === -1) return;
    const newDots = [...dots];
    const selectedBead = newDots[selectedBeadIndex || 0];
    if (!selectedBead) return;
    const nextIndex = (selectedBeadIndex - 1 + newDots.length) % newDots.length;
    newDots[selectedBeadIndex || 0] = newDots[nextIndex];
    newDots[nextIndex] = selectedBead;
    const dotsWithNewPositions = computeBeadPositions(newDots, spacing);
    setDots(dotsWithNewPositions);
    setSelectedBeadIndex(nextIndex);
  };

  const onDelete = () => {
    if (selectedBeadIndex === -1) return;
    const newDots = [...dots];
    newDots.splice(selectedBeadIndex, 1);
    const dotsWithNewPositions = computeBeadPositions(newDots, spacing);
    setDots(dotsWithNewPositions);
    setSelectedBeadIndex(-1);
  };

  console.log(Object.keys(beadTypeMap), "Object.keys(beadTypeMap)");

  const handleBeadClick = (bead: any) => {
    const newDots = [...dots];
    if (selectedBeadIndex === -1) {
      newDots.push(bead);
    } else {
      newDots[selectedBeadIndex] = bead;
    }
    const dotsWithNewPositions = computeBeadPositions(newDots, spacing);
    setDots(dotsWithNewPositions);
  };

  return (
    <View style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      {/* 右侧内容区域 */}
      <View
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
        }}
      >
        <Canvas
          canvasId={canvasId}
          id={canvasId}
          height={`${size * dpr}px`}
          width={`${size * dpr}px`}
          style={{ width: `${size}px`, height: `${size}px` }}
          onTouchEnd={handleCanvasClick}
          onClick={handleCanvasClick}
        />

        <View
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <Button
            onClick={onClockwiseMove}
            style={{ opacity: selectedBeadIndex === -1 ? 0.7 : 1 }}
          >
            顺时针移动
          </Button>
          <Button
            onClick={onCounterclockwiseMove}
            style={{ opacity: selectedBeadIndex === -1 ? 0.7 : 1 }}
          >
            逆时针移动
          </Button>
          <Button
            onClick={onDelete}
            style={{ opacity: selectedBeadIndex === -1 ? 0.7 : 1 }}
          >
            删除
          </Button>
        </View>
      </View>
      {/* 左侧纵向Tab选择器 */}
      <View
        style={{
          display: "flex",
          backgroundColor: "#f7eed4e8",
          borderRadius: "8px",
          height: "100%",
          margin: "20px",
        }}
      >
        <View
          style={{
            width: "60px",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px 0 0 8px",
            padding: "8px",
            maxHeight: "500px",
            overflowY: "auto",
            flexShrink: 0,
          }}
        >
          {Object.keys(beadTypeMap).map((beadType, index) => (
            <View
              key={beadType}
              onClick={() => onChangeBeadType(beadType)}
              style={{
                padding: "8px 12px",
                marginBottom: "8px",
                borderRadius: "6px",
                backgroundColor:
                  selectedBeadType === beadType
                    ? "rgb(245 221 136 / 0.3)"
                    : "#f5f5f5",
                color: selectedBeadType === beadType ? "#fffff" : "#333",
                fontSize: "12px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
                // border:
                //   selectedBeadType === beadType
                //     ? "1px solid #ecbd2d"
                //     : "1px solid #e0e0e0",
                boxShadow:
                  selectedBeadType === beadType
                    ? "0 2px 4px rgb(194 216 226)"
                    : "none",
              }}
            >
              {beadType}
              {beadTypeMap[beadType] && beadTypeMap[beadType].length > 0 && (
                <View
                  style={{
                    fontSize: "10px",
                    marginTop: "4px",
                    opacity: 0.8,
                  }}
                >
                  ({beadTypeMap[beadType].length}个)
                </View>
              )}
            </View>
          ))}
        </View>
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            maxHeight: "300px",
            overflowY: "auto",
            padding: "24px",
          }}
        >
          {beadTypeMap[selectedBeadType]?.map((item: any) => (
            <View key={item.id} style={{ width: "70px", height: "70px" }} onClick={() => handleBeadClick(item)}>
              <Image
                src={item.image_url}
                style={{ width: "70%", height: "70%" }}
              />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default CustomDesignRing;
