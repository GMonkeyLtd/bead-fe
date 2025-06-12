import React from 'react';
import { View, Image } from '@tarojs/components';
import { ICON_URLS } from '@/utils/svgUtils';
import './index.scss';

export interface IconButtonProps {
  icon: keyof typeof ICON_URLS | string; // 内置图标名称或自定义图标URL
  size?: number; // 图标大小
  color?: string; // 图标颜色
  type?: 'primary' | 'default' | 'warn'; // 按钮类型
  disabled?: boolean; // 是否禁用
  loading?: boolean; // 是否加载中
  circle?: boolean; // 是否为圆形按钮
  className?: string; // 自定义样式类
  onClick?: () => void; // 点击事件
  children?: React.ReactNode; // 按钮文本
}

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = 20,
  color,
  type = 'default',
  disabled = false,
  loading = false,
  circle = false,
  className = '',
  onClick,
  children
}) => {
  // 获取图标URL
  const getIconUrl = (): string => {
    if (typeof icon === 'string' && icon.startsWith('data:') || icon.startsWith('http')) {
      // 自定义图标URL
      return icon;
    } else if (icon in ICON_URLS) {
      // 内置图标
      return ICON_URLS[icon as keyof typeof ICON_URLS](size, color);
    } else {
      // 找不到图标，返回默认图标
      return ICON_URLS.close(size, color);
    }
  };

  const iconUrl = loading ? ICON_URLS.loading(size, color || '#999') : getIconUrl();

  return (
    <View
      className={`icon-button ${className}`}
    //   disabled={disabled || loading}
      onClick={onClick}
    >
      <Image 
        src={iconUrl} 
        // className={`icon ${loading ? 'rotating' : ''}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      />
      {children && <span className="button-text">{children}</span>}
    </View>
  );
};

export default IconButton; 