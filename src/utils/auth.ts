import Taro from '@tarojs/taro'
import api from './api';

// 登录状态管理
let isLoggingIn = false;
let loginPromise: Promise<string | null> | null = null;

// 认证管理工具
export const AuthManager = {
    // 保存登录信息
    saveAuth: (token: string, userInfo?: any) => {
      Taro.setStorageSync('token', token)
      if (userInfo) {
        Taro.setStorageSync('userInfo', userInfo)
      }
    },
  
    // 清除登录信息
    clearAuth: () => {
      Taro.removeStorageSync('token')
      Taro.removeStorageSync('userInfo')
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
    },

    // 检查登录状态（别名方法，保持兼容性）
    checkLogin: () => {
      return AuthManager.isLoggedIn();
    },

    // 获取token，如果没有则自动登录
    async getToken(): Promise<string | null> {
      // 先检查是否已有token
      const currentToken = Taro.getStorageSync('token');
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
    async login(): Promise<string | null> {
      // 防止并发登录
      if (isLoggingIn) {
        return loginPromise;
      }

      isLoggingIn = true;
      loginPromise = this._performLogin();

      try {
        const token = await loginPromise;
        return token;
      } finally {
        isLoggingIn = false;
        loginPromise = null;
      }
    },

    // 执行登录的内部方法
    async _performLogin(): Promise<string | null> {
      try {
        // 先检查是否已经登录
        if (AuthManager.isLoggedIn()) {
          console.log("用户已登录，跳过登录流程");
          return Taro.getStorageSync('token');
        }
  
        console.log("开始登录流程...");
        const loginRes = await Taro.login();
        
        if (!loginRes.code) {
          throw new Error('获取登录凭证失败');
        }

        const res = await this.callLoginApi(loginRes.code);
        console.log("登录响应:", res);
        console.log(res, 'res')
  
        if (res.data.token) {
          // 保存登录信息到本地缓存
          AuthManager.saveAuth(res.data.token, res.data.user);
  
          Taro.showToast({
            title: "登录成功",
            icon: "success",
            duration: 1500
          });
  
          console.log("认证信息已保存:", AuthManager.getAuthInfo());
          return res.data.token;
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
        
        AuthManager.clearAuth();
        
        Taro.showToast({
          title: "已退出登录",
          icon: "success",
          duration: 1500
        });
      } catch (error) {
        console.error("退出登录失败:", error);
        // 即使API调用失败，也清除本地存储
        AuthManager.clearAuth();
      }
    }
}