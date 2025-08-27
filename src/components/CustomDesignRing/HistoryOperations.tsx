import React from 'react';
import { View, Image } from '@tarojs/components';
import './styles/HistoryOperation.scss';
import historyBackInactiveIcon from '@/assets/icons/history-back-inactive.svg';
import historyForwardInactiveIcon from '@/assets/icons/history-forward-inactive.svg';
import historyBackActiveIcon from '@/assets/icons/history-back-active.svg';
import historyForwardActiveIcon from '@/assets/icons/history-forward-active.svg';

interface HistoryOperationsProps {
  historyLenght: number;
  currentIndex: number;
  onHistoryBack: () => void;
  onHistoryForward: () => void;
}

const HistoryOperations: React.FC<HistoryOperationsProps> = ({
  historyLenght,
  currentIndex,
  onHistoryBack,
  onHistoryForward,
}) => {


  return (
    <View className="history-operation-container" onClick={e => e.stopPropagation()}>
        <View className="history-operation-item">
            <Image src={currentIndex === 0 ? historyBackInactiveIcon : historyBackActiveIcon} style={{ width: '15px', height: '12px' }} />
        </View>
        <View className="history-operation-item">
            <Image src={currentIndex === historyLenght - 1 ? historyForwardInactiveIcon : historyForwardActiveIcon} style={{ width: '15px', height: '12px' }} />
        </View>
    </View>
  );
};

export default HistoryOperations;
