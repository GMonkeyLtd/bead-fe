import React from 'react'
import { View } from '@tarojs/components'
import PromoBanner from './index'

// 使用示例
export const PromoBannerDemo: React.FC = () => {
  const handleBannerClick = () => {
    console.log('促销横幅被点击')
  }

  return (
    <View style={{ padding: '20px' }}>
      <PromoBanner
        currentPrice="¥ 499"
        originalPrice="¥699"
        promoText="同款制作，每日前20名用户享 9折"
        salesCount="120 件"
        onClick={handleBannerClick}
      />
    </View>
  )
}

export default PromoBannerDemo
