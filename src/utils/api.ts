import http, { setBaseURL, setIsMock } from "./request";
import Taro from "@tarojs/taro";

// 在应用启动时设置API基础URL
// setBaseURL("http://gmonkey.ai:8088/api/v1");
setBaseURL("https://test.qianjunye.com:443/api/v1");
// setBaseURL("http://192.168.189.246:8088/api/v1");

// setIsMock(true)

// 定义用户相关的数据类型
export interface User {
  nick_name: string;
  avatar_url?: string;
  phone?: string;
  wechat_id?: string;
  wechat_avatar_url?: number;
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
  birth_year: number;
  birth_month: number;
  birth_day: number;
  birth_hour: number;
  is_lunar: boolean;
  sex?: number;
}

export interface PersonalizedGenerateParams extends BaziParams {}

export interface QuickGenerateParams extends BaziParams {}

export interface QuickGenerateByImageParams {
  image_base64: string[];
  bead_info: PersonalizedGenerateResult[];
}

export interface PersonalizedGenerateResult {
  id: string;
  name: string;
  image_url: string;
  color: string;
  wuxing: string;
  english: string;
  bead_diameter: number;
}

export interface PersonalizedGenerate2Params {
  ids: string[];
  context: string;
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
    http.post<LoginResult>("/user/login", params, {
      skipAuth: true,
      showLoading: false,
    }),

  // 获取用户信息
  getUserInfo: () => http.post<User>(`/user/getuserinfo`),

  // 更新用户信息
  updateUser: (data: Partial<User>) =>
    http.post<User>(`/user/updateuserinfo`, data),

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
      showLoading: false,
    }),
  personalizedGenerate: (params: PersonalizedGenerateParams) =>
    http.post<PersonalizedGenerateResult[]>(
      "/user/personalizationstep1",
      params,
      { showLoading: false }
    ),
  personalizedGenerate2: (params: PersonalizedGenerate2Params) =>
    http.post<PersonalizedGenerateResult[]>(
      "/user/personalizationstep2",
      params,
      { showLoading: false }
    ),
  personalizedGenerateByImage: (params: QuickGenerateByImageParams) =>
    http.post<QuickGenerateResult>("/user/personalizationstep3", params, {
      showLoading: false,
    }),
};

export const beadsApi = {
  getBeadList: () =>
    http.get<PersonalizedGenerateResult[]>(
      "/user/beadlist",
      {},
      {
        showLoading: false,
      }
    ),
};

export const userHistoryApi = {
  getImageHistory: () =>
    http.get<PersonalizedGenerateResult[]>(
      "/user/getimagehistory",
      {},
      {
        showLoading: false,
      }
    ),
  getDesignById: (designId: number) =>
    http.post<PersonalizedGenerateResult[]>(
      `/user/getdesignitem`,
      {
        image_id: designId,
      },
      {
        showLoading: true,
      }
    ),
  createOrder: (params: { design_id: number; price: number }) =>
    http.post<{
      data: {
        order_uuid: string;
      };
    }>(`/user/generateorder`, params, {
      showLoading: true,
      loadingText: "订单生成中...",
    }),
  getOrderById: (orderId: string | string[], config?: {}) =>
    http.post<{
      data: {
        any: [];
      };
    }>(`/user/queryorder`, { order_uuids: Array.isArray(orderId) ? orderId : [orderId] }, { showLoading: true, ...config }),
  getOrderList: () =>
    http.post<{
      data: {
        any: [];
      };
    }>(`/user/queryorder`, {}, { showLoading: true }),
  cancelOrder: (orderId: string) =>
    http.post<{
      data: {
        any: [];
      };
    }>(`/user/cancelorder`, { order_uuid: orderId }, { showLoading: true }),
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
  bead: beadsApi,
  file: fileApi,
  userHistory: userHistoryApi,
};
