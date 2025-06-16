import React, { useEffect } from 'react';
import { Canvas, View, Image } from '@tarojs/components';
import base from '@/assets/base.png';
import { useCircleRing } from '@/hooks/useCircleRing';
import './index.scss';
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
interface CircleRingProps {
  imageUrl: string;
  size?: number;
  backendSize?: number;
  rotate?: boolean;
}

const CircleRing: React.FC<CircleRingProps> = ({
  imageUrl,
  size = 140,
  backendSize = 160,
  rotate = false
}) => {

  return (
    <View style={{ 
      width: `${backendSize}px`, 
      height: `${backendSize}px`, 
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent'
    }}>
      
      <Image
        src={base}
        style={{ width: `${backendSize}px`, height: `${backendSize}px`, position: 'absolute' }}
      />

      {imageUrl && (
        <Image
          src={imageUrl}
          className={rotate ? 'circle-image-rotate' : ''}
          style={{ 
            width: `${size}px`, 
            height: `${size}px`,
            position: 'absolute'
          }}
        />
      )}
    </View>
  );
};

export default React.memo(CircleRing);