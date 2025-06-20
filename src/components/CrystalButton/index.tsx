import React from 'react';
import { View, Text } from '@tarojs/components';
import './index.scss';

const CrystalButton = ({ onClick , text , icon, style }: { onClick: () => void, text: string, icon?: React.ReactNode, style?: React.CSSProperties }) => {
  return (
    <View className="figma-customize-button" onClick={onClick} style={style}>
      <Text className="figma-button-text">{text}</Text>
      {icon}
    </View>
  );
};

export default CrystalButton;