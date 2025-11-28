import config from "../../config";
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
    http.post<{ data: User }>(
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

  // 获取邀请用户列表
  getReferralUsers: (config?: ApiConfig) =>
    http.get<{ data: ReferralStats }>(
      "/user/referral/users",
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
  getAccessories: (config?: ApiConfig) =>
    http.get<{ data: AccessoryItem[] }>(
      "/user/accessories",
      {},
      {
        showLoading: false,
        cancelToken: config?.cancelToken,
        ...config,
      }
    ),
  getSkuList: (params?: { page?: number; size?: number }, config?: ApiConfig) =>
    http.get<{ data: any[]; total_count?: number }>(
      "/sku",
      params,
      {
        showLoading: false,
        cancelToken: config?.cancelToken,
        ...config,
      }
    )
};

export const userDesignApi = {
  getDesignList: (config?: ApiConfig) => {
    return http.get<{
      data: any;
    }>(
      `/designs`,
      {},
      {
        showLoading: false,
        cancelToken: config?.cancelToken,
        ...config,
      }
    )
  },
  getDesignItem: (designId: number, config?: ApiConfig) => {
    return http.get<{
      data: any;
    }>(
      `/designs/${designId}`,
      {},
      {
        showLoading: false,
        cancelToken: config?.cancelToken,
        ...config,
      }
    )
  }
}

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
    http.post<{ data: any }>(
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
    params: { design_id: number; tier?: number; is_custom?: boolean },
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


  getOrderList: (params: { page: number; size_size: number }, config?: ApiConfig) =>
    http.post<{
      data: {
        any: [];
      };
    }>(
      `/user/queryorder`,
      params,
      {
        showLoading: true,
        cancelToken: config?.cancelToken,
        ...config,
      }
    ),

  cancelOrder: (orderId: string, reason: string, config?: ApiConfig) =>
    http.post<{
      data: {
        any: [];
      };
    }>(
      `/user/cancelorder`,
      { order_uuid: orderId, reason },
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
  getInspirationBanner: (config?: ApiConfig) => {
    return http.get<any>(
      `/configs/banners`,
      {},
      { cancelToken: config?.cancelToken, ...config }
    );
  }
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

export const configApi = {
  getPriceTierConfig: (config?: ApiConfig) => {
    return http.get<{
      data: any;
    }>("/configs/tier_desc", {}, {
      cancelToken: config?.cancelToken,
      ...config,
    });
  }
}

export interface Product {
  product_id: string;
  image_urls: string[];
  name: string;
  category: string;
  description: string;
  reference_price: number;
  final_price: number;
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
    config?: ApiConfig
  ) => {
    return http.get<ProductListResponse>("/products", params, {
      cancelToken: config?.cancelToken,
      ...config,
    });
  },
  getProductDetail: (productId: string, config?: ApiConfig) => {
    return http.get<ProductDetailResponse>(
      `/products/${productId}`,
      {},
      {
        cancelToken: config?.cancelToken,
        ...config,
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
