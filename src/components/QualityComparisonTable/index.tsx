import React from 'react'
import styles from './index.module.scss'
import { View, Image } from '@tarojs/components'
import helpIcon from '@/assets/icons/help-icon.svg'

interface QualityComparisonTableProps {
  className?: string
  qualityFactors: QualityFactor[]
  currentLevel: number
}

export interface QualityFactor {
  name: string
  hasHelp?: boolean
  levels: {
    basic: string
    quality: string
    premium: string
  }
}

const QualityComparisonTable: React.FC<QualityComparisonTableProps> = ({
  className,
  qualityFactors,
  currentLevel,
}) => {
  console.log('QualityComparisonTable')

  const handleHelpClick = (factorName: string) => {
    // TODO: 实现帮助信息弹窗
    console.log(`显示${factorName}的帮助信息`)
  }

  return (
    <View className={`${styles.qualityTable} ${className || ''}`}>
      {/* 表头 */}
      <View className={styles.tableHeader}>
        <View className={styles.headerCell} style={{ borderRadius: '10px 0px 0px 0px' }}>
          <View className={styles.headerText}>因素</View>
        </View>
        <View className={styles.headerLevels}>
          <View className={`${styles.headerCell} ${currentLevel === 1 ? styles.currentLevel : ''}`}>
            <View className={styles.headerText}>简单穿搭</View>
          </View>
          <View className={`${styles.headerCell} ${currentLevel === 2 ? styles.currentLevel : ''}`}>
            <View className={styles.headerText}>品质追求</View>
          </View>
          <View className={`${styles.headerCell} ${currentLevel === 3 ? styles.currentLevel : ''}`} style={{ borderRadius: currentLevel === 3 ? '10px 10px 0px 0px' : '0px 10px 0px 0px' }}>
            <View className={styles.headerText}>高档进阶</View>
          </View>
        </View>
      </View>

      {/* 表格内容 */}
      <View className={styles.tableBody}>
        {qualityFactors.map((factor, index) => (
          <View key={factor.name} className={styles.tableRow}>
            <View className={`${styles.factorCell} ${index === qualityFactors.length - 1 ? styles.lastRow : ''}`}>
              <View className={styles.factorContent}>
                <View className={styles.factorName}>{factor.name}</View>
                {factor.hasHelp && (
                    <Image src={helpIcon} mode="aspectFit" style={{ width: "12px", height: "12px" }} />
                )}
              </View>
            </View>
            <View className={styles.levelCells}>
              <View className={`${styles.levelCell} ${index === qualityFactors.length - 1 ? styles.lastRow : ''} ${currentLevel === 1 ? styles.currentLevel : ''}`}>
                <View className={styles.levelText} >{factor.levels.basic}</View>
              </View>
              <View className={`${styles.levelCell} ${index === qualityFactors.length - 1 ? styles.lastRow : ''} ${currentLevel === 2 ? styles.currentLevel : ''}`}>
                <View className={styles.levelText}>{factor.levels.quality}</View>
              </View>
              <View className={`${styles.levelCell} ${index === qualityFactors.length - 1 ? styles.lastRow : ''} ${currentLevel === 3 ? styles.currentLevel : ''}`}>
                <View className={styles.levelText}>{factor.levels.premium}</View>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

export default QualityComparisonTable
