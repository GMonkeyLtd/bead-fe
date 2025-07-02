import React, { useState } from 'react';
import { View, Button } from '@tarojs/components';
import BeadOrderDialog from './index';

const BeadOrderDialogDemo: React.FC = () => {
  const [visible, setVisible] = useState(false);

  // 示例数据
  const mockData = {
    orderNumber: 'ADX2333',
    productName: '夏日睡莲',
    productCode: 'NO.0001',
    totalQuantity: '24颗',
    budget: '不限',
    productImage: 'https://via.placeholder.com/72x72/FFB6C1/FFFFFF?text=夏日睡莲',
    materials: [
      {
        name: '水晶弹力线',
        spec: '透明',
        quantity: 'x1',
      },
      {
        name: '粉水晶',
        spec: '8mm',
        quantity: 'x12',
      },
      {
        name: '海蓝宝',
        spec: '8mm',
        quantity: 'x6',
      },
    ],
  };

  const handleClose = () => {
    setVisible(false);
  };

  const handleConfirm = () => {
    console.log('立即抢单');
    // 这里可以添加抢单逻辑
    setVisible(false);
  };

  const showDialog = () => {
    setVisible(true);
  };

  return (
    <View style={{ padding: '20px' }}>
      <Button onClick={showDialog}>显示珠子手串订单弹窗</Button>
      
      <BeadOrderDialog
        visible={visible}
        orderNumber={mockData.orderNumber}
        productName={mockData.productName}
        productCode={mockData.productCode}
        totalQuantity={mockData.totalQuantity}
        budget={mockData.budget}
        productImage={mockData.productImage}
        materials={mockData.materials}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
    </View>
  );
};

export default BeadOrderDialogDemo; 