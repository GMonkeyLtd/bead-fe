import React from 'react';
import { View } from '@tarojs/components';
import BraceletList from '@/components/BraceletList';
import './index.scss';

const BraceletListPage: React.FC = () => {
  // 模拟手串商品数据
  const braceletItems = [
    {
      id: '1',
      name: '竹林池畔',
      number: 'NO.0001',
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop&crop=center',
      rating: 5
    },
    {
      id: '2',
      name: '冰雪奇缘',
      number: 'NO.0024',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center',
      rating: 5
    },
    {
      id: '3',
      name: '一叶菩提',
      number: 'NO.0024',
      image: 'https://images.unsplash.com/photo-1518135714426-c18f5ffb6f4d?w=400&h=400&fit=crop&crop=center',
      rating: 5
    },
    {
      id: '4',
      name: '黄金万两',
      number: 'NO.0024',
      image: 'https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?w=400&h=400&fit=crop&crop=center',
      rating: 5
    },
    {
      id: '5',
      name: '橙红玉石',
      number: 'NO.0024',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center',
      rating: 5
    },
    {
      id: '6',
      name: '粉雾星河',
      number: 'NO.0024',
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop&crop=center',
      rating: 5
    },
    {
      id: '7',
      name: '冰雪奇缘',
      number: 'NO.0024',
      image: 'https://images.unsplash.com/photo-1518135714426-c18f5ffb6f4d?w=400&h=400&fit=crop&crop=center',
      rating: 5
    },
    {
      id: '8',
      name: '冰雪奇缘',
      number: 'NO.0024',
      image: 'https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?w=400&h=400&fit=crop&crop=center',
      rating: 5
    }
  ];

  const handleItemClick = (item: any) => {
    console.log('点击了手串:', item);
    // 这里可以跳转到详情页面
  };

  return (
      <View className="bracelet-list-page">
        <View className="page-header">
          <View className="page-title">手串商品</View>
        </View>
        <View className="page-content">
          <BraceletList 
            items={braceletItems}
            onItemClick={handleItemClick}
          />
        </View>
      </View>
  );
};

export default BraceletListPage; 