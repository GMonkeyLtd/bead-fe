import React, { useCallback } from 'react';
import { View, Text, Image } from '@tarojs/components';
import './styles/RingOperationControls.scss';
import clockWiseIcon from '@/assets/icons/clockwise.svg';
import counterClockWiseIcon from '@/assets/icons/counterclockwise.svg';
import forwardRotateIcon from '@/assets/icons/forward-rotate.svg';
import backwardRotateIcon from '@/assets/icons/backward-rotate.svg';
import removeBeadIcon from '@/assets/icons/remove-bead.svg';

interface RingOperationControlsProps {
  selectedBeadIndex: number;
  onClockwiseMove: () => void;
  onCounterclockwiseMove: () => void;
  onDelete: () => void;
}

const RingOperationControls: React.FC<RingOperationControlsProps> = ({
  selectedBeadIndex,
  onClockwiseMove,
  onCounterclockwiseMove,
  onDelete,
}) => {
  const isSelected = selectedBeadIndex !== -1;
  const handleClockwiseMove = useCallback(() => {
    onClockwiseMove();
  }, [selectedBeadIndex, onClockwiseMove]);

  const handleCounterclockwiseMove = useCallback(() => {
    onCounterclockwiseMove();
  }, [selectedBeadIndex, onCounterclockwiseMove]);

  const handleDelete = useCallback(() => {
    onDelete();
  }, [selectedBeadIndex, onDelete]);

  return (
    <View className="ring-operation-controls" onClick={e => e.stopPropagation()}>
      {/* 顶部操作区域 - 右移 */}
      <View className="operation-section" onClick={handleClockwiseMove}>
        <View className="operation-icon">
          <Image src={isSelected ? clockWiseIcon : forwardRotateIcon} style={{ width: '20px', height: '20px' }} />
        </View>
        <Text className="operation-text">{isSelected ? '正向移动' : '正向旋转'}</Text>
      </View>


      {/* 中间操作区域 - 左移 */}
      <View className="operation-section" onClick={handleCounterclockwiseMove}>
        <View className="operation-icon">
          <Image src={isSelected ? counterClockWiseIcon : backwardRotateIcon} style={{ width: '20px', height: '20px' }} />
        </View>
        <Text className="operation-text">{isSelected ? '反向移动' : '反向旋转'}</Text>
      </View>


      {/* 底部操作区域 - 删除 */}
      {isSelected && (
        <View className="operation-section" onClick={handleDelete}>
          <View className="operation-icon">
            <Image src={removeBeadIcon} style={{ width: '24px', height: '24px' }} />
          </View>
          <Text className="operation-text">移除</Text>
        </View>
      )}
    </View>
  );
};

export default RingOperationControls;
