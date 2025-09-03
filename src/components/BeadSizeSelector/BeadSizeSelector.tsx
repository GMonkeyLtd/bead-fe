import React from 'react';
import { View, Text } from '@tarojs/components';
import { BEADS_LIST } from '@/config/beads';
import './BeadSizeSelector.scss';

export interface BeadSizeSelectorProps {
  /** 当前选中的尺寸 */
  value?: number;
  /** 可选的尺寸列表，默认使用配置文件中的BEADS_LIST */
  options?: number[];
  /** 尺寸改变时的回调 */
  onChange?: (size: number) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
}

const BeadSizeSelector: React.FC<BeadSizeSelectorProps> = ({
  value,
  options = BEADS_LIST,
  onChange,
  disabled = false,
  className = '',
}) => {
  const handleSizeSelect = (size: number) => {
    console.log('BeadSizeSelector clicked:', size);
    if (disabled || size === value) return;
    onChange?.(size);
  };

  return (
    <View className={`bead-size-selector ${className}`}>
      {options.map((size, index) => {
        const isSelected = size === value;
        const isFirst = index === 0;
        const isLast = index === options.length - 1;
        
        return (
          <View
            key={size}
            className={`
              bead-size-option 
              ${isSelected ? 'selected' : ''} 
              ${disabled ? 'disabled' : ''}
              ${isFirst ? 'first' : ''}
              ${isLast ? 'last' : ''}
            `}
            onClick={(e) => {
              e.stopPropagation();
              handleSizeSelect(size);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
          >
            <Text className="bead-size-text">{size}</Text>
          </View>
        );
      })}
    </View>
  );
};

export default BeadSizeSelector;
