import React from 'react';
import { View, Text } from '@tarojs/components';
import './index.scss';

// BEM 命名规范示例组件
const BEMExample: React.FC = () => {
  return (
    <View className="bem-example">
      <Text className="bem-example__title">BEM 命名规范示例</Text>
      <View className="bem-example__card bem-example__card--primary">
        <Text className="bem-example__card-text">这是一个使用 BEM 命名的卡片</Text>
        <View className="bem-example__button bem-example__button--active">
          <Text className="bem-example__button-text">按钮</Text>
        </View>
      </View>
    </View>
  );
};

export default BEMExample; 