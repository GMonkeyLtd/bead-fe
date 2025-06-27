# UserInfoCard 用户信息展示组件

基于 WeUI 社区设计规范开发的用户信息展示组件，支持显示用户头像、姓名、标语和操作按钮。

## 功能特性

- 圆形头像显示，带白色边框
- 用户姓名和标语展示
- 可配置的操作按钮
- 响应式设计，适配移动端
- 支持点击事件处理

## 使用方法

```tsx
import UserInfoCard from "@/components/UserInfoCard";

<UserInfoCard
  userName="温酒大人"
  userSlogan="璞光集，好运气" 
  avatar="https://example.com/avatar.jpg"
  actionText="商家后台"
  onActionClick={() => console.log("点击了操作按钮")}
  showAction={true}
/>
```

## 属性说明

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| userName | string | 是 | - | 用户姓名 |
| userSlogan | string | 是 | - | 用户标语/简介 |
| avatar | string | 是 | - | 用户头像URL |
| actionText | string | 否 | "商家后台" | 操作按钮文本 |
| onActionClick | () => void | 否 | - | 操作按钮点击事件 |
| showAction | boolean | 否 | true | 是否显示操作按钮 |

## 样式特点

- 整体宽度：345px
- 头像尺寸：60px × 60px，圆形，白色边框
- 字体：姓名使用思源宋体，标语使用思源黑体
- 操作按钮：圆角按钮，带渐变边框和阴影效果
- 响应式布局，适配移动端显示

## 设计来源

本组件基于 [WeUI Community Figma 设计](https://www.figma.com/design/M8DZiLE4FoZNRbA0AkmUWb/WeUI--Community-?node-id=13602-956&m=dev) 开发，严格按照设计规范实现样式和交互。 