import { View, Button } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'
import CrystalBeads from '@/components/CrystalBeads'
import api from '@/utils/api'

const Design = () => {
  const [prediction, setPrediction] = useState('')

  const startPrediction = () => {
    api.generate.bazi({
      birth_year: 2002,
      birth_month: 1,
      birth_day: 23,
      birth_hour: 16
    }).then(res => {
      console.log(res, 'res')
    })
  }

  const goHome = () => {
    Taro.switchTab({
      url: '/pages/home/index'
    })
  }
      
  return (
    <View className="home-container">
      <View className="home-content">

         {/* 水晶珠动效组件 */}
         <CrystalBeads />
        <View className="action-container">
          <Button 
            className="btn-start"
            onClick={startPrediction}
          >
            开始测算
          </Button>
          
          {prediction && (
            <View className="prediction-result">
              <View className="prediction-text">{prediction}</View>
            </View>
          )}
          
          <Button 
            className="btn-secondary"
            onClick={goHome}
          >
            返回首页
          </Button>
        </View>
      </View>
    </View>
  )
}

export default Predict 