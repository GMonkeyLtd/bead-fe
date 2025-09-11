import React, { useState } from 'react'
import { View } from '@tarojs/components'
import PriceTierItem from './PriceTierItem'
import { PriceTier } from './types'
import styles from './index.module.scss'

export type { PriceTier }

export interface PriceTierSelectorProps {
  tiers: PriceTier[]
  selectedTierId?: string
  onSelect?: (tier: PriceTier) => void
}

const PriceTierSelector: React.FC<PriceTierSelectorProps> = ({
  tiers,
  selectedTierId,
  onSelect
}) => {
  const [selected, setSelected] = useState<string>(selectedTierId || '')

  const handleSelect = (tier: PriceTier) => {
    setSelected(tier.id)
    onSelect?.(tier)
  }

  return (
    <View className={styles.priceTierSelector}>
      {tiers.map((tier) => (
        <PriceTierItem
          key={tier.id}
          tier={tier}
          isSelected={selected === tier.id}
          onSelect={handleSelect}
        />
      ))}
    </View>
  )
}

export default PriceTierSelector
