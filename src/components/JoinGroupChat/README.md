# JoinGroupChat 加入群聊组件

基于Figma设计稿开发的加入群聊组件，支持显示群聊信息、功能列表和二维码弹窗。

## 功能特性

- 🎨 完全按照Figma设计稿实现
- 👥 显示群聊成员头像
- 🎁 展示群聊功能特色（专属优惠、交流、咨询）
- 📱 点击"立即加入"显示二维码弹窗
- ✨ 精美的渐变和阴影效果
- 📱 响应式设计，适配移动端

## 使用方法

### 基础用法

```tsx
import React, { useState } from "react";
import JoinGroupChat from "@/components/JoinGroupChat";

const MyComponent = () => {
  const [showJoinGroup, setShowJoinGroup] = useState(false);

  const groupInfo = {
    name: "瑶光记·水晶手串 达人交流群",
    memberAvatars: [
      "/path/to/avatar1.png",
      "/path/to/avatar2.png",
      "/path/to/avatar3.png"
    ],
    qrCodeUrl: "/path/to/qrcode.png"
  };

  return (
    <div>
      <button onClick={() => setShowJoinGroup(true)}>
        加入群聊
      </button>
      
      <JoinGroupChat
        visible={showJoinGroup}
        onClose={() => setShowJoinGroup(false)}
        groupInfo={groupInfo}
      />
    </div>
  );
};
```

### 组件属性

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `visible` | `boolean` | ✅ | - | 控制组件显示/隐藏 |
| `onClose` | `() => void` | ✅ | - | 关闭弹窗的回调函数 |
| `groupInfo` | `GroupInfo` | ❌ | 默认群聊信息 | 群聊信息配置 |

### GroupInfo 类型定义

```tsx
interface GroupInfo {
  name: string;           // 群聊名称
  memberAvatars?: string[]; // 成员头像数组
  qrCodeUrl?: string;     // 二维码图片URL
}
```

## 样式特点

- **设计风格**: 采用水晶质感设计，符合品牌调性
- **颜色方案**: 使用渐变色彩，营造高级感
- **交互效果**: 按钮具有按压反馈和光泽效果
- **布局**: 响应式布局，适配不同屏幕尺寸

## 文件结构

```
JoinGroupChat/
├── index.tsx          # 主组件文件
├── index.module.scss  # 样式文件
├── demo.tsx          # 演示文件
└── README.md         # 说明文档
```

## 依赖

- React
- Taro
- SCSS Modules

## 注意事项

1. 确保传入的头像图片路径正确
2. 二维码图片建议使用200x200像素的PNG格式
3. 组件使用了CSS滤镜效果，在某些老旧设备上可能不支持
4. 建议在移动端环境下测试交互效果 