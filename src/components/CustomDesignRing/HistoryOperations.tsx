import React from 'react';
import { View, Image } from '@tarojs/components';
import './styles/HistoryOperation.scss';
import historyBackInactiveIcon from '@/assets/icons/history-back-inactive.svg';
import historyForwardInactiveIcon from '@/assets/icons/history-forward-inactive.svg';
import historyBackActiveIcon from '@/assets/icons/history-back-active.svg';
import historyForwardActiveIcon from '@/assets/icons/history-forward-active.svg';

interface HistoryOperationsProps {
  canUndo: boolean;
  canRedo: boolean;
  onHistoryBack: () => void;
  onHistoryForward: () => void;
}

const HistoryOperations: React.FC<HistoryOperationsProps> = ({
  canUndo,
  canRedo,
  onHistoryBack,
  onHistoryForward,
}) => {


  return (
    <View className="history-operation-container" onClick={e => e.stopPropagation()}>
        <View className="history-operation-item" onTouchStart={canUndo ? onHistoryBack : undefined}>
            <Image src={canUndo ? historyBackActiveIcon : historyBackInactiveIcon} style={{ width: '20px', height: '20px' }} />
        </View>
        <View className="history-operation-item" onTouchStart={canRedo ? onHistoryForward : undefined}>
            <Image src={canRedo ? historyForwardActiveIcon : historyForwardInactiveIcon} style={{ width: '20px', height: '20px' }} />
        </View>
    </View>
  );
};

export default HistoryOperations;
