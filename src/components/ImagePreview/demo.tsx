import React, { useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import PreviewImage from '../PreviewImage';
import ImagePreview from './index';

const ImagePreviewDemo: React.FC = () => {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 示例图片数组
  const sampleImages = [
    'https://picsum.photos/400/300?random=1',
    'https://picsum.photos/400/300?random=2',
    'https://picsum.photos/400/300?random=3',
    'https://picsum.photos/400/300?random=4',
  ];

  const handleImageClick = (index: number) => {
    setCurrentIndex(index);
    setPreviewVisible(true);
  };

  return (
    <View style={{ padding: '20px' }}>
      <Text style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
        图片预览组件演示
      </Text>

      {/* 单张图片预览 */}
      <View style={{ marginBottom: '30px' }}>
        <Text style={{ fontSize: '16px', marginBottom: '10px' }}>单张图片预览：</Text>
        <PreviewImage
          src={sampleImages[0]}
          width={200}
          height={150}
          borderRadius={8}
          previewable={true}
        />
      </View>

      {/* 多张图片预览 */}
      <View style={{ marginBottom: '30px' }}>
        <Text style={{ fontSize: '16px', marginBottom: '10px' }}>多张图片预览：</Text>
        <View style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {sampleImages.map((image, index) => (
            <PreviewImage
              key={index}
              src={image}
              width={100}
              height={100}
              borderRadius={8}
              previewable={true}
              previewImages={sampleImages}
              previewIndex={index}
              onClick={() => handleImageClick(index)}
            />
          ))}
        </View>
      </View>

      {/* 不同样式的图片 */}
      <View style={{ marginBottom: '30px' }}>
        <Text style={{ fontSize: '16px', marginBottom: '10px' }}>不同样式：</Text>
        <View style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <PreviewImage
            src={sampleImages[0]}
            width={80}
            height={80}
            borderRadius={40}
            className="circular"
            previewable={true}
          />
          <PreviewImage
            src={sampleImages[1]}
            width={120}
            height={80}
            borderRadius={4}
            previewable={true}
          />
          <PreviewImage
            src={sampleImages[2]}
            width={80}
            height={120}
            borderRadius={8}
            previewable={true}
          />
        </View>
      </View>

      {/* 禁用预览的图片 */}
      <View style={{ marginBottom: '30px' }}>
        <Text style={{ fontSize: '16px', marginBottom: '10px' }}>禁用预览：</Text>
        <PreviewImage
          src={sampleImages[3]}
          width={150}
          height={100}
          borderRadius={8}
          previewable={false}
        />
      </View>

      {/* 手动触发预览 */}
      <View style={{ marginBottom: '30px' }}>
        <Text style={{ fontSize: '16px', marginBottom: '10px' }}>手动触发预览：</Text>
        <Button
          onClick={() => setPreviewVisible(true)}
          style={{ marginBottom: '10px' }}
        >
          打开图片预览
        </Button>
        <PreviewImage
          src={sampleImages[0]}
          width={200}
          height={150}
          borderRadius={8}
          previewable={false}
        />
      </View>

      {/* 自定义图片预览组件 */}
      <ImagePreview
        visible={previewVisible}
        images={sampleImages}
        initialIndex={currentIndex}
        onClose={() => setPreviewVisible(false)}
      />
    </View>
  );
};

export default ImagePreviewDemo; 