import React, { useState, useEffect, useRef } from 'react';
import { Canvas, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './index.scss';
import crystal000 from '@/assets/000.png';
import crystal11 from '@/assets/11.png';
import crystal22 from '@/assets/22.png';
import crystal33 from '@/assets/33.png';
import crystal44 from '@/assets/44.png';
import crystal111 from '@/assets/111.png';

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
const CircleComponent = ({
  dotRadius = 16, // 小圆珠子的半径
  dotDistance = 110, // 大圆的半径（从中心到珠子中心的距离）
  size = 400, // Canvas尺寸
  spacingFactor = 0.9, // 间距系数，1.0表示珠子相切，大于1.0表示有间隙
}) => {
  const canvasRef = useRef(null);
  const [dots, setDots] = useState<any[]>([]);
  const [dotCount, setDotCount] = useState(0);

  const dotsBgImagePath = [
    crystal000,
    crystal11,
    crystal22,
    crystal33,
    crystal44,
    crystal111,
  ]

  // 动态计算珠子数量 - 使用更精确的几何计算
  const calculateDotCount = () => {
    // 方法1: 基于弦长的精确计算
    // 当两个珠子相切时，它们中心之间的距离应该是 2 * dotRadius * spacingFactor
    const requiredChordLength = 2 * dotRadius * spacingFactor;
    
    // 利用弦长公式：chord = 2 * R * sin(θ/2)，其中R是大圆半径，θ是圆心角
    // 所以：θ = 2 * arcsin(chord / (2 * R))
    const halfAngle = Math.asin(Math.min(1, requiredChordLength / (2 * dotDistance)));
    const anglePerDot = 2 * halfAngle;
    
    // 计算能放置的珠子数量
    let calculatedCount = Math.floor(2 * Math.PI / anglePerDot);
    
    // 方法2: 基于弧长的简化计算（作为备用）
    if (calculatedCount <= 0 || !isFinite(calculatedCount)) {
      const circumference = 2 * Math.PI * dotDistance;
      const requiredArcLength = 2 * dotRadius * spacingFactor;
      calculatedCount = Math.floor(circumference / requiredArcLength);
    }
    
    // 确保数量合理（至少3个，最多100个）
    const finalCount = Math.max(3, Math.min(100, calculatedCount));
    
    return finalCount;
  };

  // 初始化和计算圆点位置
  useEffect(() => {
    // 首先计算珠子数量
    const calculatedDotCount = calculateDotCount();
    setDotCount(calculatedDotCount);

    // 根据计算出的数量生成珠子位置
    const newDots: any[] = [];
    for (let i = 0; i < calculatedDotCount; i++) {
      const angle = (i / calculatedDotCount) * Math.PI * 2;
      const x = size / 2 + dotDistance * Math.cos(angle);
      const y = size / 2 + dotDistance * Math.sin(angle);
      newDots.push({ 
        x, 
        y, 
        index: i, 
        angle,
        // 添加一些额外信息用于调试
        arcLength: (2 * Math.PI * dotDistance) / calculatedDotCount
      });
    }
    setDots(newDots);
    
         // 输出详细的调试信息
     const actualChordLength = 2 * dotDistance * Math.sin(Math.PI / calculatedDotCount);
     const actualArcLength = (2 * Math.PI * dotDistance) / calculatedDotCount;
     const theoreticalChordLength = 2 * dotRadius * spacingFactor;
     
     console.log(`🔮 水晶手链动态计算结果:
       ├─ 珠子半径: ${dotRadius}px
       ├─ 手链半径: ${dotDistance}px  
       ├─ 间距系数: ${spacingFactor}
       ├─ 计算出的珠子数量: ${calculatedDotCount}个
       ├─ 实际珠子间弦长: ${actualChordLength.toFixed(2)}px
       ├─ 理论需要弦长: ${theoreticalChordLength}px
       ├─ 实际弧长: ${actualArcLength.toFixed(2)}px
       └─ 珠子间隙状态: ${actualChordLength > theoreticalChordLength ? '有间隙✨' : '紧密排列🔗'}`);
  }, [dotRadius, dotDistance, size, spacingFactor]);

  // 绘制Canvas内容
  const drawCanvas = () => {
    try {
      const ctx = Taro.createCanvasContext('circle-canvas');
      
      // 清除画布
      ctx.clearRect(0, 0, size, size);
      
      // 绘制背景圆环轨道（可选）
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, dotDistance, 0, 2 * Math.PI);
      ctx.setStrokeStyle('rgba(255, 255, 255, 0.2)');
      ctx.setLineWidth(2);
      ctx.stroke();
      
      // 绘制环绕的水晶珠子
      dots.forEach((dot: any) => {
        const bgImage = dotsBgImagePath[dot.index % dotsBgImagePath.length];
        
        // 绘制珠子图像
        ctx.drawImage(
          bgImage, 
          dot.x - dotRadius, 
          dot.y - dotRadius, 
          dotRadius * 2, 
          dotRadius * 2
        );
        
        // 可选：绘制珠子编号（调试用）
        if (dotCount <= 20) { // 只在珠子较少时显示编号
          ctx.setFillStyle('rgba(255, 255, 255, 0.8)');
          ctx.setFontSize(10);
          ctx.setTextAlign('center');
          ctx.fillText(
            (dot.index + 1).toString(), 
            dot.x, 
            dot.y + 3
          );
        }
      });

      ctx.draw();
    } catch (error) {
      // 兼容处理：如果Canvas API不可用，使用备用方案
      console.log('❌ Canvas API 不可用，使用备用方案', error);
    }
  };

  // 当数据更新时重新绘制
  useEffect(() => {
    if (dots.length > 0) {
      setTimeout(drawCanvas, 100); // 延迟绘制确保Canvas已准备好
    }
  }, [dots]);

  // 处理画布点击事件
  const handleCanvasClick = (e: any) => {
    const { x, y } = e.detail || {};
    if (!x || !y) return;

  };

  return (
    <View style={{ 
      width: `${size}px`, 
      height: `${size}px`, 
      margin: '20px auto',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'white'
    }}>
      <Canvas
        canvasId="circle-canvas"
        style={{ width: `${size}px`, height: `${size}px` }}
        onTouchEnd={handleCanvasClick}
      />   
    </View>
  );
};

export default CircleComponent;    