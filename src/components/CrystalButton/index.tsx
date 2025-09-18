import React from 'react';
import { View, Text } from '@tarojs/components';
import './index.scss';

const CrystalButton = ({ onClick , text , prefixIcon, icon, style, isPrimary, textStyle, disabled}: { onClick: () => void, text: string, prefixIcon?: React.ReactNode, icon?: React.ReactNode, style?: React.CSSProperties, isPrimary?: boolean, textStyle?: React.CSSProperties, disabled?: boolean }) => {
  return (
    <View className={`figma-customize-button ${isPrimary ? 'primary' : ''} ${disabled ? 'disabled' : ''} `} onClick={onClick} style={style}>
      {prefixIcon}
      <Text className={`figma-button-text ${isPrimary ? 'primary' : ''}`} style={textStyle}>{text}</Text>
      {icon}
    </View>
  );
};

export default CrystalButton;