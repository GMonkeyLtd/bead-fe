# IconButton 图标按钮组件

一个功能强大的图标按钮组件，支持多种图标类型和样式。

## 功能特性

- 🎨 内置常用图标（发送、编辑、删除等）
- 🔧 支持自定义SVG图标
- 🎯 多种按钮类型（primary、default、warn）
- 🔄 加载状态支持
- 📱 响应式设计
- 🎭 圆形按钮支持
- 🎪 旋转动画效果

## 基本使用

```tsx
import IconButton from '@/components/IconButton';

// 基本图标按钮
<IconButton icon="send" onClick={() => console.log('点击发送')} />

// 带文字的按钮
<IconButton icon="edit" type="primary">
  编辑
</IconButton>

// 圆形按钮
<IconButton icon="plus" circle type="primary" />

// 加载状态
<IconButton icon="send" loading />
```

## API

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| icon | `string` | - | 图标名称或自定义图标URL |
| size | `number` | 20 | 图标大小(px) |
| color | `string` | - | 图标颜色 |
| type | `'primary' \| 'default' \| 'warn'` | 'default' | 按钮类型 |
| disabled | `boolean` | false | 是否禁用 |
| loading | `boolean` | false | 是否显示加载状态 |
| circle | `boolean` | false | 是否为圆形按钮 |
| className | `string` | - | 自定义样式类 |
| onClick | `() => void` | - | 点击事件回调 |
| children | `ReactNode` | - | 按钮文本内容 |

### 内置图标

组件内置了以下常用图标：

- `send` - 发送图标
- `edit` - 编辑图标  
- `delete` - 删除图标
- `loading` - 加载图标
- `close` - 关闭图标
- `check` - 选中图标
- `plus` - 加号图标
- `minus` - 减号图标

## 使用示例

### 1. 基本图标按钮

```tsx
// 发送按钮
<IconButton 
  icon="send" 
  type="primary" 
  onClick={handleSend}
/>

// 编辑按钮
<IconButton 
  icon="edit" 
  color="#007AFF"
  onClick={handleEdit}
/>

// 删除按钮
<IconButton 
  icon="delete" 
  type="warn"
  onClick={handleDelete}
/>
```

### 2. 带文字的按钮

```tsx
<IconButton icon="plus" type="primary">
  添加
</IconButton>

<IconButton icon="check" type="primary">
  确认
</IconButton>
```

### 3. 圆形按钮

```tsx
<IconButton 
  icon="send" 
  circle 
  type="primary" 
  size={24}
/>

<IconButton 
  icon="close" 
  circle 
  className="close-btn"
/>
```

### 4. 加载状态

```tsx
<IconButton 
  icon="send" 
  loading={isLoading}
  disabled={isLoading}
  type="primary"
>
  {isLoading ? '发送中...' : '发送'}
</IconButton>
```

### 5. 自定义图标

```tsx
// 使用自定义SVG文件
import customIcon from '@/assets/icons/custom.svg';

<IconButton 
  icon={customIcon}
  size={24}
  onClick={handleCustomAction}
/>

// 使用Base64图标
<IconButton 
  icon="data:image/svg+xml;base64,..."
  size={20}
/>
```

### 6. 响应式尺寸

```tsx
// 小尺寸
<IconButton 
  icon="edit" 
  className="icon-button-small"
/>

// 大尺寸  
<IconButton 
  icon="send" 
  className="icon-button-large"
  type="primary"
/>
```

### 7. 实际应用场景

```tsx
// 聊天发送按钮
<View className="chat-input">
  <Textarea 
    value={message}
    onInput={setMessage}
    placeholder="输入消息..."
  />
  <IconButton
    icon="send"
    type="primary"
    circle
    size={20}
    color="#fff"
    disabled={!message.trim()}
    loading={isSending}
    onClick={handleSendMessage}
  />
</View>

// 工具栏按钮组
<View className="toolbar">
  <IconButton icon="edit" onClick={handleEdit}>编辑</IconButton>
  <IconButton icon="delete" type="warn" onClick={handleDelete}>删除</IconButton>
  <IconButton icon="plus" type="primary" onClick={handleAdd}>添加</IconButton>
</View>
```

## 样式定制

可以通过CSS自定义按钮样式：

```scss
.my-custom-button {
  border-radius: 12rpx;
  box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: translateY(-2rpx);
  }
}
```

## 注意事项

1. **SVG兼容性**: 组件会自动处理SVG转换，确保在小程序中正常显示
2. **性能优化**: 内置图标会缓存，避免重复转换
3. **无障碍访问**: 建议为按钮添加合适的`aria-label`属性
4. **尺寸单位**: 图标大小使用px单位，会自动适配不同设备

## 更多图标

如需添加更多内置图标，可以在 `src/utils/svgUtils.ts` 的 `ICONS` 对象中添加新的SVG字符串。 