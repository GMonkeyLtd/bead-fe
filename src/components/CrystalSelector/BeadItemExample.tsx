import React from 'react';
import { View } from '@tarojs/components';
import BeadItem from './BeadItem';

/**
 * BeadItem 组件使用示例
 * 展示如何使用新创建的珠子item卡片组件
 */
const BeadItemExample: React.FC = () => {
  const handleReplaceClick = () => {
    console.log('替换珠子');
  };

  const handleAddClick = () => {
    console.log('添加珠子');
  };

  const handleItemClick = () => {
    console.log('点击珠子卡片');
  };

  return (
    <View style={{ padding: '16px', gap: '12px', display: 'flex', flexDirection: 'column' }}>
      {/* 基础用法 - 只显示添加按钮 */}
      <BeadItem
        imageUrl="/path/to/crystal-image.jpg"
        name="白水晶"
        specifications="8, 10, 12, 14, 15, 16mm"
        onAddClick={handleAddClick}
        onItemClick={handleItemClick}
      />

      {/* 显示替换和添加按钮 */}
      <BeadItem
        imageUrl="/path/to/crystal-image.jpg"
        name="白水晶"
        specifications="8, 10, 12, 14, 15, 16mm"
        showReplaceButton={true}
        showAddButton={true}
        onReplaceClick={handleReplaceClick}
        onAddClick={handleAddClick}
        onItemClick={handleItemClick}
      />

      {/* 只显示替换按钮 */}
      <BeadItem
        imageUrl="/path/to/crystal-image.jpg"
        name="白水晶"
        specifications="8, 10, 12, 14, 15, 16mm"
        showReplaceButton={true}
        showAddButton={false}
        onReplaceClick={handleReplaceClick}
        onItemClick={handleItemClick}
      />
    </View>
  );
};

export default BeadItemExample;
