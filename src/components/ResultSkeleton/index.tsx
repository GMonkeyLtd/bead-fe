import React from 'react';
import { View } from '@tarojs/components';
import './index.scss';

const ResultSkeleton: React.FC = () => {
  return (
    <View className="result-skeleton">
      <View className="inner-frame">
        <View className="column-frame">
          <View className="top-frame">
            <View className="round-frame"></View>
            <View className="small-frames">
              <View className="small-round-frame"></View>
            </View>
          </View>
          <View className="bottom-frame"></View>
        </View>
        <View className="group-frame">
          <View className="ellipse"></View>
        </View>
      </View>
    </View>
  );
};

export default ResultSkeleton;