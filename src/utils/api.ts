import { AccessoryItem } from "./api-session";
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
  is_promo_enable?: boolean;
  promo_code?: string;
}

export interface ReferralUser {
  user_id: string;
  nick_name: string;
  avatar_url: string;
  order_count: number;
  order_amount: number; // 单位：分
}

export interface ReferralStats {
  total_invitees: number;
  order_invitees: number;
  invitees: ReferralUser[];
}

export interface InviteeOrder {
  order_uuid: string;
  order_status: number;
  order_amount: number; // 分
  created_at: string;
}

export interface LoginParams {
  code: string;
  referral_code?: string;
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
  diameter: number;
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

// 为了避免与导入的 config 冲突，使用 apiConfig 作为参数名
type RequestConfig = ApiConfig;

// 用户相关API
export const userApi = {
  // 用户登录 - 跳过认证检查，避免循环依赖
  login: (params: LoginParams, apiConfig?: RequestConfig) =>
    http.post<LoginResult>("/user/login", params, {
      skipAuth: true,
      showLoading: false,
      cancelToken: apiConfig?.cancelToken,
      ...apiConfig,
    }),

  // 获取用户信息
  getUserInfo: (apiConfig?: RequestConfig) =>
    http.post<{ data: User }>(
      `/user/getuserinfo`,
      {},
      {
        cancelToken: apiConfig?.cancelToken,
        ...apiConfig,
      }
    ),

  // 更新用户信息
  updateUser: (data: Partial<User>, apiConfig?: RequestConfig) =>
    http.post<User>(`/user/updateuserinfo`, data, {
      cancelToken: apiConfig?.cancelToken,
      ...apiConfig,
    }),

  // 用户退出登录
  logout: (apiConfig?: RequestConfig) =>
    http.post(
      "/auth/logout",
      {},
      {
        cancelToken: apiConfig?.cancelToken,
        ...apiConfig,
      }
    ),

  // 获取邀请用户列表
  getReferralUsers: (apiConfig?: RequestConfig) =>
    http.get<{ data: ReferralStats }>(
      "/user/referral/users",
      {},
      {
        cancelToken: apiConfig?.cancelToken,
        ...apiConfig,
      }
    ),
};

// 生成相关API
export const generateApi = {
  // 八字查询
  bazi: (params: BaziParams, apiConfig?: RequestConfig) =>
    http.post<BaziResult>("/user/querybazi", params, {
      skipAuth: true,
      cancelToken: apiConfig?.cancelToken,
      ...apiConfig,
    }),

  // 快速生成 - 支持取消
  quickGenerate: (params: QuickGenerateParams, apiConfig?: RequestConfig) =>
    http.post<QuickGenerateResult>("/user/oneclick", params, {
      showLoading: false,
      cancelToken: apiConfig?.cancelToken,
      ...apiConfig,
    }),

  // 个性化生成第一步 - 支持取消
  personalizedGenerate: (
    params: PersonalizedGenerateParams,
    apiConfig?: RequestConfig
  ) =>
    http.post<PersonalizedGenerateResult[]>(
      "/user/personalizationstep1",
      params,
      {
        showLoading: false,
        cancelToken: apiConfig?.cancelToken,
        ...apiConfig,
      }
    ),

  // 个性化生成第二步 - 支持取消
  personalizedGenerate2: (
    params: PersonalizedGenerate2Params,
    apiConfig?: RequestConfig
  ) =>
    http.post<PersonalizedGenerateResult[]>(
      "/user/personalizationstep2",
      params,
      {
        showLoading: false,
        cancelToken: apiConfig?.cancelToken,
        ...apiConfig,
      }
    ),

  // 通过图片生成 - 支持取消
  personalizedGenerateByImage: (
    params: QuickGenerateByImageParams,
    apiConfig?: RequestConfig
  ) =>
    http.post<QuickGenerateResult>("/user/personalizationstep3", params, {
      showLoading: false,
      cancelToken: apiConfig?.cancelToken,
      ...apiConfig,
    }),
};

export const beadsApi = {
  getBeadList: (apiConfig?: RequestConfig) =>
    http.get<{ data: PersonalizedGenerateResult[] }>(
      "/user/beads",
      {},
      {
        showLoading: false,
        cancelToken: apiConfig?.cancelToken,
        ...apiConfig,
      }
    ),
  getAccessories: (apiConfig?: RequestConfig) =>
    http.get<{ data: AccessoryItem[] }>(
      "/user/accessories",
      {},
      {
        showLoading: false,
        cancelToken: apiConfig?.cancelToken,
        ...apiConfig,
      }
    ),
  getSkuList: (params?: { page?: number; size?: number }, apiConfig?: RequestConfig) =>
    http.get<{ data: any[]; total_count?: number }>(
      "/sku",
      params,
      {
        showLoading: false,
        cancelToken: apiConfig?.cancelToken,
        ...apiConfig,
      }
    )
};

export const userDesignApi = {
  getDesignList: (apiConfig?: RequestConfig) => {
    return http.get<{
      data: any;
    }>(
      `/designs`,
      {},
      {
        showLoading: false,
        cancelToken: apiConfig?.cancelToken,
        ...apiConfig,
      }
    )
  },
  getDesignItem: (designId: number, apiConfig?: RequestConfig) => {
    return http.get<{
      data: any;
    }>(
      `/designs/${designId}`,
      {},
      {
        showLoading: false,
        cancelToken: apiConfig?.cancelToken,
        ...apiConfig,
      }
    )
  }
}

export const userHistoryApi = {
  getImageHistory: (apiConfig?: RequestConfig) =>
    http.get<PersonalizedGenerateResult[]>(
      "/user/getimagehistory",
      {},
      {
        showLoading: false,
        cancelToken: apiConfig?.cancelToken,
        ...apiConfig,
      }
    ),

  getDesignById: (designId: number, apiConfig?: RequestConfig) =>
    http.post<{ data: any }>(
      `/user/getdesignitem`,
      {
        image_id: designId,
      },
      {
        showLoading: true,
        cancelToken: apiConfig?.cancelToken,
        ...apiConfig,
      }
    ),

  createOrder: (
    params: { design_id: number; tier?: number; is_custom?: boolean },
    apiConfig?: RequestConfig
  ) =>
    http.post<{
      data: {
        order_uuid: string;
      };
    }>(`/user/generateorder`, params, {
      showLoading: true,
      loadingText: "订单生成中...",
      cancelToken: apiConfig?.cancelToken,
      ...apiConfig,
    }),

  getOrderById: (orderId: string | string[], apiConfig?: RequestConfig) => {
    return http.post<{
      data: {
        any: [];
      };
    }>(
      `/user/queryorder`,
      { order_uuids: Array.isArray(orderId) ? orderId : [orderId] },
      {
        showLoading: true,
        cancelToken: apiConfig?.cancelToken,
        ...apiConfig,
      }
    )
  },


  getOrderList: (params: { page: number; size_size: number }, apiConfig?: RequestConfig) =>
    http.post<{
      data: {
        any: [];
      };
    }>(
      `/user/queryorder`,
      params,
      {
        showLoading: true,
        cancelToken: apiConfig?.cancelToken,
        ...apiConfig,
      }
    ),

  cancelOrder: (orderId: string, reason: string, apiConfig?: RequestConfig) =>
    http.post<{
      data: {
        any: [];
      };
    }>(
      `/user/cancelorder`,
      { order_uuid: orderId, reason },
      {
        showLoading: true,
        cancelToken: apiConfig?.cancelToken,
        ...apiConfig,
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
    apiConfig?: RequestConfig
  ) => {
    return http.post<InspirationResult>("/user/community/home", params, {
      cancelToken: apiConfig?.cancelToken,
      ...apiConfig,
    });
  },
  collectInspiration: (params: { work_id: string }, apiConfig?: RequestConfig) => {
    return http.post<{
      data: {
        any: [];
      };
    }>(`/user/community/collect`, params, {
      showLoading: true,
      cancelToken: apiConfig?.cancelToken,
      ...apiConfig,
    });
  },
  cancelCollectInspiration: (
    params: { work_id: string },
    apiConfig?: RequestConfig
  ) => {
    return http.post<{
      data: {
        any: [];
      };
    }>(`/user/community/uncollect`, params, {
      showLoading: true,
      cancelToken: apiConfig?.cancelToken,
      ...apiConfig,
    });
  },
  getCollectInspiration: (
    params: { page: number; pageSize: number },
    apiConfig?: RequestConfig
  ) => {
    return http.post<InspirationResult>("/user/community/collections", params, {
      cancelToken: apiConfig?.cancelToken,
      ...apiConfig,
    });
  },
  viewWorkDetail: (params: { work_id: string }, apiConfig?: RequestConfig) => {
    return http.post<{
      data: {
        any: [];
      };
    }>(`/user/community/work/view`, params, {
      showLoading: false,
      cancelToken: apiConfig?.cancelToken,
      ...apiConfig,
    });
  },
  getInspirationBanner: (apiConfig?: RequestConfig) => {
    return http.get<any>(
      `/configs/banners`,
      {},
      { cancelToken: apiConfig?.cancelToken, ...config }
    );
  }
};

// 文件相关API
export const fileApi = {
  // 上传文件 - 支持取消
  upload: (
    filePath: string,
    formData?: Record<string, any>,
    apiConfig?: RequestConfig
  ) => http.upload("/upload", filePath, formData, apiConfig?.cancelToken),
};

export const configApi = {
  getPriceTierConfig: (apiConfig?: RequestConfig) => {
    return http.get<{
      data: any;
    }>("/configs/tier_desc", {}, {
      cancelToken: apiConfig?.cancelToken,
      ...apiConfig,
    });
  }
}

export interface Product {
  id: string;
  image_urls: string[];
  name: string;
  category: string;
  description: string;
  reference_price: number;
  final_price: number;
  material: string;
  size: string;
}

export interface ProductListResponse extends BaseResponse {
  data: {
    page: number;
    page_size: number;
    total: number;
    list: Product[];
  };
}

export interface ProductDetailResponse extends BaseResponse {
  data: Product;
}

export const productApi = {
  getProductList: (
    params: { page: number; page_size: number },
    apiConfig?: RequestConfig
  ) => {
    return http.get<ProductListResponse>("/products", params, {
      cancelToken: apiConfig?.cancelToken,
      ...apiConfig,
    });
  },
  getProductDetail: (productId: string, apiConfig?: RequestConfig) => {
    return http.get<ProductDetailResponse>(
      `/products/${productId}`,
      {},
      {
        cancelToken: apiConfig?.cancelToken,
        ...apiConfig,
      }
    );
  },
};

// 导出所有API
export default {
  user: userApi,
  generate: generateApi,
  bead: beadsApi,
  userHistory: userHistoryApi,
  inspiration: inspirationApi,
  product: productApi,
};
