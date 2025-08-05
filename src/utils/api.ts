import http, {
  setBaseURL,
  setIsMock,
  CancelToken,
  BaseResponse,
} from "./request";
import Taro from "@tarojs/taro";

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

export interface PersonalizedGenerateParams extends BaziParams { }

export interface QuickGenerateParams extends BaziParams { }

export interface QuickGenerateByImageParams {
  image_base64: string[];
  bead_info: PersonalizedGenerateResult[];
}

export interface PersonalizedGenerateResult {
  id: string;
  name: string;
  image_url: string;
  color: string;
  wuxing: string[];
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
    http.post<User>(
      `/user/getuserinfo`,
      {},
      {
        cancelToken: config?.cancelToken,
        ...config,
      }
    ),

  // 更新用户信息
  updateUser: (data: Partial<User>, config?: ApiConfig) =>
    http.post<User>(`/user/updateuserinfo`, data, {
      cancelToken: config?.cancelToken,
      ...config,
    }),

  // 用户退出登录
  logout: (config?: ApiConfig) =>
    http.post(
      "/auth/logout",
      {},
      {
        cancelToken: config?.cancelToken,
        ...config,
      }
    ),
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
  personalizedGenerate: (
    params: PersonalizedGenerateParams,
    config?: ApiConfig
  ) =>
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
  personalizedGenerate2: (
    params: PersonalizedGenerate2Params,
    config?: ApiConfig
  ) =>
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
  personalizedGenerateByImage: (
    params: QuickGenerateByImageParams,
    config?: ApiConfig
  ) =>
    http.post<QuickGenerateResult>("/user/personalizationstep3", params, {
      showLoading: false,
      cancelToken: config?.cancelToken,
      ...config,
    }),
};

