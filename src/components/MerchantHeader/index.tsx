import { View, Text, Image } from '@tarojs/components'
import styles from './index.module.scss'
import signalBars from '../../assets/icons/signal-bars.svg'
import signalRed from '../../assets/icons/signal-red.svg'
import logo from '@/assets/logo/logo-white.svg';

interface HeaderProps {
  title?: string
  showSignal?: boolean
}

export default function MerchantHeader({ title = '商家管理后台', showSignal = true }: HeaderProps) {
  return (
    <View className={styles.topHeaderContainer}>
      {showSignal && (
        <View className={styles.signalGroup}>
          <Image 
            className={styles.signalBars} 
            src={logo}
            mode="aspectFit"
          />
          {/* <Image 
            className={styles.signalRed} 
            src={signalRed}
            mode="aspectFit"
          /> */}
        </View>
      )}
      
      <View className={styles.topSeparator} />
      
      <Text className={styles.topHeaderTitle}>{title}</Text>
    </View>
  )
} 