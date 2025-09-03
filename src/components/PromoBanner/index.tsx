import React from 'react'
import { View, Image } from '@tarojs/components'
import styles from './index.module.scss'
import hotSaleIcon from '@/assets/icons/hot-sale.svg'

interface PromoBannerProps {
  /** 当前价格 */
  currentPrice: number
  /** 原价 */
  originalPrice: number
  /** 促销文案 */
  promoText: string
  /** 折扣文本 */
  discountText: string
  /** 销售数量 */
  salesCount: string
  /** 自定义类名 */
  className?: string
  /** 点击事件 */
  onClick?: () => void
}

export const PromoBanner: React.FC<PromoBannerProps> = ({
  currentPrice,
  originalPrice,
  promoText,
  discountText,
  salesCount,
  className = '',
  onClick
}) => {
  const handleClick = () => {
    onClick?.()
  }

  return (
    <View 
      className={`${styles.promoBanner} ${className}`}
      onClick={handleClick}
    >
      {/* 价格信息区域 */}
      <View className={styles.priceSection}>
        <View className={styles.priceInfo}>
          <View className={styles.pricePrefix}>¥</View>
          <View className={styles.currentPrice}>{currentPrice}</View>
          <View className={styles.divider}></View>
          <View className={styles.originalPrice}>优惠前 ¥{originalPrice}</View>
        </View>
        
        {/* 促销标签 */}
        <View className={styles.promoTag}>
          <Image src={hotSaleIcon} mode="widthFix" style={{ width: "16px", height: "16px" }} />
          <View className={styles.promoText}>
            <View>{promoText}</View>
            <View className={styles.discountText}>{discountText}</View>
          </View>
        </View>
      </View>

      {/* 右侧销量信息 */}
      <View className={styles.salesSection}>
        <View className={styles.fireIcon}>
          {/* 火焰图标 */}
        </View>
        {/* <View className={styles.salesInfo}>
          <View className={styles.salesLabel}>累计热销</View>
          <View className={styles.salesCount}>{salesCount}</View>
          <View className={styles.salesLabel}>件</View>
        </View> */}
      </View>
    </View>
  )
}

export default PromoBanner
