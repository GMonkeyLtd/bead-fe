# useCircleRingCanvas Hook

## 概述

`useCircleRingCanvas` 是一个优化的React Hook，用于在Taro小程序中绘制水晶手串。该Hook通过共享单个Canvas实例来绘制多个手串，显著减少内存消耗，提高性能。

## 主要特性

- 🎯 **单Canvas实例**: 整个页面只使用一个Canvas实例，避免创建多个Canvas导致的内存问题
- 💾 **智能缓存**: 自动缓存已生成的手串图片，避免重复绘制
- 🔄 **队列管理**: 智能处理并发绘制请求，避免资源冲突
- 📊 **状态管理**: 提供详细的状态信息，包括处理进度和错误处理
- 🧹 **内存优化**: 自动清理过期缓存，防止内存泄漏

## 使用方法

### 基本用法

```tsx
import { useCircleRingCanvas } from '@/hooks/useCircleRingCanvas';

const MyComponent = () => {
  const {
    generateCircleRing,
    getResult,
    canvasProps
  } = useCircleRingCanvas({
    targetSize: 1024,
    isDifferentSize: true,
    fileType: "png"
  });

  const beadData = [
    { image_url: "https://example.com/bead1.png", bead_diameter: 16 },
    { image_url: "https://example.com/bead2.png", bead_diameter: 18 },
  ];

  const handleGenerate = async () => {
    try {
      const imageUrl = await generateCircleRing(beadData);
      console.log('生成的手串图片:', imageUrl);
    } catch (error) {
      console.error('生成失败:', error);
    }
  };

  return (
    <View>
      <Button onClick={handleGenerate}>生成手串</Button>
      {/* 隐藏的Canvas用于绘制 */}
      <Canvas {...canvasProps} />
    </View>
  );
};
```

### 在页面中使用多个手串

```tsx
import { useCircleRingCanvas } from '@/hooks/useCircleRingCanvas';

const BraceletPage = () => {
  const [bracelets, setBracelets] = useState([
    [
      { image_url: "bead1.png", bead_diameter: 16 },
      { image_url: "bead2.png", bead_diameter: 18 },
    ],
    [
      { image_url: "bead3.png", bead_diameter: 14 },
      { image_url: "bead4.png", bead_diameter: 16 },
    ],
  ]);

  const {
    generateCircleRing,
    getResult,
    clearAllResults,
    getProcessingStatus
  } = useCircleRingCanvas();

  // 生成所有手串
  const generateAll = async () => {
    const promises = bracelets.map(beadData => 
      generateCircleRing(beadData)
    );
    await Promise.all(promises);
  };

  return (
    <View>
      <Button onClick={generateAll}>生成所有手串</Button>
      
      {bracelets.map((beadData, index) => {
        const result = getResult(beadData);
        
        return (
          <View key={index}>
            <Text>状态: {result.status}</Text>
            {result.status === "success" && result.imageUrl && (
              <Image src={result.imageUrl} />
            )}
          </View>
        );
      })}
    </View>
  );
};
```

## API 参考

### Hook 配置参数

```tsx
interface CircleRingConfig {
  targetSize?: number;        // Canvas尺寸，默认1024
  isDifferentSize?: boolean;  // 是否使用不同尺寸的珠子，默认false
  fileType?: "png" | "jpg" | "jpeg";  // 输出图片格式，默认"png"
  canvasId?: string;          // Canvas ID，默认"shared-circle-canvas"
}
```

### 返回值

```tsx
{
  generateCircleRing: (dotsBgImageData: DotImageData[]) => Promise<string | null>;
  getResult: (dotsBgImageData: DotImageData[]) => CircleRingResult;
  clearResult: (dotsBgImageData: DotImageData[]) => void;
  clearAllResults: () => void;
  getProcessingStatus: () => ProcessingStatus;
  canvasProps: CanvasProps;
}
```

### 数据类型

```tsx
interface DotImageData {
  image_url: string;          // 珠子图片URL
  bead_diameter?: number;     // 珠子直径（可选）
}

interface CircleRingResult {
  imageUrl: string | null;    // 生成的图片URL
  status: "idle" | "downloading" | "success" | "error";
  error?: string;             // 错误信息
}

interface ProcessingStatus {
  isProcessing: boolean;      // 是否正在处理
  processingCount: number;    // 正在处理的数量
  resultsCount: number;       // 已缓存结果的数量
}
```

## 性能优化

### 内存使用对比

| 方案 | 内存使用 | 性能 | 适用场景 |
|------|----------|------|----------|
| 传统方案（多个Canvas） | 高 | 低 | 少量手串 |
| useCircleRingCanvas | 低 | 高 | 多个手串 |

### 缓存策略

- **自动缓存**: 相同配置的手串只绘制一次
- **智能清理**: 自动清理过期和超量的缓存
- **并发控制**: 限制同时处理的请求数量

### 最佳实践

1. **合理设置缓存大小**: 根据设备内存调整缓存策略
2. **及时清理**: 在页面卸载时调用 `clearAllResults()`
3. **错误处理**: 始终处理生成失败的情况
4. **状态监控**: 使用 `getProcessingStatus()` 监控处理状态

## 注意事项

1. **Canvas ID唯一性**: 确保在同一页面中Canvas ID不重复
2. **图片资源**: 确保珠子图片URL可访问
3. **内存管理**: 在页面卸载时清理缓存
4. **错误处理**: 处理网络错误和Canvas API不可用的情况

## 示例项目

查看 `src/components/CircleRing/demo.tsx` 获取完整的使用示例。

## 避免循环渲染的最佳实践

### ❌ 错误用法
```tsx
// 这会导致循环渲染
const [results, setResults] = useState(new Map());

const generateCircleRing = useCallback(async (data) => {
  // ... 生成逻辑
  setResults(prev => new Map(prev).set(id, result));
}, [results]); // 依赖results会导致循环渲染
```

### ✅ 正确用法
```tsx
// 使用useRef避免循环渲染
const resultsRef = useRef(new Map());

const generateCircleRing = useCallback(async (data) => {
  // ... 生成逻辑
  resultsRef.current.set(id, result);
}, []); // 没有依赖项，不会循环渲染
```

### 在组件中的正确使用
```tsx
const MyComponent = () => {
  const { generateCircleRing, getResult } = useCircleRingCanvas();
  
  // ✅ 使用useMemo缓存数据
  const memoizedData = useMemo(() => beadData, [beadData]);
  
  // ✅ 在useEffect中调用，避免在渲染时调用
  useEffect(() => {
    if (memoizedData.length > 0) {
      generateCircleRing(memoizedData);
    }
  }, [memoizedData, generateCircleRing]);
  
  return <View>...</View>;
};
```

### 关键要点

1. **使用useRef存储状态**: 避免在useCallback依赖项中包含状态
2. **缓存数据**: 使用useMemo缓存不会频繁变化的数据
3. **避免在渲染时调用**: 在useEffect中调用异步函数
4. **合理设置依赖项**: 只包含真正需要的依赖项 