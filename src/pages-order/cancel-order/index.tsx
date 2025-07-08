import React, { useState, useEffect } from 'react';
import { View, Text, Textarea, Image } from '@tarojs/components';
import Taro, { showToast, chooseImage, getCurrentInstance } from '@tarojs/taro';
import './index.scss';
import api from '@/utils/api-merchant';
import PageContainer from '@/components/PageContainer';
import CrystalButton from '@/components/CrystalButton';

interface OrderInfo {
  id: string;
  orderNo: string;
  price: number;
}

const CancelOrderPage: React.FC = () => {
  const [reason, setReason] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);

  // 获取页面参数
  useEffect(() => {
    const instance = getCurrentInstance();
    const params = instance.router?.params;
    
    if (params) {
      const { orderId, orderNo, price } = params;
      if (orderId && orderNo && price) {
        setOrderInfo({
          id: orderId,
          orderNo: orderNo,
          price: parseFloat(price)
        });
      } else {
        showToast({
          title: '订单信息不完整',
          icon: 'none',
        });
        setTimeout(() => {
          Taro.navigateBack();
        }, 1500);
      }
    }
  }, []);

  // 选择图片
  const handleChooseImage = async () => {
    try {
      const res = await chooseImage({
        count: 3 - images.length, // 最多上传3张图片
        sizeType: ['compressed'], // 使用压缩图
        sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机
      });

      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        setImages(prev => [...prev, ...res.tempFilePaths]);
      }
    } catch (error) {
      console.error('选择图片失败:', error);
      showToast({
        title: '选择图片失败',
        icon: 'none',
      });
    }
  };

  // 删除图片
  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // 处理取消原因输入
  const handleReasonChange = (e: any) => {
    setReason(e.detail.value);
  };

  // 确认取消订单
  const handleConfirm = async () => {
    if (!reason.trim()) {
      showToast({
        title: '请填写取消原因',
        icon: 'none',
      });
      return;
    }

    if (reason.trim().length < 5) {
      showToast({
        title: '取消原因不能少于5个字',
        icon: 'none',
      });
      return;
    }

    if (!orderInfo) {
      showToast({
        title: '订单信息错误',
        icon: 'none',
      });
      return;
    }

    setLoading(true);

    try {
      // TODO: 这里后续可以上传图片到服务器并记录取消原因
      console.log("取消原因:", reason);
      console.log("上传图片:", images);
      
      const result = await api.user.cancelOrder(orderInfo.id);
      
      if (result.code === 200) {
        showToast({
          title: "取消订单成功",
          icon: "success",
        });
        
        // 延迟返回上一页
        setTimeout(() => {
          Taro.navigateBack();
        }, 1500);
      } else {
        showToast({
          title: result.message || "取消订单失败",
          icon: "none",
        });
      }
    } catch (error) {
      console.error("取消订单失败:", error);
      showToast({
        title: "取消订单失败",
        icon: "none",
      });
    } finally {
      setLoading(false);
    }
  };

  // 返回上一页
  const handleBack = () => {
    Taro.navigateBack();
  };

  if (!orderInfo) {
    return (
      <PageContainer>
        <View className="loading-container">
          <Text>加载中...</Text>
        </View>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <View className="cancel-order-page">
        {/* 订单信息 */}
        <View className="order-info-section">
          <View className="order-info-card">
            <View className="order-info-row">
              <Text className="label">订单号：</Text>
              <Text className="value">{orderInfo.orderNo}</Text>
            </View>
            <View className="order-info-row">
              <Text className="label">订单金额：</Text>
              <Text className="value price">¥{orderInfo.price.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* 取消原因输入 */}
        <View className="reason-section">
          <View className="section-header">
            <Text className="section-title">取消原因 *</Text>
          </View>
          <View className="reason-card">
            <Textarea
              className="reason-textarea"
              value={reason}
              onInput={handleReasonChange}
              placeholder="请详细说明取消订单的原因（不少于5个字）"
              maxlength={200}
              showConfirmBar={false}
              disableDefaultPadding
            />
            <Text className="char-count">{reason.length}/200</Text>
          </View>
        </View>

        {/* 图片上传区域 */}
        <View className="image-section">
          <View className="section-header">
            <Text className="section-title">上传图片（可选）</Text>
            <Text className="section-subtitle">最多可上传3张图片，支持订单相关截图或说明图片</Text>
          </View>
          
          <View className="image-card">
            <View className="image-list">
              {images.map((image, index) => (
                <View key={index} className="image-item">
                  <Image
                    src={image}
                    className="uploaded-image"
                    mode="aspectFill"
                  />
                  <View
                    className="remove-image-btn"
                    onClick={() => handleRemoveImage(index)}
                  >
                    ×
                  </View>
                </View>
              ))}
              
              {images.length < 3 && (
                <View className="add-image-btn" onClick={handleChooseImage}>
                  <Text className="add-image-text">+</Text>
                  <Text className="add-image-label">添加图片</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* 底部按钮区域 */}
        <View className="bottom-actions">
          <View className="button-group">
            <CrystalButton
              text="取消"
              onClick={handleBack}
              isPrimary={false}
              style={{ 
                flex: 1, 
                marginRight: '12px',
                background: '#f5f5f5',
                color: '#666'
              }}
            />
            <CrystalButton
              text={loading ? "处理中..." : "确认取消订单"}
              onClick={loading ? () => {} : handleConfirm}
              isPrimary={true}
              style={{ 
                flex: 2,
                opacity: loading ? 0.6 : 1,
                pointerEvents: loading ? 'none' : 'auto'
              }}
            />
          </View>
        </View>
      </View>
    </PageContainer>
  );
};

export default CancelOrderPage; 