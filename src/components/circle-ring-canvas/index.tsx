import React, { useState, useEffect, useRef } from 'react';
import { Canvas, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './index.scss';
import { getDotRingData } from '@/utils/cystal-tools';
import { ImageCacheManager } from '@/utils/image-cache';

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
  dotRadius = 16, // 小圆珠子的半径
  dotDistance = 110, // 大圆的半径（从中心到珠子中心的距离）
  size = 400, // Canvas尺寸
  dotsBgImagePath
    
}) => {
  const [dots, setDots] = useState<any[]>([]);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'success' | 'error'>('idle');

  // 处理图片路径（下载网络图片）
  useEffect(() => {
    if (!dotsBgImagePath || dotsBgImagePath.length === 0) {
      setDownloadStatus('success');
      return;
    }

    const processImages = async () => {
      setDownloadStatus('downloading');
      
      try {
        // 使用ImageCacheManager处理图片路径
        const processedPaths = await ImageCacheManager.processImagePaths(dotsBgImagePath);
        
        // 将处理后的路径映射回原始数组结构
        const finalImagePaths = dotsBgImagePath.map((originalPath: string) => {
          return processedPaths.get(originalPath) || originalPath;
        });

        // 生成珠子位置数据
        const dotRingData = getDotRingData(finalImagePaths, dotDistance, size / 2, size / 2);
        setDots(dotRingData);
        
        setDownloadStatus('success');
        console.log(`🎯 珠子数据生成完成，共 ${dotRingData.length} 个珠子`);
      } catch (error) {
        console.error('❌ 图片处理过程出错:', error);
        setDownloadStatus('error');
      }
    };

    processImages();
  }, [dotsBgImagePath, dotDistance]);

  // 绘制Canvas内容
  const drawCanvas = () => {
    if (downloadStatus !== 'success') {
      console.log('⏳ 等待图片下载完成...');
      return;
    }

    try {
      const ctx = Taro.createCanvasContext('circle-canvas');
      
      // 清除画布
      ctx.clearRect(0, 0, size, size);
      
      // 绘制背景圆环轨道（可选）
      // ctx.beginPath();
      // ctx.arc(size / 2, size / 2, dotDistance, 0, 2 * Math.PI);
      // ctx.setStrokeStyle('rgba(255, 255, 255, 0.2)');
      // ctx.setLineWidth(2);
      // ctx.stroke();
      
      // 绘制环绕的水晶珠子
      dots.forEach((dot: any) => {
        try {
          // 绘制珠子图像
          ctx.drawImage(
            dot.bgImage, 
            dot.x - dotRadius, 
            dot.y - dotRadius, 
            dotRadius * 2, 
            dotRadius * 2
          );
        } catch (imageError) {
          console.error('❌ 绘制图片失败:', dot.bgImage, imageError);
          // 如果图片绘制失败，绘制一个简单的圆形作为备用
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, dotRadius, 0, 2 * Math.PI);
          ctx.setFillStyle('#cccccc');
          ctx.fill();
        }
      });

      ctx.draw();
      console.log(`🎨 Canvas绘制完成，绘制了 ${dots.length} 个珠子`);
    } catch (error) {
      // 兼容处理：如果Canvas API不可用，使用备用方案
      console.log('❌ Canvas API 不可用，使用备用方案', error);
    }
  };

  // 当数据更新时重新绘制
  useEffect(() => {
    if (dots.length > 0 && downloadStatus === 'success') {
      setTimeout(drawCanvas, 100); // 延迟绘制确保Canvas已准备好
    }
  }, [dots, downloadStatus]);

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
      {/* 下载状态提示 */}
      {downloadStatus === 'downloading' && (
        <View style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: 1000
        }}>
          🔄 下载图片中...
        </View>
      )}

      {downloadStatus === 'error' && (
        <View style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(255,0,0,0.7)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: 1000
        }}>
          ❌ 图片下载失败
        </View>
      )}
      
      <Canvas
        canvasId="circle-canvas"
        style={{ width: `${size}px`, height: `${size}px` }}
        onTouchEnd={handleCanvasClick}
      />   
    </View>
  );
};

export default CircleRing;    