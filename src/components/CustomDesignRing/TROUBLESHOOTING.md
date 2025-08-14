# 珠子图片不显示问题排查指南

## 问题描述
运行后珠子的图片没有显示，只看到空白或占位符。

## 可能的原因和解决方案

### 1. 数据结构问题

#### 检查beads数据
在浏览器控制台中查看以下日志：
```javascript
// 检查beads数组
console.log("beads prop", beads);

// 检查beadPositions数组
console.log("beadPositions", beadPositions);

// 检查第一个珠子的数据结构
console.log("First bead data:", beadPositions[0]);
```

**期望的数据结构：**
```javascript
{
  id: "1",
  image_url: "https://example.com/bead.png",
  imageData: "https://example.com/processed-bead.png", // 可选
  diameter: 8,
  render_diameter: 16,
  x: 100,
  y: 100,
  angle: 0,
  radius: 8
}
```

**问题排查：**
- 如果`beads`为空数组，检查`CustomDesignRing`的初始化
- 如果`image_url`为空，检查数据源
- 如果`imageData`为空，检查图片处理流程

### 2. 图片路径问题

#### 检查图片URL
```javascript
// 检查图片路径
console.log("Image URLs:", beadPositions.map(bead => ({
  image_url: bead.image_url,
  imageData: bead.imageData
})));
```

**常见问题：**
- 图片URL无效或404
- 图片URL是相对路径
- 图片URL需要认证

**解决方案：**
- 确保图片URL是完整的绝对路径
- 检查图片是否能正常访问
- 验证图片格式支持（jpg, png, webp等）

### 3. 样式问题

#### 检查CSS样式
在浏览器开发者工具中检查：
- `.bead-movable`的尺寸是否正确
- `.bead-image`是否被隐藏
- 是否有CSS冲突

**关键样式检查：**
```css
.bead-movable {
  width: 60px;  /* 应该等于 bead.radius * 2 */
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bead-image {
  width: 100% !important;
  height: 100% !important;
  display: block !important;
}
```

### 4. MovableView配置问题

#### 检查MovableView属性
```javascript
// 检查MovableView的样式计算
console.log(`Bead ${index} style:`, {
  x: Math.round(bead.x - bead.radius),
  y: Math.round(bead.y - bead.radius),
  radius: bead.radius,
  image_url: bead.image_url
});
```

**关键属性：**
- `x`和`y`：珠子的位置坐标
- `width`和`height`：珠子的尺寸
- `direction="all"`：允许拖拽
- `outOfBounds={false}`：不允许超出边界

### 5. 图片加载问题

#### 检查图片加载状态
```javascript
// 图片加载成功
onLoad={() => {
  console.log(`Successfully loaded image for bead ${index}:`, bead.imageData || bead.image_url);
}}

// 图片加载失败
onError={(e) => {
  console.error(`Failed to load image for bead ${index}:`, bead.imageData || bead.image_url, e);
}}
```

**常见问题：**
- 图片加载超时
- 图片格式不支持
- 网络问题

### 6. 调试步骤

#### 步骤1：检查控制台日志
1. 打开浏览器开发者工具
2. 查看Console标签页
3. 检查是否有错误信息
4. 查看调试日志输出

#### 步骤2：检查网络请求
1. 打开Network标签页
2. 刷新页面
3. 查看图片请求是否成功
4. 检查图片响应状态

#### 步骤3：检查DOM结构
1. 在Elements标签页中
2. 查找`.bead-movable`元素
3. 检查是否有`<Image>`标签
4. 验证图片src属性

#### 步骤4：测试基本功能
1. 查看是否显示测试珠子（红色圆圈）
2. 尝试拖拽测试珠子
3. 检查MovableArea是否正常工作

### 7. 常见解决方案

#### 方案1：修复图片路径
```typescript
// 确保图片URL完整
const imageUrl = bead.image_url.startsWith('http') 
  ? bead.image_url 
  : `https://your-domain.com${bead.image_url}`;
```

#### 方案2：添加图片加载状态
```typescript
const [imageLoaded, setImageLoaded] = useState(false);

<Image
  src={bead.imageData || bead.image_url}
  onLoad={() => setImageLoaded(true)}
  onError={() => setImageLoaded(false)}
  style={{
    ...getBeadImageStyle(bead),
    opacity: imageLoaded ? 1 : 0
  }}
/>
```

#### 方案3：使用图片占位符
```typescript
{(bead.imageData || bead.image_url) ? (
  <Image src={bead.imageData || bead.image_url} />
) : (
  <View className="bead-placeholder">
    {bead.id || index}
  </View>
)}
```

### 8. 测试用例

#### 测试1：基本显示
- 启动应用
- 检查控制台日志
- 查看是否有珠子数据
- 验证图片URL有效性

#### 测试2：样式检查
- 检查珠子尺寸
- 验证位置计算
- 确认样式应用

#### 测试3：图片加载
- 检查网络请求
- 验证图片响应
- 测试图片显示

## 联系支持

如果问题仍然存在，请提供以下信息：
1. 控制台错误日志
2. 网络请求状态
3. 珠子数据结构
4. 浏览器环境信息
5. 问题复现步骤
