import React from 'react';
import { View, Image, Text } from '@tarojs/components';
import './styles/BeadItem.scss';

interface BeadItemProps {
  /** 珠子图片URL */
  imageUrl: string;
  /** 珠子名称 */
  name: string;
  /** 珠子规格，如 "8, 10, 12, 14, 15, 16mm" */
  specifications: string;
  /** 是否显示替换按钮 */
  showReplaceButton?: boolean;
  /** 是否显示添加按钮 */
  showAddButton?: boolean;
  /** 替换按钮点击事件 */
  onReplaceClick?: () => void;
  /** 添加按钮点击事件 */
  onAddClick?: () => void;
  /** 整个卡片点击事件 */
  onItemClick?: () => void;
  /** 自定义样式类名 */
  className?: string;
  /** 是否需要旋转图片 */
  imageNeedRotate?: boolean;
}

const BeadItem: React.FC<BeadItemProps> = ({
  imageUrl,
  name,
  specifications,
  showReplaceButton = false,
  showAddButton = true,
  onReplaceClick,
  onAddClick,
  onItemClick,
  className = '',
  imageNeedRotate = false
}) => {
  const handleReplaceClick = (e: any) => {
    e.stopPropagation();
    onReplaceClick?.();
  };

  const handleAddClick = (e: any) => {
    e.stopPropagation();
    onAddClick?.();
  };

  return (
    <View 
      className={`bead-item-card ${className} ${!showReplaceButton ? 'active' : ''}`}
      onClick={() => onItemClick?.()}
    >
      {/* 主要内容区域 */}
      <View className="bead-item-main">
        {/* 珠子图片 */}
        <View className="bead-item-image">
          <Image 
            src={imageUrl}
            className="bead-image"
            mode="aspectFit"
            style={{ transform: imageNeedRotate ? 'rotate(180deg)' : 'none' }}
          />
        </View>

        {/* 珠子信息 */}
        <View className="bead-item-info">
          <View className="bead-item-header">
            <Text className="bead-item-name">{name}</Text>
          </View>
          <View className="bead-item-specs">
            <Text className="specs-label">规格 :</Text>
            <Text className="specs-value">{specifications}</Text>
          </View>
        </View>
      </View>

      {/* 操作按钮区域 */}
      <View className="bead-item-actions">
        {showReplaceButton && (
          <View 
            className="action-button replace-button"
            onClick={handleReplaceClick}
          >
            <Text className="button-text">替换</Text>
          </View>
        )}
        
        {showAddButton && (
          <View 
            className="action-button add-button"
            onClick={handleAddClick}
          >
            <View className="add-icon">
              <View className="add-icon-plus">
                <View className="plus-horizontal"></View>
                <View className="plus-vertical"></View>
              </View>
            </View>
            <Text className="button-text">添加</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default BeadItem;
