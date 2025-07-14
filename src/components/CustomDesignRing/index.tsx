import React, { useEffect, useMemo, useState } from "react";
import { Canvas, View, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { ImageCacheManager } from "@/utils/image-cache";
import CrystalButton from "../CrystalButton";
import "./CustomDesignRing.scss";
import { computeBraceletLength } from "@/utils/cystal-tools";
import CircleRing, { CircleRingImage } from "../CircleRing";

interface Bead {
  image_url: string;
  render_diameter: number; // 渲染直径
  bead_diameter: number; // 珠子直径
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
const targetSize = 1024;

const SIZE_MAP = {
  8: 34,
  10: 48,
  12: 56,
};
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
  size = 0,
  spacing = 0,
  beadTypeMap = {},
  renderRatio = 2,
  onOk,
}: {
  beads: Bead[];
  canvasId?: string;
  size?: number;
  spacing?: number;
  beadTypeMap?: any;
  renderRatio?: number;
  onOk?: (imageUrl: string, editedBeads: Bead[]) => void;
}) => {
  const dpr = Taro.getWindowInfo().pixelRatio || 2;
  const [dots, setDots] = useState<any[]>([]);
  const [selectedBeadIndex, setSelectedBeadIndex] = useState<number>(-1);
  const [beadStatus, setBeadStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");


  const [curWuxing, setCurWuxing] = useState<string>("");
  const [predictedLength, setPredictedLength] = useState<number>(0);
  const [canvasSize, setCanvasSize] = useState<number>(0);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [createFlag, setCreateFlag] = useState<boolean>(false);

  useEffect(() => {
    try {
      const windowInfo = Taro.getWindowInfo();
      const { height: safeHeight } = windowInfo.safeArea || { height: 0 };
      const predictSize = safeHeight / 2 - 16 - 45;
      setCanvasSize(!size && predictSize ? predictSize : size);
    } catch (error) {
      console.warn('Failed to get window info:', error);
      // 降级使用固定尺寸
      const fallbackSize = 300;
      setCanvasSize(!size ? fallbackSize : size);
    }
  }, []);

  const allWuxing = useMemo(
    () => Object.keys(beadTypeMap),
    [JSON.stringify(beadTypeMap)]
  );

  useEffect(() => {
    setCurWuxing(Object.keys(beadTypeMap)[0]);
  }, [allWuxing]);

  useEffect(() => {
    if (!dots.length) return;
    const predictLength = computeBraceletLength(dots, 'bead_diameter');
    setPredictedLength(predictLength);
  }, [dots]);

  useEffect(() => {
    if (imageUrl && createFlag) {
      setCreateFlag(false);
      onOk?.(
        imageUrl,
        dots.map((item) => ({
          id: item.id,
          image_url: item.image_url,
          bead_diameter: item.bead_diameter,
          render_diameter: item.render_diameter,
        }))
      );
    }
  }, [imageUrl]);

  const processImages = async (_beads: Bead[]) => {
    const processedPaths = await ImageCacheManager.processImagePaths(
      _beads.map((item: Bead) => item.image_url)
    );

    const beadsWithImageData = _beads.map((bead: Bead) => {
      return {
        ...bead,
        imageData: processedPaths.get(bead.image_url) || bead.image_url,
      };
    });

    return beadsWithImageData;
  };

  const computeBeadPositions = (beads: Bead[], spacing: number) => {
    const ringRadius = calcRingRadius(beads, spacing);
    const calculatedPositions = calcPositions(beads, spacing, ringRadius);
    return calculatedPositions;
  };

  const processBeads = async (_beads: Bead[]) => {
    setBeadStatus("processing");
    setImageUrl("");
    const beadsWithImageData = await processImages(_beads);
    const positions = computeBeadPositions(beadsWithImageData, spacing);
    setDots(positions);
    setBeadStatus("success");
  };

  useEffect(() => {
    if (!beads || beads.length === 0 || !canvasSize) {
      setBeadStatus("success");
      return;
    }

    try {
      processBeads(beads);
    } catch (error) {
      console.error("❌ 珠子处理过程出错:", error);
      setBeadStatus("error");
    }
  }, [JSON.stringify(beads), canvasSize]);

  // 动态计算圆环半径
  function calcRingRadius(beads: any[], spacing: number) {
    if (!beads.length) return 0;
    const totalArcLen = beads.reduce(
      (sum, b) => sum + b.render_diameter + spacing,
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
    const center = canvasSize / 2;

    for (let i = 0; i < dots.length; i++) {
      const j = (i + 1) % dots.length;
      const r1 = dots[i].render_diameter / 2;
      const r2 = dots[j].render_diameter / 2;
      const L = r1 + r2 + spacing;
      // 计算相邻小圆的中心角 theta_ij
      const theta = 2 * Math.asin(L / (2 * ringRadius));

      // 记录当前小圆的位置
      positions.push({
        ...dots[i],
        radius: r1,
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
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    dotList.forEach((item, index) => {
      if (index === selectedBeadIndex) {
        return;
      }
      const { x, y, radius, imageData, angle } = item;
      
      // 保存当前Canvas状态
      ctx.save();
      
      // 移动到珠子中心
      ctx.translate(x, y);
      
      // 旋转珠子，使孔线指向圆心
      ctx.rotate(angle + Math.PI / 2);
      
      // 绘制珠子（以珠子中心为原点）
      ctx.drawImage(imageData, -radius, -radius, radius * 2, radius * 2);
      
      // 恢复Canvas状态
      ctx.restore();
      
      if (selectedBeadIndex !== -1 && index !== selectedBeadIndex) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 2, 0, 2 * Math.PI);
        ctx.setFillStyle("rgba(245, 241, 237, 0.6)");
        ctx.fill();
      }
    });

    if (selectedBeadIndex !== -1) {
      // 如果是选中的珠子，绘制白色边框
      const { x, y, radius, imageData, angle } = dotList[selectedBeadIndex];
      
      // 保存当前Canvas状态
      ctx.save();
      
      // 移动到珠子中心
      ctx.translate(x, y);
      
      // 旋转珠子，使孔线指向圆心
      ctx.rotate(angle + Math.PI / 2);
      
      // 绘制珠子（以珠子中心为原点）
      ctx.drawImage(imageData, -radius, -radius, radius * 2, radius * 2);
      
      // 恢复Canvas状态
      ctx.restore();
      
      ctx.beginPath();
      ctx.arc(x, y, radius + 2, 0, 2 * Math.PI);
      ctx.setStrokeStyle("#ffffff");
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

  const onWuxingChange = (wuxing: string) => {
    setCurWuxing(wuxing);
  };

  useEffect(() => {
    if (beadStatus === "success") {
      drawCanvas(dots, selectedBeadIndex);
    }
    // eslint-disable-next-line
  }, [beadStatus, dots, selectedBeadIndex]);

  const updateBeads = (newDots: any[]) => {
    processBeads(newDots);
    setImageUrl("");
  };

  const onClockwiseMove = () => {
    if (selectedBeadIndex === -1) {
      Taro.showToast({
        title: "请先选择要移动的珠子",
        icon: "none",
      });
      return;
    }
    const newDots = [...dots];
    const selectedBead = newDots[selectedBeadIndex || 0];
    if (!selectedBead) return;
    const nextIndex = (selectedBeadIndex + 1) % newDots.length;
    newDots[selectedBeadIndex || 0] = newDots[nextIndex];
    newDots[nextIndex] = selectedBead;
    updateBeads(newDots);
    setSelectedBeadIndex(nextIndex);
  };

  const onCounterclockwiseMove = () => {
    if (selectedBeadIndex === -1) {
      Taro.showToast({
        title: "请先选择要移动的珠子",
        icon: "none",
      });
      return;
    }
    const newDots = [...dots];
    const selectedBead = newDots[selectedBeadIndex || 0];
    if (!selectedBead) return;
    const nextIndex = (selectedBeadIndex - 1 + newDots.length) % newDots.length;
    newDots[selectedBeadIndex || 0] = newDots[nextIndex];
    newDots[nextIndex] = selectedBead;
    updateBeads(newDots);
    setSelectedBeadIndex(nextIndex);
  };

  const onDelete = () => {
    if (selectedBeadIndex === -1) {
      Taro.showToast({
        title: "请先选择要删除的珠子",
        icon: "none",
      });
      return;
    }
    const newDots = [...dots];
    newDots.splice(selectedBeadIndex, 1);
    const nextIndex = selectedBeadIndex % newDots.length;
    updateBeads(newDots);
    setSelectedBeadIndex(nextIndex);
  };

  const handleBeadClick = (bead: any, size: number) => {
    const newDots = [...dots];
    if (selectedBeadIndex === -1) {
      newDots.push({
        ...bead,
        render_diameter: size * renderRatio,
        bead_diameter: size,
      });
    } else {
      newDots[selectedBeadIndex] = {
        ...bead,
        render_diameter: size * renderRatio,
        bead_diameter: size,
      };
    }
    updateBeads(newDots);
  };

  const renderBeads = () => {
    const typeBeads = beadTypeMap[curWuxing];
    if (!typeBeads || typeBeads.length === 0) return null;
    return (
      <View
        key={curWuxing}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          overflowY: "auto",
          width: "100%",
          padding: "0px 0px 24px 12px",
          gap: "16px",
          borderRadius: "0 8px 8px 0",
          height: "100%",
          boxSizing: "border-box",
          // backgroundColor: "#f7eed4e8",
          // boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        {typeBeads?.map((item: any) => {
          return (
            <View
              key={item.id}
              style={{
                width: "100%",
                height: "120px",
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignContent: "center",
                gap: "8px",
                // boxSizing: "border-box",
              }}
            >
              {[8, 10, 12].map((size) => {
                return (
                  <View
                    key={`${item.id}-${size}`}
                    onClick={() => handleBeadClick(item, size)}
                    style={{
                      flex: 1,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "72px",
                        width: "72px",
                        backgroundColor: "#ffffff8a",
                        borderRadius: "4px",
                      }}
                    >
                      <Image
                        src={item.image_url}
                        style={{
                          width: `${SIZE_MAP[size] * 0.7}px`,
                          height: `${SIZE_MAP[size] * 0.7}px`,
                        }}
                      />
                    </View>
                    <View
                      style={{
                        fontSize: "12px",
                        color: "#333",
                        textAlign: "center",
                        marginTop: "4px",
                      }}
                    >
                      {item.name}
                    </View>
                    <View
                      style={{
                        fontSize: "10px",
                        color: "#8e7767",
                        textAlign: "center",
                      }}
                    >
                      {size}mm
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View className="custom-design-ring-container">
      {/* 顶部内容区域 */}
      <View
        className="custom-design-ring-top-container"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          height: `${canvasSize + 16 + 45}px`,
          // height: '50%',
          flexShrink: 0,
          flexGrow: 0,
        }}
      >
        <View
          style={{
            width: "100%",
            position: "relative",
            height: `${canvasSize}px`,
          }}
        >
          <View
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              height: "100%",
            }}
          >
            <View style={{ fontSize: "12px", color: "#333" }}>适合手围:</View>
            <View style={{ fontSize: "12px", color: "#333" }}>
              {`${predictedLength}cm ~ ${predictedLength + 0.5}cm`}
            </View>
          </View>
          <View
            style={{
              width: "100%",
              height: "100%",
              position: "absolute",
              top: 0,
              left: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexShrink: 0,
              flexGrow: 0,
            }}
            onClick={() => setSelectedBeadIndex(-1)}
          >
            <Canvas
              canvasId={canvasId}
              id={canvasId}
              height={`${canvasSize * dpr}px`}
              width={`${canvasSize * dpr}px`}
              style={{
                width: `${canvasSize}px`,
                height: `${canvasSize}px`,
              }}
              onTouchEnd={handleCanvasClick}
              onClick={handleCanvasClick}
            />
          </View>
        </View>
        <View
          style={{
            position: "absolute",
            top: "24px",
            right: "24px",
            border: "1px solid #e4c0a0",
            opacity: !imageUrl ? 0.5 : 1,
            background: "#e4c0a038",
            borderRadius: "8px",
            padding: "4px 8px",
            fontSize: "14px",
            boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.1)",
          }}
          onClick={() => {
            onOk?.(imageUrl, dots.map((item) => ({
              id: item.id,
              image_url: item.image_url,
              bead_diameter: item.bead_diameter,
              render_diameter: item.render_diameter,
            })));
          }}
        >
          去制作
        </View>

        <View
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            width: "80%",
            gap: "16px",
          }}
        >
          <CrystalButton onClick={onCounterclockwiseMove} text="右移" />
          <CrystalButton onClick={onClockwiseMove} text="左移" />

          <CrystalButton onClick={onDelete} text="删除" />
        </View>
      </View>
      {/* 左侧纵向Tab选择器 */}
      <View className="custom-design-ring-bottom-container">
        <View
          style={{
            width: "60px",
            height: "100%",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px 0 0 8px",
            padding: "8px",
            overflowY: "auto",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            // boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.1)",
            // borderRight: "1px solid #efd8c4b8"
          }}
        >
          {allWuxing.map((wuxing, index) => (
            <View
              key={wuxing}
              onClick={() => onWuxingChange(wuxing)}
              style={{
                padding: "8px 12px",
                marginBottom: "8px",
                borderRadius: "6px",
                backgroundColor: curWuxing === wuxing ? "#fdf6eae8" : "#f5f5f5",
                color: curWuxing === wuxing ? "#fffff" : "#333",
                fontSize: "12px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
                // border:
                //   selectedBeadType === beadType
                //     ? "1px solid #ecbd2d"
                //     : "1px solid #e0e0e0",
                boxShadow:
                  curWuxing === wuxing ? "0 2px 4px rgb(194 216 226)" : "none",
              }}
            >
              {wuxing}
              {beadTypeMap[wuxing] && beadTypeMap[wuxing].length > 0 && (
                <View
                  style={{
                    fontSize: "10px",
                    marginTop: "4px",
                    opacity: 0.8,
                  }}
                >
                  ({beadTypeMap[wuxing].length}个)
                </View>
              )}
            </View>
          ))}
        </View>
        {renderBeads()}
      </View>
      <CircleRing
        dotsBgImageData={dots}
        targetSize={1024}
        canvasId="circle-ring-canvas111"
        isDifferentSize
        fileType="jpg"
        onChange={(status, canvasImage) => {
          setImageUrl(canvasImage);
        }}
      />
    </View>
  );
};

export default CustomDesignRing;
