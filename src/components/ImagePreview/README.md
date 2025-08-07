# 图片预览组件

这是一个功能完整的图片预览工具，包含两个主要组件：

## 组件介绍

### 1. PreviewImage - 可预览图片组件

一个可复用的图片显示组件，支持点击预览功能。

#### 基本用法

```tsx
import PreviewImage from '@/components/PreviewImage';

// 基本使用
<PreviewImage
  src="https://example.com/image.jpg"
  width={200}
  height={150}
  borderRadius={8}
  previewable={true}
/>
```

#### 属性说明

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `src` | `string` | - | 图片地址（必填） |
| `alt` | `string` | `''` | 图片描述 |
| `width` | `number \| string` | `'100%'` | 图片宽度 |
| `height` | `number \| string` | `'auto'` | 图片高度 |
| `borderRadius` | `number` | `0` | 圆角半径 |
| `mode` | `string` | `'aspectFill'` | 图片显示模式 |
| `lazyLoad` | `boolean` | `true` | 是否懒加载 |
| `showMenuByLongpress` | `boolean` | `false` | 是否显示长按菜单 |
| `previewable` | `boolean` | `true` | 是否可预览 |
| `previewImages` | `string[]` | - | 预览图片数组 |
| `previewIndex` | `number` | `0` | 预览起始索引 |
| `onClick` | `(src: string) => void` | - | 点击回调 |
| `onLoad` | `(e: any) => void` | - | 加载完成回调 |
| `onError` | `(e: any) => void` | - | 加载失败回调 |

#### 使用示例

```tsx
// 单张图片预览
<PreviewImage
  src="https://example.com/image.jpg"
  width={200}
  height={150}
  borderRadius={8}
  previewable={true}
/>

// 多张图片预览
<PreviewImage
  src={images[0]}
  width={100}
  height={100}
  previewImages={images}
  previewIndex={0}
  previewable={true}
/>

// 圆形头像
<PreviewImage
  src={avatar}
  width={80}
  height={80}
  borderRadius={40}
  className="circular"
  previewable={true}
/>

// 禁用预览
<PreviewImage
  src={image}
  width={150}
  height={100}
  previewable={false}
/>
```

### 2. ImagePreview - 图片预览弹窗组件

全屏图片预览组件，支持多图片滑动、缩放等功能。

#### 基本用法

```tsx
import ImagePreview from '@/components/ImagePreview';

const [previewVisible, setPreviewVisible] = useState(false);

<ImagePreview
  visible={previewVisible}
  images={['image1.jpg', 'image2.jpg', 'image3.jpg']}
  initialIndex={0}
  onClose={() => setPreviewVisible(false)}
/>
```

#### 属性说明

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `visible` | `boolean` | - | 是否显示预览（必填） |
| `images` | `string[]` | - | 图片数组（必填） |
| `initialIndex` | `number` | `0` | 初始显示图片索引 |
| `onClose` | `() => void` | - | 关闭回调 |

#### 功能特性

- ✅ 全屏预览
- ✅ 多图片滑动切换
- ✅ 图片计数显示
- ✅ 保存图片功能
- ✅ 响应式设计
- ✅ 加载状态处理
- ✅ 错误状态处理
- ✅ 动画效果

## 在项目中使用

### 1. 在OrderList中使用

```tsx
import PreviewImage from '@/components/PreviewImage';

// 替换原有的Image组件
<PreviewImage
  className={styles.orderImage}
  src={order.design_info?.image_url}
  width="100%"
  height="100%"
  mode="aspectFill"
  previewable={true}
/>
```

### 2. 在ProductPriceForm中使用

```tsx
import PreviewImage from '@/components/PreviewImage';

// 显示上传的图片
{images.map((image, index) => (
  <View key={index} className={styles.imageItem}>
    <PreviewImage
      src={image}
      width="100%"
      height="100%"
      borderRadius={8}
      previewable={true}
      previewImages={images}
      previewIndex={index}
    />
  </View>
))}
```

## 样式定制

### 自定义样式类

```scss
// 小尺寸预览图标
.preview-image-container.small {
  .preview-overlay .preview-icon {
    width: 24px;
    height: 24px;
  }
}

// 大尺寸预览图标
.preview-image-container.large {
  .preview-overlay .preview-icon {
    width: 48px;
    height: 48px;
  }
}

// 圆形图片
.preview-image-container.circular {
  border-radius: 50%;
}
```

### 响应式设计

组件已经内置了响应式设计，在不同屏幕尺寸下会自动调整：

- 移动端：优化触摸体验
- 桌面端：支持鼠标悬停效果

## 注意事项

1. **图片格式支持**：支持 jpg、png、gif、webp 等常见格式
2. **网络图片**：确保图片URL可访问
3. **性能优化**：建议使用适当尺寸的图片
4. **错误处理**：组件内置了图片加载失败的处理
5. **权限要求**：保存图片功能需要相册权限

## 示例代码

完整的使用示例请参考 `demo.tsx` 文件。 