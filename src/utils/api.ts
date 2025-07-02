import http, { setBaseURL, setIsMock, CancelToken, RequestManager } from "./request";
import Taro from "@tarojs/taro";

// 在应用启动时设置API基础URL
// setBaseURL("http://gmonkey.ai:8088/api/v1");
setBaseURL("https://test.qianjunye.com:443/api/v1");
// setBaseURL("http://192.168.189.246:8088/api/v1");

// setIsMock(true)

// 创建全局请求管理器
export const requestManager = new RequestManager();

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

// 扩展的API配置接口，支持取消令牌
export interface ApiConfig {
  cancelToken?: CancelToken;
  showLoading?: boolean;
  loadingText?: string;
  showError?: boolean;
}

// 用户相关API
export const userApi = {
  // 用户登录 - 跳过认证检查，避免循环依赖
  login: (params: LoginParams, config?: ApiConfig) =>
    http.post<LoginResult>("/user/login", params, {
      skipAuth: true,
      showLoading: false,
      cancelToken: config?.cancelToken,
      ...config,
    }),

  // 获取用户信息
  getUserInfo: (config?: ApiConfig) => 
    http.post<User>(`/user/getuserinfo`, {}, {
      cancelToken: config?.cancelToken,
      ...config,
    }),

  // 更新用户信息
  updateUser: (data: Partial<User>, config?: ApiConfig) =>
    http.post<User>(`/user/updateuserinfo`, data, {
      cancelToken: config?.cancelToken,
      ...config,
    }),

  // 用户退出登录
  logout: (config?: ApiConfig) => 
    http.post("/auth/logout", {}, {
      cancelToken: config?.cancelToken,
      ...config,
    }),
};

// 生成相关API
export const generateApi = {
  // 八字查询
  bazi: (params: BaziParams, config?: ApiConfig) =>
    http.post<BaziResult>("/user/querybazi", params, { 
      skipAuth: true,
      cancelToken: config?.cancelToken,
      ...config,
    }),
  
  // 快速生成 - 支持取消
  quickGenerate: (params: QuickGenerateParams, config?: ApiConfig) =>
    http.post<QuickGenerateResult>("/user/oneclick", params, {
      showLoading: false,
      cancelToken: config?.cancelToken,
      ...config,
    }),
  
  // 个性化生成第一步 - 支持取消
  personalizedGenerate: (params: PersonalizedGenerateParams, config?: ApiConfig) =>
    http.post<PersonalizedGenerateResult[]>(
      "/user/personalizationstep1",
      params,
      { 
        showLoading: false,
        cancelToken: config?.cancelToken,
        ...config,
      }
    ),
  
  // 个性化生成第二步 - 支持取消
  personalizedGenerate2: (params: PersonalizedGenerate2Params, config?: ApiConfig) =>
    http.post<PersonalizedGenerateResult[]>(
      "/user/personalizationstep2",
      params,
      { 
        showLoading: false,
        cancelToken: config?.cancelToken,
        ...config,
      }
    ),
  
  // 通过图片生成 - 支持取消
  personalizedGenerateByImage: (params: QuickGenerateByImageParams, config?: ApiConfig) =>
    http.post<QuickGenerateResult>("/user/personalizationstep3", params, {
      showLoading: false,
      cancelToken: config?.cancelToken,
      ...config,
    }),
};

export const beadsApi = {
  getBeadList: (config?: ApiConfig) =>
    http.get<PersonalizedGenerateResult[]>(
      "/user/beadlist",
      {},
      {
        showLoading: false,
        cancelToken: config?.cancelToken,
        ...config,
      }
    ),
};

export const userHistoryApi = {
  getImageHistory: (config?: ApiConfig) =>
    http.get<PersonalizedGenerateResult[]>(
      "/user/getimagehistory",
      {},
      {
        showLoading: false,
        cancelToken: config?.cancelToken,
        ...config,
      }
    ),
  
  getDesignById: (designId: number, config?: ApiConfig) =>
    http.post<PersonalizedGenerateResult[]>(
      `/user/getdesignitem`,
      {
        image_id: designId,
      },
      {
        showLoading: true,
        cancelToken: config?.cancelToken,
        ...config,
      }
    ),
  
  createOrder: (params: { design_id: number; price: number }, config?: ApiConfig) =>
    http.post<{
      data: {
        order_uuid: string;
      };
    }>(`/user/generateorder`, params, {
      showLoading: true,
      loadingText: "订单生成中...",
      cancelToken: config?.cancelToken,
      ...config,
    }),
  
  getOrderById: (orderId: string | string[], config?: ApiConfig) =>
    http.post<{
      data: {
        any: [];
      };
    }>(`/user/queryorder`, { order_uuids: Array.isArray(orderId) ? orderId : [orderId] }, { 
      showLoading: true, 
      cancelToken: config?.cancelToken,
      ...config,
    }),
  
  getOrderList: (config?: ApiConfig) =>
    http.post<{
      data: {
        any: [];
      };
    }>(`/user/queryorder`, {}, { 
      showLoading: true,
      cancelToken: config?.cancelToken,
      ...config,
    }),
  
  cancelOrder: (orderId: string, config?: ApiConfig) =>
    http.post<{
      data: {
        any: [];
      };
    }>(`/user/cancelorder`, { order_uuid: orderId }, { 
      showLoading: true,
      cancelToken: config?.cancelToken,
      ...config,
    }),
};

// 文件相关API
export const fileApi = {
  // 上传文件 - 支持取消
  upload: (filePath: string, formData?: Record<string, any>, config?: ApiConfig) =>
    http.upload("/upload", filePath, formData, config?.cancelToken),
};

// 便捷的API调用方法，支持自动管理取消令牌
export const managedApi = {
  // 快速生成 - 自动管理取消令牌
  quickGenerate: (key: string, params: QuickGenerateParams) =>
    requestManager.createRequest(key, (cancelToken) =>
      generateApi.quickGenerate(params, { cancelToken })
    ),

  // 个性化生成 - 自动管理取消令牌
  personalizedGenerate: (key: string, params: PersonalizedGenerateParams) =>
    requestManager.createRequest(key, (cancelToken) =>
      generateApi.personalizedGenerate(params, { cancelToken })
    ),

  // 通过图片生成 - 自动管理取消令牌
  personalizedGenerateByImage: (key: string, params: QuickGenerateByImageParams) =>
    requestManager.createRequest(key, (cancelToken) =>
      generateApi.personalizedGenerateByImage(params, { cancelToken })
    ),

  // 文件上传 - 自动管理取消令牌
  upload: (key: string, filePath: string, formData?: Record<string, any>) =>
    requestManager.createRequest(key, (cancelToken) =>
      fileApi.upload(filePath, formData, { cancelToken })
    ),
};

// 导出所有API
export default {
  user: userApi,
  generate: generateApi,
  bead: beadsApi,
  file: fileApi,
  userHistory: userHistoryApi,
  managed: managedApi,
};
