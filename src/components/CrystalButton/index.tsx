import React from 'react';
import { View, Text } from '@tarojs/components';
import './index.scss';

const CrystalButton = ({ onClick , text , prefixIcon, icon, style, isPrimary }: { onClick: () => void, text: string, icon?: React.ReactNode, style?: React.CSSProperties, isPrimary?: boolean }) => {
  return (
    <View className={`figma-customize-button ${isPrimary ? 'primary' : ''}`} onClick={onClick} style={style}>
      {prefixIcon}
      <Text className={`figma-button-text ${isPrimary ? 'primary' : ''}`}>{text}</Text>
      {icon}
    </View>
  );
};

export default CrystalButton;