import React, { useState } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import './index.scss';
import Taro from '@tarojs/taro';
import copyIcon from '@/assets/icons/copy.svg';
import closeIcon from '@/assets/icons/close.svg';
import eyeCloseIcon from '@/assets/icons/eye-close.svg';
import eyeOpenIcon from '@/assets/icons/eye-open.svg';

interface MaterialItem {
  name: string;
  spec: string;
  quantity: string;
  costPrice: number;
  referencePrice: number;
}

interface BeadOrderDialogProps {
  visible: boolean;
  orderNumber: string;
  productName: string;
  productCode: string;
  budget: string;
  productImage: string;
  materials: MaterialItem[];
  realImages: string[];
  certificateImages: string[];
  onClose: () => void;
  onConfirm: () => void;
  wristSize: string;
}

const BeadOrderDialog: React.FC<BeadOrderDialogProps> = ({
  visible,
  orderNumber,
  productName,
  productCode,
  realImages,
  certificateImages,
  budget,
  productImage,
  materials,
  onClose,
  onConfirm,
  wristSize,
}) => {
  const [showBeadPrice, setShowBeadPrice] = useState(false);
  if (!visible) {
    return null;
  }
  const handleCopyOrderNumber = (orderNumber: string) => {
    Taro.setClipboardData({
      data: orderNumber,
    })
  }

  const handleDialogClick = (e: any) => {
    e.stopPropagation();
  }

  return (
    <View className='bead-order-dialog-overlay' onClick={onClose}>
      <View className='bead-order-dialog' onClick={handleDialogClick}>
        {/* 头部 */}
        <View className='bead-order-dialog-header'>
          <View className='order-dialog-info' onClick={() => handleCopyOrderNumber(orderNumber)}>
            <Text className='order-number'>订单号：{orderNumber}</Text>
            <View className='copy-icon'>
              <Image src={copyIcon} mode='aspectFit' style={{ width: '16px', height: '16px' }} />
            </View>
          </View>
          <View className='close-btn' onClick={onClose}>
            <Image src={closeIcon} mode='aspectFit' style={{ width: '20px', height: '20px' }} />
          </View>
        </View>

        {/* 分割线 */}
        <View className='divider'></View>

        {/* 产品信息 */}
        <View className='product-section'>
          <View className='product-main'>
            <Image className='product-image' src={productImage} mode='aspectFill' onClick={() => {
              Taro.previewImage({
                current: productImage,
                urls: [productImage],
              });
            }} />
            <View className='product-details'>
              <Text className='product-name'>{productName}</Text>
              <Text className='product-code'>{`设计编号：${productCode}`}</Text>
            </View>
          </View>
          <View className='budget-info'>
            <View className='budget-info-content' onClick={() => setShowBeadPrice(!showBeadPrice)}>
              <Text className='budget-text'>价格：{budget}</Text>
              <Image src={showBeadPrice ? eyeOpenIcon : eyeCloseIcon} mode='aspectFit' style={{ width: '16px', height: '16px' }} />
            </View>
          </View>
        </View>
        <View className='wrist-info'>
          <Text className='wrist-text'>预估手围：{wristSize}cm</Text>
        </View>

        {/* 材料清单 */}
        <View className='materials-section'>
          {/* 表头 */}
          <View className='materials-header'>
            <Text className='header-name'>名称</Text>
            <Text className='header-spec'>尺寸/规格</Text>
            <Text className='header-quantity'>数量</Text>
            {showBeadPrice && <Text className='header-price'>成本价</Text>}
            {showBeadPrice && <Text className='header-price'>参考价</Text>} 
          </View>

          {/* 材料列表 */}
          <View className='materials-list'>
            {materials.map((material, index) => (
              <View
                key={index}
                className={`material-row ${index % 2 === 0 ? 'even' : 'odd'}`}
              >
                <Text className='material-name'>{material.name}</Text>
                <Text className='material-spec'>{material.spec}</Text>
                <Text className='material-quantity'>{material.quantity}</Text>
                {showBeadPrice && <Text className='material-price'>{material.costPrice}</Text>}
                {showBeadPrice && <Text className='material-price'>{material.referencePrice}</Text>}
              </View>
            ))}
          </View>
        </View>

        {/* 分割线 */}
        <View className='divider'></View>
        <ScrollView scrollY style={{ maxHeight: '320px' }}>
          {realImages.length > 0 && (<View className="order-detail-images-section">
            <View className="order-detail-section-header">
              <Text className="order-detail-section-title">实拍图</Text>
            </View>

            <View className="order-detail-images-container">
              <View className="order-detail-images-grid">
                {realImages.map((image, index) => (
                  <View key={index} className="order-detail-image-item">
                    <Image
                      src={image}
                      className="order-detail-uploaded-image"
                      mode="aspectFill"
                      onClick={() => {
                        Taro.previewImage({
                          current: image,
                          urls: [image],
                        });
                      }}
                    />
                  </View>
                ))}

              </View>
            </View>
          </View>)}
          {
            certificateImages.length > 0 && (
              <View className="order-detail-images-section">
                <View className="order-detail-section-header">
                  <Text className="order-detail-section-title">证书图</Text>
                </View>

                <View className="order-detail-images-container">
                  <View className="order-detail-images-grid">
                    {certificateImages.map((image, index) => (
                      <View key={index} className="order-detail-image-item">
                        <Image
                          src={image}
                          className="order-detail-uploaded-image"
                          mode="aspectFill"
                          onClick={() => {
                            Taro.previewImage({
                              current: image,
                              urls: [image],
                            });
                          }}
                        />
                      </View>
                    ))}

                  </View>
                </View>
              </View>
            )}
        </ScrollView>

        {/* 底部按钮 */}
        {/* <View className='bead-order-dialog-footer'>
          <View className='confirm-btn' onClick={onClose}>
            <Text className='confirm-text'>关闭</Text>
          </View>
        </View> */}
      </View>
    </View>
  );
};

export default BeadOrderDialog; 