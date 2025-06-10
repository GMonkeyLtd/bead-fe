import { View, Button, Text } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'
import api from '@/utils/api'
import { AuthManager } from '@/utils/auth'
import CrystalBeads from '../../components/CrystalBeads'
import BallAnimation from '@/components/animate'
import CircleComponent from '@/components/circle-svg'

const Home = () => {

  
  const startPredict = () => {
    Taro.switchTab({
      url: '/pages/predict/index'
    })
  }

  const startDesign = () => {
    Taro.switchTab({
      url: '/pages/design/index'
    })
  }

  const login = async() => {
    try {
      const loginRes = await Taro.login();
      if (loginRes.code) {
        const res = await api.user.login({ code: loginRes.code })
        console.log(res, '登录响应')
        
        if (res.token) {
          // 保存登录信息到本地缓存
          AuthManager.saveAuth(res.token)
          
          Taro.showToast({
            title: '登录成功',
            icon: 'success'
          })
          
          console.log('认证信息已保存:', AuthManager.getAuthInfo())
        }
      }
    } catch (error) {
      console.log('登录失败:', error)
      Taro.showToast({
        title: '登录失败',
        icon: 'error'
      })
    }
  }


  return (
    <View className="home-container">
      <View className="home-content">
          <View className="hero-section">
          <Text className="title">开启你的水晶定制之旅</Text>
          <Text className="subtitle">探索您的内在能量，发现生命的奥秘</Text>
        </View>
        <View className="action-container">
          <Button 
            className="btn-start"
            onClick={startDesign}
          >
            手动设计
          </Button>
          <Button 
            className="btn-start"
            onClick={startPredict}
          >
            AI定制
          </Button>
        </View>
        {/* <BallAnimation /> */}
      </View>
    </View>
  )
}

export default Home 