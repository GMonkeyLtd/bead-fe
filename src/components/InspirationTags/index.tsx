import React from 'react'
import styles from './index.module.scss'
import { View } from '@tarojs/components'

interface InspirationTagProps {
  /** 标签文本内容 */
  text: string
  /** 自定义类名 */
  className?: string
  /** 点击事件 */
  onClick?: () => void
  /** 标签类型，影响颜色主题 */
  type?: 'default' | 'hot' | 'new' | 'limited' | 'fixed-price'
}

export const LimitedTimeTag: React.FC<InspirationTagProps> = ({
  text,
  className = '',
  onClick,
  type = 'default'
}) => {
  const handleClick = () => {
    onClick?.()
  }

  const tagClass = `${styles.tag} ${styles[`tag--${type}`]} ${className}`

  return (
    <View 
      className={tagClass}
      onClick={handleClick}
    >
      <View className={styles.text}>{text}</View>
    </View>
  )
}

// 促销标语组件接口
interface PromoTextProps {
  /** 促销文案内容 */
  text: string
  /** 自定义类名 */
  className?: string
  /** 折扣文本 */
  discountText: string
}

// 促销标语组件
export const PromoText: React.FC<PromoTextProps> = ({
  text,
  discountText,
  className = ''
}) => {
  return (
    <View className={`${styles.promoText} ${className}`}>
      <View>{text}</View>
      <View className={styles.discountText}>{discountText}</View>
    </View>
  )
}

// 一口价标签组件接口
interface FixedPriceTagProps {
  /** 标签文本内容 */
  text?: string
  /** 自定义类名 */
  className?: string
  /** 点击事件 */
  onClick?: () => void
}

// 一口价标签组件
export const FixedPriceTag: React.FC<FixedPriceTagProps> = ({
  text = '一口价',
  className = '',
  onClick
}) => {
  const handleClick = () => {
    onClick?.()
  }

  const tagClass = `${styles.tag} ${styles['tag--fixed-price']} ${className}`

  return (
    <View 
      className={tagClass}
      onClick={handleClick}
    >
      <View className={styles.text}>{text}</View>
    </View>
  )
}