export const beadsApi = {
  getBeadList: (config?: ApiConfig) =>
    http.get<{ data: PersonalizedGenerateResult[] }>(
      "/user/beads",
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

  createOrder: (
    params: { design_id: number; price: number },
    config?: ApiConfig
  ) =>
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

  getOrderById: (orderId: string | string[], config?: ApiConfig) => {

    return Promise.resolve({
      "code": 200,
      "data": {
        "count": 1,
        "orders": [
          {
            "order_uuid": "20250625155842657587",
            "order_status": "shipped",
            "waybill_status": 0,
            "price": 400.00,
            "reference_price": 500.00,
            "created_at": "2025-06-25 15:58:43",
            "merchant_info": {
              "merchant_id": "1",
              "is_self_operated": true,
              "qr_code": "https://zhuluoji.cn-sh2.ufileos.com/images-frontend/app-qrcode.png",
              "name": "东海县亿特珠宝有限公司",
              "address": "北京市朝阳区建国路88号",
              "credit": 5,
              "transaction_rate": 100,
              "response_rate": 100,
              "transaction_history": {
                "images_url": [
                  "https://zhuluoji.cn-sh2.ufileos.com/user-images-history/user2/20250623182844.056_4c406fbb255402bd3d814f75e5186b30.jpg",
                  "https://zhuluoji.cn-sh2.ufileos.com/user-images-history/user2/20250624102729.990_1ac4e9de8f220c25fc9705c2261d4148.jpg",
                  "https://zhuluoji.cn-sh2.ufileos.com/user-images-history/user2/20250623182844.056_4c406fbb255402bd3d814f75e5186b30.jpg",
                  "https://zhuluoji.cn-sh2.ufileos.com/user-images-history/user2/20250625142822.796_80fd15c26043962abf275dd65d1dd8a0.jpg"
                ]
              }
            },
            "design_info": {
              "design_id": "17",
              "image_url": "https://zhuluoji.cn-sh2.ufileos.com/user-images-history/user2/20250625154154.590_a973cdf20002585f04e74afb58f227a1.jpg",
              "beads_info": [
                {
                  "bead_diameter": 8,
                  "color": "棕色",
                  "english": "Yellow Rutilated Quartz 2",
                  "function": "增强自信",
                  "id": "34",
                  "image_url": "https://zhuluoji.cn-sh2.ufileos.com/beads/huyanshi2.png",
                  "name": "虎眼石 2",
                  "wuxing": "土"
                }
              ],
              "beads_number": 1,
              "word_info": {
                "bead_ids_deduplication": [
                  {
                    "color": "棕色",
                    "english": "Yellow Rutilated Quartz 2",
                    "function": "稳定情绪",
                    "id": "34",
                    "image_url": "https://zhuluoji.cn-sh2.ufileos.com/beads/%E8%99%8E%E7%9C%BC%E7%9F%B32.png",
                    "name": "虎眼石 2",
                    "wuxing": "土"
                  },
                  {
                    "color": "棕色",
                    "english": "Yellow Rutilated Quartz 2",
                    "function": "增强自信",
                    "id": "34",
                    "image_url": "https://zhuluoji.cn-sh2.ufileos.com/beads/%E8%99%8E%E7%9C%BC%E7%9F%B32.png",
                    "name": "虎眼石 2",
                    "wuxing": "土"
                  }
                ],
                "bracelet_name": "虎眼守护",
                "recommendation_text": "虎眼石手串，土行能量充沛，助你稳定情绪，增强自信，守护平安。"
              }
            },
            "product_photos": {
              "upload_time": "2025-06-25 15:58:43",
              "images_url": [
                "https://zhuluoji.cn-sh2.ufileos.com/user-images-history/user2/20250623182844.056_4c406fbb255402bd3d814f75e5186b30.jpg",
                "https://zhuluoji.cn-sh2.ufileos.com/user-images-history/user2/20250624102729.990_1ac4e9de8f220c25fc9705c2261d4148.jpg",
                "https://zhuluoji.cn-sh2.ufileos.com/user-images-history/user2/20250623182844.056_4c406fbb255402bd3d814f75e5186b30.jpg",
                "https://zhuluoji.cn-sh2.ufileos.com/user-images-history/user2/20250625142822.796_80fd15c26043962abf275dd65d1dd8a0.jpg"
              ]
            },
            "address": {
              "user_name": "张三",
              "postal_code": "100000",
              "province_name": "北京市",
              "city_name": "北京市",
              "county_name": "东城区",
              "street_name": "王府井街道",
              "detail_info": "王府井大街 88 号东方广场 A 座 1001 室",
              "national_code": "CN",
              "tel_number": "13800138000"
            }
          }
        ]
      },
      "message": "success"
    })



    return http.post<{
      data: {
        any: [];
      };
    }>(
      `/user/queryorder`,
      { order_uuids: Array.isArray(orderId) ? orderId : [orderId] },
      {
        showLoading: true,
        cancelToken: config?.cancelToken,
        ...config,
      }
    )
  },


  getOrderList: (config?: ApiConfig) =>
    http.post<{
      data: {
        any: [];
      };
    }>(
      `/user/queryorder`,
      {},
      {
        showLoading: true,
        cancelToken: config?.cancelToken,
        ...config,
      }
    ),

  cancelOrder: (orderId: string, config?: ApiConfig) =>
    http.post<{
      data: {
        any: [];
      };
    }>(
      `/user/cancelorder`,
      { order_uuid: orderId },
      {
        showLoading: true,
        cancelToken: config?.cancelToken,
        ...config,
      }
    ),
};

export interface InspirationWord {
  work_id: string;
  title: string;
  cover_url: string;
  is_collect: boolean;
  design_id: number;
  user: {
    nick_name: string;
    avatar_url: string;
  };
  collects_count: number;
}

export interface InspirationResult extends BaseResponse {
  data: {
    page: number;
    page_size: number;
    total_count: number;
    works: InspirationWord[];
  };
}

export const inspirationApi = {
  getInspirationData: (
    params: { page: number; page_size: number } | { work_id: string },
    config?: ApiConfig
  ) => {
    return http.post<InspirationResult>("/user/community/home", params, {
      cancelToken: config?.cancelToken,
      ...config,
    });
  },
  collectInspiration: (params: { work_id: string }, config?: ApiConfig) => {
    return http.post<{
      data: {
        any: [];
      };
    }>(`/user/community/collect`, params, {
      showLoading: true,
      cancelToken: config?.cancelToken,
      ...config,
    });
  },
  cancelCollectInspiration: (
    params: { work_id: string },
    config?: ApiConfig
  ) => {
    return http.post<{
      data: {
        any: [];
      };
    }>(`/user/community/uncollect`, params, {
      showLoading: true,
      cancelToken: config?.cancelToken,
      ...config,
    });
  },
  getCollectInspiration: (
    params: { page: number; pageSize: number },
    config?: ApiConfig
  ) => {
    return http.post<InspirationResult>("/user/community/collections", params, {
      cancelToken: config?.cancelToken,
      ...config,
    });
  },
  viewWorkDetail: (params: { work_id: string }, config?: ApiConfig) => {
    return http.post<{
      data: {
        any: [];
      };
    }>(`/user/community/work/view`, params, {
      showLoading: false,
      cancelToken: config?.cancelToken,
      ...config,
    });
  },
};

// 文件相关API
export const fileApi = {
  // 上传文件 - 支持取消
  upload: (
    filePath: string,
    formData?: Record<string, any>,
    config?: ApiConfig
  ) => http.upload("/upload", filePath, formData, config?.cancelToken),
};

// 导出所有API
export default {
  user: userApi,
  generate: generateApi,
  bead: beadsApi,
  userHistory: userHistoryApi,
  inspiration: inspirationApi,
};
