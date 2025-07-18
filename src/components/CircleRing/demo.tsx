import React, { useState } from "react";
import { View, Text, Button } from "@tarojs/components";
import { useCircleRingCanvas } from "@/hooks/useCircleRingCanvas";
import { CircleRingImage } from "./index";

// 示例数据
const sampleBeadData1 = [
  { image_url: "https://example.com/bead1.png", bead_diameter: 16 },
  { image_url: "https://example.com/bead2.png", bead_diameter: 18 },
  { image_url: "https://example.com/bead3.png", bead_diameter: 16 },
  { image_url: "https://example.com/bead4.png", bead_diameter: 20 },
];

const sampleBeadData2 = [
  { image_url: "https://example.com/bead5.png", bead_diameter: 14 },
  { image_url: "https://example.com/bead6.png", bead_diameter: 16 },
  { image_url: "https://example.com/bead7.png", bead_diameter: 14 },
];

const sampleBeadData3 = [
  { image_url: "https://example.com/bead8.png" },
  { image_url: "https://example.com/bead9.png" },
  { image_url: "https://example.com/bead10.png" },
  { image_url: "https://example.com/bead11.png" },
  { image_url: "https://example.com/bead12.png" },
];

/**
 * CircleRing Hook 使用示例
 * 展示如何在页面中使用单个canvas实例绘制多个手串
 */
const CircleRingDemo: React.FC = () => {
  const [currentBracelets, setCurrentBracelets] = useState([
    sampleBeadData1,
    sampleBeadData2,
    sampleBeadData3,
  ]);

  // 使用优化的hook，只实例化一个canvas
  const {
    generateCircleRing,
    getResult,
    clearAllResults,
    getProcessingStatus,
    canvasProps
  } = useCircleRingCanvas({
    targetSize: 1024,
    isDifferentSize: true,
    fileType: "png",
    canvasId: "demo-shared-canvas"
  });

  // 生成所有手串
  const generateAllBracelets = async () => {
    try {
      const promises = currentBracelets.map((beadData, index) => 
        generateCircleRing(beadData)
          .then(imageUrl => ({ index, imageUrl }))
          .catch(error => ({ index, error: error.message }))
      );
      
      const results = await Promise.allSettled(promises);
      console.log("所有手串生成完成:", results);
    } catch (error) {
      console.error("生成手串失败:", error);
    }
  };

  // 添加新手串
  const addNewBracelet = () => {
    const newBracelet = [
      { image_url: `https://example.com/bead${Date.now()}.png`, bead_diameter: 16 },
      { image_url: `https://example.com/bead${Date.now() + 1}.png`, bead_diameter: 18 },
    ];
    setCurrentBracelets(prev => [...prev, newBracelet]);
  };

  // 清除所有结果
  const handleClearAll = () => {
    clearAllResults();
  };

  const processingStatus = getProcessingStatus();

  return (
    <View style={{ padding: "20px" }}>
      <Text style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "20px" }}>
        CircleRing Hook 优化示例
      </Text>

      {/* 控制按钮 */}
      <View style={{ marginBottom: "20px" }}>
        <Button onClick={generateAllBracelets} style={{ marginBottom: "10px" }}>
          生成所有手串
        </Button>
        <Button onClick={addNewBracelet} style={{ marginBottom: "10px" }}>
          添加新手串
        </Button>
        <Button onClick={handleClearAll}>
          清除所有缓存
        </Button>
      </View>

      {/* 状态信息 */}
      <View style={{ marginBottom: "20px", padding: "10px", backgroundColor: "#f5f5f5" }}>
        <Text>处理状态: {processingStatus.isProcessing ? "处理中" : "空闲"}</Text>
        <Text>正在处理: {processingStatus.processingCount} 个</Text>
        <Text>已缓存结果: {processingStatus.resultsCount} 个</Text>
      </View>

      {/* 手串列表 */}
      <View>
        <Text style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "10px" }}>
          手串列表 ({currentBracelets.length} 个)
        </Text>
        
        {currentBracelets.map((beadData, index) => {
          const result = getResult(beadData);
          
          return (
            <View 
              key={index} 
              style={{ 
                marginBottom: "20px", 
                padding: "15px", 
                border: "1px solid #ddd",
                borderRadius: "8px"
              }}
            >
              <Text style={{ fontWeight: "bold", marginBottom: "10px" }}>
                手串 {index + 1} ({beadData.length} 颗珠子)
              </Text>
              
              <Text style={{ marginBottom: "10px" }}>
                状态: {result.status}
                {result.error && ` - 错误: ${result.error}`}
              </Text>

              {result.status === "success" && result.imageUrl && (
                <CircleRingImage
                  size={120}
                  backendSize={140}
                  imageUrl={result.imageUrl}
                />
              )}

              {result.status === "downloading" && (
                <View style={{ 
                  width: "120px", 
                  height: "120px", 
                  backgroundColor: "#f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Text>生成中...</Text>
                </View>
              )}

              {result.status === "error" && (
                <View style={{ 
                  width: "120px", 
                  height: "120px", 
                  backgroundColor: "#ffe6e6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Text style={{ color: "red" }}>生成失败</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* 隐藏的Canvas - 用于绘制 */}
      <View style={{ position: "absolute", top: "-9999px", left: "-9999px" }}>
        <canvas
          id={canvasProps.canvasId}
          width={canvasProps.width}
          height={canvasProps.height}
          style={{
            width: "1024px",
            height: "1024px",
            visibility: "hidden",
            position: "absolute" as const,
            top: "-999999px",
            left: "-999999px",
            zIndex: -100,
          }}
        />
      </View>
    </View>
  );
};

export default CircleRingDemo; 