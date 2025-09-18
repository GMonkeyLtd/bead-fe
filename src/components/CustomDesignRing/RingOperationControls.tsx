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
  enableRotate: boolean;
}

const RingOperationControls: React.FC<RingOperationControlsProps> = ({
  selectedBeadIndex,
  onClockwiseMove,
  onCounterclockwiseMove,
  onDelete,
  enableRotate,
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
      {isSelected && (
        <View className={`operation-section`} onClick={handleDelete} style={{ backgroundColor: '#fff', borderRadius: '50%', width: '36px', height: '36px' }}>
          <View className="operation-icon">
            <Image src={removeBeadIcon} style={{ width: '20px', height: '20px' }} />
          </View>
          {/* <Text className="operation-text">移除</Text> */}
        </View>
      )}
      {((enableRotate || isSelected) && <View className="operation-group-container">
        <View className="operation-bottom-container">
          <View className="operation-section" onClick={handleCounterclockwiseMove}>
            <View className="operation-icon">
              <Image src={isSelected ? counterClockWiseIcon : backwardRotateIcon} style={{ width: '20px', height: '20px' }} />
            </View>
            {/* <Text className="operation-text">{isSelected ? '反向移动' : '反向旋转'}</Text> */}
          </View>
          <View className="operation-section-divider"></View>
          <View className="operation-section" onClick={handleClockwiseMove}>
            <View className="operation-icon">
              <Image src={isSelected ? clockWiseIcon : forwardRotateIcon} style={{ width: '20px', height: '20px' }} />
            </View>
          </View>
        </View>
        <Text className="operation-text">{isSelected ? '移动位置' : '旋转手串'}</Text>
      </View>)}
    </View>
  );
};

export default RingOperationControls;
