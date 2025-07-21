# PageContainer 组件

一个功能完善的小程序页面容器组件，支持动态高度计算、键盘适配、安全区域处理等功能。

## 主要功能

- ✅ 动态计算设备安全区域高度
- ✅ **自动键盘监听和适配**（新增）
- ✅ 支持自定义 Header 内容
- ✅ 性能优化（useMemo 缓存）
- ✅ 完整的 TypeScript 类型支持
- ✅ 错误处理和默认值
- ✅ 可滚动容器支持
- ✅ 灵活的样式配置

## 基础用法

```tsx
import PageContainer from '@/components/PageContainer';

// 基础用法 - 自动处理键盘监听
<PageContainer>
  <View>页面内容</View>
</PageContainer>

// 自定义 Header
<PageContainer 
  headerContent="页面标题"
  headerExtraContent={<Button>操作按钮</Button>}
>
  <View>页面内容</View>
</PageContainer>

// 隐藏 Header
<PageContainer showHeader={false}>
  <View>页面内容</View>
</PageContainer>
```

## 键盘监听功能

### 自动键盘监听（推荐）

```tsx
// 最简单的用法 - 组件会自动监听键盘状态
<PageContainer>
  <View>聊天页面内容</View>
  <Input placeholder="输入消息" />
</PageContainer>

// 监听键盘高度变化
<PageContainer 
  onKeyboardHeightChange={(height) => {
    console.log('键盘高度变化:', height);
  }}
>
  <View>页面内容</View>
</PageContainer>

// 禁用键盘监听
<PageContainer enableKeyboardListener={false}>
  <View>不需要键盘适配的页面</View>
</PageContainer>
```

### 手动键盘高度（兼容旧代码）

```tsx
// 仍然支持手动传入键盘高度（优先级高于自动监听）
const [keyboardHeight, setKeyboardHeight] = useState(0);

useEffect(() => {
  Taro.onKeyboardHeightChange((res) => {
    setKeyboardHeight(res.height);
  });
}, []);

<PageContainer keyboardHeight={keyboardHeight}>
  <View>页面内容</View>
</PageContainer>
```

## 高级用法

```tsx
// 可滚动容器 + 自动键盘监听
<PageContainer 
  scrollable={true}
  backgroundColor="#f5f5f5"
  padding={16}
  onScroll={(e) => console.log('滚动事件', e)}
  onKeyboardHeightChange={(height) => console.log('键盘高度:', height)}
>
  <View>长列表内容</View>
</PageContainer>

// 自定义样式 + 键盘监听
<PageContainer 
  style={{ background: 'linear-gradient(...)' }}
  className="custom-page"
  backgroundColor="#ffffff"
  onKeyboardHeightChange={(height) => {
    // 可以在这里处理键盘高度变化逻辑
    if (height > 0) {
      console.log('键盘弹起');
    } else {
      console.log('键盘收起');
    }
  }}
>
  <View>自定义样式页面</View>
</PageContainer>
```

## Props 说明

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `children` | `React.ReactNode` | - | 页面内容 |
| `isWhite` | `boolean` | `false` | Header 是否为白色主题 |
| `keyboardHeight` | `number` | - | 手动传入的键盘高度（优先级高于自动监听） |
| `headerContent` | `React.ReactNode` | `""` | Header 主要内容 |
| `headerExtraContent` | `React.ReactNode` | `""` | Header 额外内容 |
| `showHeader` | `boolean` | `true` | 是否显示 Header |
| `showBack` | `boolean` | `true` | 是否显示返回按钮 |
| `showHome` | `boolean` | `true` | 是否显示首页按钮 |
| `onBack` | `() => void` | - | 自定义返回事件 |
| `style` | `React.CSSProperties` | `{}` | 容器样式 |
| `className` | `string` | `""` | 容器类名 |
| `scrollable` | `boolean` | `false` | 是否可滚动 |
| `backgroundColor` | `string` | - | 背景色 |
| `padding` | `string \| number` | `"0"` | 内容区域内边距 |
| `onScroll` | `(e: any) => void` | - | 滚动事件 |
| `scrollTop` | `number` | - | 滚动位置 |
| `enableKeyboardListener` | `boolean` | `true` | 是否启用键盘监听 |
| `onKeyboardHeightChange` | `(height: number) => void` | - | 键盘高度变化回调 |

## 优化点

### 1. 性能优化
- 使用 `useMemo` 缓存计算结果，避免每次渲染都重新计算导航栏和安全区域信息
- 只在 `keyboardHeight` 和 `showHeader` 变化时重新计算

### 2. 类型安全
- 完整的 TypeScript 接口定义
- 所有 props 都有明确的类型声明

### 3. 错误处理
- 对设备信息获取失败的情况提供合理的默认值
- 避免因设备信息获取失败导致页面崩溃

### 4. 功能增强
- **内置键盘监听**：无需在业务代码中处理键盘事件
- 支持可滚动容器
- 支持自定义背景色和内边距
- 支持滚动事件监听
- 更好的样式配置选项

### 5. 键盘监听优化
- **自动监听**：组件内部自动处理键盘状态监听
- **手动覆盖**：支持手动传入键盘高度，优先级高于自动监听
- **事件回调**：提供键盘高度变化回调函数
- **开关控制**：可以禁用键盘监听功能
- **内存管理**：组件卸载时自动清理事件监听器

## 注意事项

1. **键盘监听优先级**：手动传入的 `keyboardHeight` 优先级高于自动监听
2. **事件清理**：组件会自动清理键盘监听事件，无需手动处理
3. **性能考虑**：键盘监听只在需要时启用，可以通过 `enableKeyboardListener={false}` 禁用
4. **兼容性**：保持对现有代码的兼容性，可以继续使用手动传入键盘高度的方式

## 使用示例

### 聊天页面（推荐新方式）
```tsx
const ChatPage = () => {
  return (
    <PageContainer 
      headerContent="聊天"
      scrollable={true}
      onKeyboardHeightChange={(height) => {
        console.log('键盘高度变化:', height);
      }}
    >
      <ChatMessages />
      <ChatInput />
    </PageContainer>
  );
};
```

### 表单页面
```tsx
const FormPage = () => {
  return (
    <PageContainer 
      headerContent="填写信息"
      scrollable={true}
      padding={16}
      onKeyboardHeightChange={(height) => {
        if (height > 0) {
          // 键盘弹起时的处理逻辑
          console.log('键盘弹起，高度:', height);
        }
      }}
    >
      <Form>
        <Input placeholder="姓名" />
        <Input placeholder="电话" />
        <Input placeholder="地址" />
      </Form>
    </PageContainer>
  );
};
```

### 列表页面（不需要键盘适配）
```tsx
const ListPage = () => {
  return (
    <PageContainer 
      scrollable={true}
      backgroundColor="#f5f5f5"
      padding={16}
      headerContent="商品列表"
      enableKeyboardListener={false} // 禁用键盘监听
    >
      <ProductList />
    </PageContainer>
  );
};
```

### 兼容旧代码
```tsx
// 如果现有代码已经处理了键盘监听，可以继续使用
const LegacyPage = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  useEffect(() => {
    Taro.onKeyboardHeightChange((res) => {
      setKeyboardHeight(res.height);
    });
  }, []);

  return (
    <PageContainer keyboardHeight={keyboardHeight}>
      <View>页面内容</View>
    </PageContainer>
  );
};
``` 