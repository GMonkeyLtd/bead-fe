# useCircleRingCanvas Hook 集成指南

## 快速开始

### 1. 在页面中使用

```tsx
// pages/bracelet-list/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Image } from '@tarojs/components';
import { useCircleRingCanvas } from '@/hooks/useCircleRingCanvas';

const BraceletListPage = () => {
  const [bracelets, setBracelets] = useState([
    // 手串1
    [
      { image_url: 'https://example.com/bead1.png', bead_diameter: 16 },
      { image_url: 'https://example.com/bead2.png', bead_diameter: 18 },
      { image_url: 'https://example.com/bead3.png', bead_diameter: 16 },
    ],
    // 手串2
    [
      { image_url: 'https://example.com/bead4.png', bead_diameter: 14 },
      { image_url: 'https://example.com/bead5.png', bead_diameter: 16 },
    ],
  ]);

  const {
    generateCircleRing,
    getResult,
    clearAllResults,
    canvasProps
  } = useCircleRingCanvas({
    targetSize: 1024,
    isDifferentSize: true,
  });

  // 页面加载时生成所有手串
  useEffect(() => {
    const generateAll = async () => {
      try {
        await Promise.all(
          bracelets.map(beadData => generateCircleRing(beadData))
        );
      } catch (error) {
        console.error('生成手串失败:', error);
      }
    };
    
    generateAll();
  }, [bracelets, generateCircleRing]);

  // 页面卸载时清理缓存
  useEffect(() => {
    return () => {
      clearAllResults();
    };
  }, [clearAllResults]);

  return (
    <View>
      {/* 手串列表 */}
      {bracelets.map((beadData, index) => {
        const result = getResult(beadData);
        
        return (
          <View key={index} style={{ marginBottom: '20px' }}>
            <Text>手串 {index + 1}</Text>
            {result.status === 'success' && result.imageUrl && (
              <Image 
                src={result.imageUrl} 
                style={{ width: '200px', height: '200px' }}
              />
            )}
            {result.status === 'downloading' && (
              <View>生成中...</View>
            )}
            {result.status === 'error' && (
              <View style={{ color: 'red' }}>生成失败</View>
            )}
          </View>
        );
      })}

      {/* 隐藏的Canvas */}
      <Canvas {...canvasProps} />
    </View>
  );
};

export default BraceletListPage;
```

### 2. 在组件中使用

```tsx
// components/BraceletCard/index.tsx
import React from 'react';
import { View, Image } from '@tarojs/components';
import { useCircleRingCanvas } from '@/hooks/useCircleRingCanvas';

interface BraceletCardProps {
  beadData: Array<{ image_url: string; bead_diameter?: number }>;
  size?: number;
}

const BraceletCard: React.FC<BraceletCardProps> = ({ 
  beadData, 
  size = 200 
}) => {
  const { generateCircleRing, getResult, canvasProps } = useCircleRingCanvas();

  React.useEffect(() => {
    if (beadData.length > 0) {
      generateCircleRing(beadData);
    }
  }, [beadData, generateCircleRing]);

  const result = getResult(beadData);

  return (
    <View>
      {result.status === 'success' && result.imageUrl && (
        <Image 
          src={result.imageUrl} 
          style={{ width: `${size}px`, height: `${size}px` }}
        />
      )}
      {result.status === 'downloading' && (
        <View style={{ 
          width: `${size}px`, 
          height: `${size}px`,
          backgroundColor: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          生成中...
        </View>
      )}
      {result.status === 'error' && (
        <View style={{ 
          width: `${size}px`, 
          height: `${size}px`,
          backgroundColor: '#ffe6e6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'red'
        }}>
          生成失败
        </View>
      )}
      
      {/* 隐藏的Canvas */}
      <Canvas {...canvasProps} />
    </View>
  );
};

export default BraceletCard;
```

## 性能优化建议

### 1. 批量生成

```tsx
// 批量生成多个手串，避免逐个生成
const generateAllBracelets = async (braceletList) => {
  const promises = braceletList.map(beadData => 
    generateCircleRing(beadData)
  );
  
  try {
    await Promise.all(promises);
    console.log('所有手串生成完成');
  } catch (error) {
    console.error('批量生成失败:', error);
  }
};
```

### 2. 预加载策略

```tsx
// 在用户浏览时预加载下一页的手串
const preloadNextPage = (nextPageBracelets) => {
  nextPageBracelets.forEach(beadData => {
    generateCircleRing(beadData); // 不等待结果，后台生成
  });
};
```

### 3. 内存管理

```tsx
// 在页面切换时清理不需要的缓存
useEffect(() => {
  return () => {
    // 页面卸载时清理所有缓存
    clearAllResults();
  };
}, [clearAllResults]);

// 或者只清理特定的缓存
const clearSpecificBracelet = (beadData) => {
  clearResult(beadData);
};
```

## 错误处理

```tsx
const handleGenerateBracelet = async (beadData) => {
  try {
    const imageUrl = await generateCircleRing(beadData);
    if (imageUrl) {
      // 成功处理
      setBraceletImage(imageUrl);
    }
  } catch (error) {
    // 错误处理
    console.error('生成手串失败:', error);
    Taro.showToast({
      title: '生成失败，请重试',
      icon: 'none'
    });
  }
};
```

## 状态监控

```tsx
const { getProcessingStatus } = useCircleRingCanvas();

// 定期检查处理状态
useEffect(() => {
  const interval = setInterval(() => {
    const status = getProcessingStatus();
    console.log('处理状态:', status);
    
    if (status.isProcessing) {
      // 显示加载状态
      setLoading(true);
    } else {
      // 隐藏加载状态
      setLoading(false);
    }
  }, 1000);

  return () => clearInterval(interval);
}, [getProcessingStatus]);
```

## 注意事项

1. **Canvas ID唯一性**: 确保在同一页面中Canvas ID不重复
2. **内存管理**: 及时清理不需要的缓存
3. **错误处理**: 始终处理生成失败的情况
4. **性能监控**: 使用状态监控功能跟踪性能
5. **网络优化**: 确保珠子图片资源可访问且加载速度快 