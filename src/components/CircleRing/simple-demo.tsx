import React, { useState, useEffect, useMemo } from "react";
import { View, Text, Button, Image } from "@tarojs/components";
import { useCircleRingCanvas } from "@/hooks/useCircleRingCanvas";

// 示例数据
const sampleBeadData1 = [
  { image_url: "https://example.com/bead1.png", bead_diameter: 16 },
  { image_url: "https://example.com/bead2.png", bead_diameter: 18 },
  { image_url: "https://example.com/bead3.png", bead_diameter: 16 },
];

const sampleBeadData2 = [
  { image_url: "https://example.com/bead4.png", bead_diameter: 14 },
  { image_url: "https://example.com/bead5.png", bead_diameter: 16 },
];

/**
 * 简化的CircleRing Hook 使用示例
 * 避免循环渲染的最佳实践
 */
const SimpleCircleRingDemo: React.FC = () => {
  const [bracelets] = useState([sampleBeadData1, sampleBeadData2]);
  const [braceletImages, setBraceletImages] = useState<Map<number, string>>(new Map());
  const [loadingStates, setLoadingStates] = useState<Map<number, boolean>>(new Map());

  // 使用优化的hook，只实例化一个canvas
  const {
    generateCircleRing,
    getResult,
    clearAllResults,
    canvasProps
  } = useCircleRingCanvas({
    targetSize: 1024,
    isDifferentSize: true,
    fileType: "png",
    canvasId: "simple-demo-canvas"
  });

  // 使用useMemo缓存bracelets，避免不必要的重新计算
  const memoizedBracelets = useMemo(() => bracelets, [bracelets]);

  // 生成单个手串的函数
  const generateSingleBracelet = async (index: number, beadData: any[]) => {
    try {
      setLoadingStates(prev => new Map(prev).set(index, true));
      
      const imageUrl = await generateCircleRing(beadData);
      
      if (imageUrl) {
        setBraceletImages(prev => new Map(prev).set(index, imageUrl));
      }
    } catch (error) {
      console.error(`生成手串 ${index + 1} 失败:`, error);
    } finally {
      setLoadingStates(prev => new Map(prev).set(index, false));
    }
  };

  // 生成所有手串
  const generateAllBracelets = async () => {
    const promises = memoizedBracelets.map((beadData, index) => 
      generateSingleBracelet(index, beadData)
    );
    
    try {
      await Promise.all(promises);
      console.log("所有手串生成完成");
    } catch (error) {
      console.error("批量生成失败:", error);
    }
  };

  // 页面加载时生成所有手串
  useEffect(() => {
    generateAllBracelets();
  }, []); // 只在组件挂载时执行一次

  // 页面卸载时清理缓存
  useEffect(() => {
    return () => {
      clearAllResults();
    };
  }, [clearAllResults]);

  return (
    <View style={{ padding: "20px" }}>
      <Text style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "20px" }}>
        简化的CircleRing Hook 示例
      </Text>

      {/* 控制按钮 */}
      <View style={{ marginBottom: "20px" }}>
        <Button onClick={generateAllBracelets} style={{ marginBottom: "10px" }}>
          重新生成所有手串
        </Button>
        <Button onClick={clearAllResults}>
          清除所有缓存
        </Button>
      </View>

      {/* 手串列表 */}
      <View>
        <Text style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "10px" }}>
          手串列表 ({memoizedBracelets.length} 个)
        </Text>
        
        {memoizedBracelets.map((beadData, index) => {
          const imageUrl = braceletImages.get(index);
          const isLoading = loadingStates.get(index);
          
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

              {isLoading && (
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

              {!isLoading && imageUrl && (
                <Image
                  src={imageUrl}
                  style={{ 
                    width: "120px", 
                    height: "120px",
                    borderRadius: "8px"
                  }}
                />
              )}

              {!isLoading && !imageUrl && (
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

export default SimpleCircleRingDemo; 