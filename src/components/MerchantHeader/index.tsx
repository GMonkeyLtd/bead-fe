import { View, Text, Image } from '@tarojs/components'
import './index.scss'
import signalBars from '../../assets/icons/signal-bars.svg'
import signalRed from '../../assets/icons/signal-red.svg'
import logo from '@/assets/logo/logo-white.svg';

interface HeaderProps {
  title?: string
  showSignal?: boolean
}

export default function MerchantHeader({ title = '商家管理后台', showSignal = true }: HeaderProps) {
  return (
    <View className="top-header-container">
      {showSignal && (
        <View className="signal-group">
          <Image 
            className="signal-bars" 
            src={logo}
            mode="aspectFit"
          />
          {/* <Image 
            className="signal-red" 
            src={signalRed}
            mode="aspectFit"
          /> */}
        </View>
      )}
      
      <View className="top-separator" />
      
      <Text className="top-header-title">{title}</Text>
    </View>
  )
} 