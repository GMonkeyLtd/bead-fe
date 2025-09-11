import React from 'react'
import { View, Text, Image } from '@tarojs/components'
import { PriceTier } from './types'
import styles from './PriceTierItem.module.scss'
import checkedOrangeIcon from '@/assets/icons/checked-orange.svg'
import checkBlackIcon from '@/assets/icons/check-black.svg'

export interface PriceTierItemProps {
  tier: PriceTier
  isSelected: boolean
  onSelect: (tier: PriceTier) => void
}

const PriceTierItem: React.FC<PriceTierItemProps> = ({
  tier,
  isSelected,
  onSelect
}) => {
  const handleClick = () => {
    onSelect(tier)
  }

  const getItemClassName = () => {
    const classNames = [styles.priceTierItem]
    
    if (isSelected) {
      classNames.push(styles.selected)
    }
    
    if (tier.isRecommended) {
      classNames.push(styles.recommended)
    }
    
    if (tier.isHighEnd) {
      classNames.push(styles.highEnd)
    }
    
    return classNames.join(' ')
  }

  return (
    <View className={getItemClassName()} onClick={handleClick}>
      <View className={styles.tierContent}>
        <View className={styles.tierInfo}>
          {/* 选择圆圈 */}
         {!isSelected && <View className={styles.selectionCircle}></View>}
          {isSelected && !tier.isRecommended && <Image src={checkedOrangeIcon} className={styles.selectionDot} />}
          {isSelected && tier.isRecommended && <Image src={checkBlackIcon} className={styles.selectionDot} />}
          
          {/* 档位信息 */}
          <View className={styles.tierDetails}>
            <View className={styles.tierHeader}>
              <Text className={styles.tierTitle}>{tier.title}</Text>
            </View>
            <Text className={styles.tierDescription}>{tier.description}</Text>
          </View>
        </View>
        
        {/* 价格信息 */}
        <View className={styles.priceInfo}>
          <Text className={styles.priceLabel}>参考价:</Text>
          <View className={styles.priceValue}>
            <Text className={styles.priceNumber}>{tier.price}</Text>
            <Text className={styles.priceUnit}>元</Text>
          </View>
        </View>
      </View>
      
      {/* 推荐标签 */}
      {tier.isRecommended && (
        <View className={styles.recommendedTag}>
          <Text className={styles.tagText}>最受欢迎</Text>
        </View>
      )}
    </View>
  )
}

export default PriceTierItem
