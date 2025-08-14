# CustomDesignRing 组件

## 功能特性

### 新增拖拽功能

珠子手串DIY组件现在支持拖拽调整珠子位置，让用户可以更灵活地设计手串布局。

#### 使用方法

1. **触摸拖拽**：长按任意珠子，然后拖拽到新位置
2. **自动调整**：拖拽完成后，系统会自动重新计算其他珠子的位置，保持圆环形状
3. **位置限制**：拖拽位置会自动限制在合理范围内，避免珠子重叠或超出边界

#### 技术实现

- **触摸事件处理**：支持 `onTouchStart`、`onTouchMove`、`onTouchEnd` 等触摸事件
- **坐标转换**：自动转换触摸坐标到Canvas坐标系
- **位置计算**：拖拽结束后重新计算所有珠子的位置，保持圆环形状
- **状态管理**：拖拽过程中的状态管理和视觉反馈

#### 组件接口

```typescript
interface RingCanvasRendererProps {
  beads: Position[];
  selectedBeadIndex: number;
  canvasId: string;
  canvasSize: number;
  onBeadSelect: (index: number) => void;
  onBeadDeselect: () => void;
  onBeadDragEnd?: (beadIndex: number, newX: number, newY: number) => void;
  style?: React.CSSProperties;
}
```

#### 新增方法

在 `BeadPositionManager` 类中新增了：

- `dragBeadToPosition(beadIndex: number, newX: number, newY: number)`：处理珠子拖拽到新位置
- `recalculateBeadPositions(beads: Position[])`：重新计算珠子位置以保持圆环形状

#### 视觉反馈

- 拖拽过程中显示"拖拽中..."提示
- 拖拽完成后显示成功提示
- 触摸提示信息指导用户操作

#### 注意事项

1. 拖拽功能仅在触摸设备上有效
2. 拖拽位置会自动限制在合理范围内
3. 拖拽完成后会自动重新计算其他珠子位置
4. 支持触摸取消事件处理

## 原有功能

- 珠子选择和替换
- 珠子添加和删除
- 珠子位置移动（顺时针/逆时针）
- 手围长度预测
- 五行类型支持
- 图片缓存和优化

## 使用示例

```tsx
<CustomDesignRing
  beads={beads}
  wuxing={wuxing}
  canvasId="custom-ring-canvas"
  size={400}
  spacing={2}
  renderRatio={2}
  onOk={handleOk}
  onChange={handleChange}
/>
```

## 依赖

- Taro.js
- React
- Canvas API
- 触摸事件支持
