import Taro from '@tarojs/taro'

// 认证管理工具
export const AuthManager = {
    // 保存登录信息
    saveAuth: (token?: any) => {
      Taro.setStorageSync('token', token)
    },
  
    // 清除登录信息
    clearAuth: () => {
      Taro.removeStorageSync('token')
    },
  
    // 检查是否已登录
    isLoggedIn: () => {
      const token = Taro.getStorageSync('token')
      return !!token
    },
  
    // 获取用户信息
    getUserInfo: () => {
      return Taro.getStorageSync('userInfo')
    },
  
    // 获取认证信息
    getAuthInfo: () => {
      return {
        token: Taro.getStorageSync('token')
      }
    }
  }