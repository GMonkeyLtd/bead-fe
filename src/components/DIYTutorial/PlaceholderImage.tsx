import React from 'react';
import { View, Text } from '@tarojs/components';

interface PlaceholderImageProps {
  width?: number;
  height?: number;
  text?: string;
  backgroundColor?: string;
  textColor?: string;
  className?: string;
}

const PlaceholderImage: React.FC<PlaceholderImageProps> = ({
  width = 300,
  height = 200,
  text = '教程图片',
  backgroundColor = '#f0f0f0',
  textColor = '#666',
  className = ''
}) => {
  const style = {
    width: `${width}px`,
    height: `${height}px`,
    backgroundColor,
    color: textColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    border: '2px dashed #ddd',
    fontSize: '16px',
    fontWeight: '500'
  };

  return (
    <View className={`placeholder-image ${className}`} style={style}>
      <Text>{text}</Text>
    </View>
  );
};

export default PlaceholderImage;
