import React, { useState } from 'react';
import { View, Image } from '@tarojs/components';
import './styles/HistoryOperation.scss';
import historyBackInactiveIcon from '@/assets/icons/history-back-inactive.svg';
import historyForwardInactiveIcon from '@/assets/icons/history-forward-inactive.svg';
import historyBackActiveIcon from '@/assets/icons/history-back-active.svg';
import historyForwardActiveIcon from '@/assets/icons/history-forward-active.svg';
import getInspiritionIcon from '@/assets/icons/get-inspirition.svg';
import apiSession from '@/utils/api-session';
import Taro from '@tarojs/taro';

interface HistoryOperationsProps {
  canUndo: boolean;
  canRedo: boolean;
  onHistoryBack: () => void;
  onHistoryForward: () => void;
  onDiyInspirationResponse: (data: any) => void;
}

const HistoryOperations: React.FC<HistoryOperationsProps> = ({
  canUndo,
  canRedo,
  onHistoryBack,
  onHistoryForward,
  onDiyInspirationResponse,
}) => {
  const [inspirationLoading, setInspirationLoading] = useState(false);

  const getDiyInspiration = () => {
    if (inspirationLoading) return;
    Taro.reportEvent("diy_event", {
      click_inspirition: 1
    })
    setInspirationLoading(true);
    apiSession.getDiyInspiration().then(res => {
      onDiyInspirationResponse(res?.data?.items);
      setInspirationLoading(false);
    }).catch(err => {
      Taro.showToast({
        title: err.message,
        icon: 'error',
      });
      setInspirationLoading(false);
    });
  };
  return (
    <View className="history-operation-container" onClick={e => e.stopPropagation()}>
        <View className="history-operation-item" onTouchStart={canUndo ? onHistoryBack : undefined}>
            <Image src={canUndo ? historyBackActiveIcon : historyBackInactiveIcon} style={{ width: '16px', height: '14px' }} />
            <View className="history-operation-item-text">撤销</View>
        </View>
        <View className="history-operation-item" onTouchStart={canRedo ? onHistoryForward : undefined} style={{ marginTop: '8px' }}>
            <Image src={canRedo ? historyForwardActiveIcon : historyForwardInactiveIcon} style={{ width: '16px', height: '14px' }} />
            <View className="history-operation-item-text">恢复</View>
        </View>
        <View className="history-operation-item" onClick={getDiyInspiration} style={{ opacity: inspirationLoading ? 0.5 : 1, marginTop: '16px' }}>
            <Image src={getInspiritionIcon} style={{ width: '20px', height: '20px' }} />
            <View className="history-operation-item-text" style={{ color: '#574A3A' }}>灵感</View>
        </View>
    </View>
  );
};

export default HistoryOperations;
