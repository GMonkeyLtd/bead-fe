import http, { setBaseURL } from './request'
import Taro from '@tarojs/taro'

// 在应用启动时设置API基础URL
setBaseURL('http://192.168.189.246:8088/api/v1')

// 定义用户相关的数据类型
export interface User {
  id: number
  username: string
  email: string
  avatar?: string
}

export interface LoginParams {
  code: string
}

export interface LoginResult {
  token: string
  user?: User
}


// 用户相关API
export const userApi = {
  // 用户登录
  login: (params: LoginParams) => 
    http.post<LoginResult>('/user/login', params),

  // 获取用户信息
  getUserInfo: (userId: number) => 
    http.get<User>(`/user/${userId}`),

  // 更新用户信息
  updateUser: (userId: number, data: Partial<User>) => 
    http.put<User>(`/user/${userId}`, data),

  // 用户退出登录
  logout: () => 
    http.post('/auth/logout'),
}

export const generateApi = {
    bazi: (params: any) =>http.post('/user/querybazi', params),
    quickGenerate: (params: any) =>http.post('/user/oneclick', params),
}



// 导出所有API
export default {
  user: userApi,
  generate: generateApi,
} 