import http, { setBaseURL } from "./request";
import Taro from "@tarojs/taro";

// 在应用启动时设置API基础URL
setBaseURL("http://gmonkey.ai:8088/api/v1");

// 定义用户相关的数据类型
export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  nickname?: string;
  openid?: string;
}

export interface LoginParams {
  code: string;
}

export interface LoginResult {
  token: string;
  user?: User;
}

// 定义八字相关的数据类型
export interface BaziParams {
  year: number;
  month: number;
  day: number;
  hour: number;
  gender: number;
}

export interface PersonalizedGenerateParams extends BaziParams {}

export interface QuickGenerateParams extends BaziParams {}

export interface PersonalizedGenerateResult {
  id: string;
  name: string;
  image_url: string;
  color: string;
  wuxing: string;
  english: string;
}

export interface BaziResult {
  // 根据实际返回的数据结构定义
  [key: string]: any;
}

export interface QuickGenerateResult {
  image_url: string;
  bead_image_urls?: string[];
  [key: string]: any;
}

// 用户相关API
export const userApi = {
  // 用户登录 - 跳过认证检查，避免循环依赖
  login: (params: LoginParams) =>
    http.post<LoginResult>("/user/login", params, { skipAuth: true }),

  // 获取用户信息
  getUserInfo: (userId: number) => http.get<User>(`/user/${userId}`),

  // 更新用户信息
  updateUser: (userId: number, data: Partial<User>) =>
    http.put<User>(`/user/${userId}`, data),

  // 用户退出登录
  logout: () => http.post("/auth/logout"),
};

// 生成相关API
export const generateApi = {
  // 八字查询
  bazi: (params: BaziParams) =>
    http.post<BaziResult>("/user/querybazi", params, { skipAuth: true }),
  // 快速生成
  quickGenerate: (params: QuickGenerateParams) =>
    http.post<QuickGenerateResult>("/user/oneclick", params, {
      skipAuth: true,
    }),
  personalizedGenerate: (params: PersonalizedGenerateParams) =>
    http.post<PersonalizedGenerateResult[]>(
      "/user/personalizationstep1",
      params,
      { skipAuth: true }
    ),
};

// 文件相关API
export const fileApi = {
  // 上传文件
  upload: (filePath: string, formData?: Record<string, any>) =>
    http.upload("/upload", filePath, formData),
};

// 导出所有API
export default {
  user: userApi,
  generate: generateApi,
  file: fileApi,
};
