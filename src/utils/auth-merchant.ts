import Taro from '@tarojs/taro'
import api from './api-merchant';

// 登录状态管理
let isLoggingIn = false;
let loginPromise: Promise<string | null> | null = null;

// 认证管理工具
export const MerchantAuthManager = {
    // 保存登录信息
    saveAuth: (token: string, userInfo?: any) => {
      Taro.setStorageSync('merchant-token', token)
      if (userInfo) {
        Taro.setStorageSync('userInfo', userInfo)
      }
    },
  
    // 清除登录信息
    clearAuth: () => {
      Taro.removeStorageSync('merchant-token')
      Taro.removeStorageSync('userInfo')
    },
  
    // 检查是否已登录
    isLoggedIn: () => {
      const token = Taro.getStorageSync('merchant-token')
      return !!token
    },
  
    // 获取用户信息
    getUserInfo: () => {
      return Taro.getStorageSync('userInfo')
    },
  
    // 获取认证信息
    getAuthInfo: () => {
      return {
        token: Taro.getStorageSync('merchant-token')
      }
    },

    // 检查登录状态（别名方法，保持兼容性）
    checkLogin: () => {
      return MerchantAuthManager.isLoggedIn();
    },

    // 获取token，如果没有则自动登录
    async getToken(): Promise<string | null> {
      // 先检查是否已有token
      const currentToken = Taro.getStorageSync('merchant-token');
      console.log(currentToken, 'currentToken')
      if (currentToken) {
        return currentToken;
      }
      console.log(isLoggingIn, loginPromise, 'isLoggingIn, loginPromise')
      // 如果正在登录中，等待登录完成
      if (isLoggingIn && loginPromise) {
        return await loginPromise;
      }

      // 开始登录流程
      return await this.login();
    },

    // 直接调用登录接口，避免循环依赖
    async callLoginApi(code: string): Promise<{token: string, user?: any}> {
      return new Promise((resolve, reject) => {
        api.user.login({ code }).then((res) => {
          resolve(res)
        }).catch((err) => {
          reject(err)
        })
      });
    },

    // 登录方法
    async login({ phone, password }: { phone: string, password: string }): Promise<string | null> {
      console.log(phone, password, 'phone, password')
      // 防止并发登录
      if (isLoggingIn) {
        return loginPromise;
      }

      isLoggingIn = true;
      loginPromise = this._performLogin({ phone, password });

      try {
        const token = await loginPromise;
        return token;
      } finally {
        isLoggingIn = false;
        loginPromise = null;
      }
    },

    // 执行登录的内部方法
    async _performLogin({ phone, password }: { phone: string, password: string }): Promise<string | null> {
      try {
        // 先检查是否已经登录
        if (MerchantAuthManager.isLoggedIn()) {
          console.log("用户已登录，跳过登录流程");
          return Taro.getStorageSync('merchant-token');
        }
  
        console.log("开始登录流程...");
        const loginRes = await api.user.login({
          phone,
          password
        });
        console.log(loginRes, 'loginRes')
        
        if (!loginRes.token) {
          throw new Error('获取登录凭证失败');
        }

        if (loginRes.token) {
          // 保存登录信息到本地缓存
          MerchantAuthManager.saveAuth(loginRes.token);
  
          return loginRes.token;
        } else {
          throw new Error('登录响应中没有token');
        }
      } catch (error: any) {
        console.error("登录失败:", error);
        Taro.showToast({
          title: "登录失败: " + (error.message || '未知错误'),
          icon: "none",
          duration: 2000
        });
        throw error;
      }
    },

    // 退出登录
    async logout(): Promise<void> {
      try {
        // 可以在这里调用退出登录的API
        // await callLogoutApi();
        
        MerchantAuthManager.clearAuth();
        
        Taro.showToast({
          title: "已退出登录",
          icon: "success",
          duration: 1500
        });
      } catch (error) {
        console.error("退出登录失败:", error);
        // 即使API调用失败，也清除本地存储
        MerchantAuthManager.clearAuth();
      }
    }
}