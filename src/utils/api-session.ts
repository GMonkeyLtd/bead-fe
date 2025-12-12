import { ApiConfig } from "./api";
import http from "./request";

export interface MessageItem {
  message_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  draft_id?: string;
  draft_index?: number;
  recommends?: string[];
}

export interface BaseResponse {
  code: number;
  message: string;
  data: any;
}

export interface SpuInfo {
  brightness: number;
  category: string;
  color: string[];
  func_summary: string;
  funcs: string[];
  id: number;
  image_url: string;
  name: string;
  wuxing: string[];
}

export interface BeadItem extends SpuInfo {
  sku_id: number;
  spu_id: number;
  cost_price: number;
  reference_price: number;
  quantity: number;
  diameter: number;
  width: number;
  shape: number;
  spu_type: number;
  image_aspect_ratio: number;
  spu_info?: SpuInfo;
  // 新增：穿线高度比例，0.5表示从中心穿过，0表示从顶部穿过，1表示从底部穿过
  passHeightRatio?: number;
  // 运行时计算的属性
  ratioBeadWidth?: number;
  render_diameter?: number;
  display_width?: number;
  hole_postion?: number;
}

export enum AccessoryType {
  GeHuan = 1,
  GeZhu = 2,
  SuiXing = 3,
  PaoHuan = 4,
  GuaShi = 5
}

export const AccessoryFormatMap = {
  [AccessoryType.SuiXing]: '随形',
  [AccessoryType.PaoHuan]: '跑环',
  [AccessoryType.GeHuan]: '隔环',
  [AccessoryType.GeZhu]: '隔珠',
  [AccessoryType.GuaShi]: '挂饰',
}

// 定义显示顺序，按照设计需要的顺序排列
export const AccessoryDisplayOrder = [
  AccessoryType.SuiXing,  // 随形
  AccessoryType.PaoHuan,  // 跑环
  AccessoryType.GeHuan,   // 隔环
  AccessoryType.GeZhu,    // 隔珠
  AccessoryType.GuaShi,   // 挂饰
]

export interface AccessoryItem {
  id: string;
  type: AccessoryType;
  image_url: string;
  name: string;
  width: number;
  diameter: number;
  quality: number;
  shape: number;
}

export interface BraceletDraft {
  session_id: string;
  draft_id: string;
  user_id: number;
  progress: number;
  wuxing: string[];
  size: number;
  items: BeadItem[];
  created_at: string;
  name: string;
  description: string;
  design_id?: string;
}

export interface CreateSessionResponse extends BaseResponse {
  data: {
    session_id: string;
    messages: MessageItem[];
    recommends: string[];
    latest_draft: BraceletDraft;
    created_at: string;
  };
}

export interface ChatMessageItem {
  message_id: string;
  role: "assistant" | "user" | "system";
  content: string;
  created_at: string;
  draft_id?: string;
  draft_index?: number;
}

export interface ChatResponse extends BaseResponse {
  data: {
    messages: {
      session_id: string;
      message_id: string;
      role: "assistant" | "user" | "system";
      content: string;
      recommends: string[];
      created_at: string;
    }[]
  };
}

export interface SessionDetailResponse extends BaseResponse {
  data: {
    session_id: string;
    title: string;
    messages: MessageItem[];
    created_at: string;
  };
}

export interface DesignDraftResponse extends BaseResponse {
  data: {
    session_id: string;
    draft_id: string;
    user_id: number;
    progress: number;
    wuxing: string[];
    wishes: string[];
    size: number;
    name: string;
    beads: BeadItem[];
    created_at: string;
    updated_at: string;
  };
}

export interface TDesign {
  progress: number;
  image_url: string;
  design_id: string;
  draft_id: string;
  reference_price: number;
  session_id: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  info: {
    name: string;
    description: string;
    wuxing: string[];
    rizhu: string;
    spec: {
      wrist_size: number;
      diameter: number;
      count: number;
      is_default: boolean;
    };
    personal_report: string;
    pub_report: string;
    wishes: string[];
    items: BeadItem[];
    tier_info: { current_tier: number, reference_price: number };
    tier_price: { [key: string]: number };
  };
  order_uuids?: string[];
}

export interface DesignProgressResponse extends BaseResponse {
  data: TDesign;
}

export default {
  // 创建会话
  createSession: (
    params: {
      birth_info: {
        birth_year: number;
        birth_month: number;
        birth_day: number;
        birth_hour: number;
        is_lunar: boolean;
        sex: number;
      };
      message?: string;
    },
    config?: ApiConfig
  ) => {
    return http.post<CreateSessionResponse>("/user/sessions", params, {
      // showLoading: false,
      cancelToken: config?.cancelToken,
      ...config,
    });
  },

  // 发送聊天消息
  chat: (
    params: {
      session_id: string;
      message: string;
    },
    config?: ApiConfig
  ) => {

    return http.post<ChatResponse>(
      `/user/sessions/${params.session_id}/chat`,
      { message: params.message },
      {
        cancelToken: config?.cancelToken,
        ...config,
      }
    );
  },

  // 获取会话详情
  getSessionDetail: (session_id: string) => {
    return http.get<SessionDetailResponse>(
      `/user/sessions/${session_id}/history`,
      {},
      {
        showLoading: true,
        loadingText: "设计信息查询中...",
      }
    );
  },

  // 获取最后一次会话
  getLastSession: (config?: ApiConfig) => {
    return http.get<SessionDetailResponse>("/user/sessions/latest");
  },

  // 获取设计稿详情
  getDesignDraft: (
    params: { session_id: string; draft_id: string },
    config?: ApiConfig
  ) => {
    return http.get<DesignDraftResponse>(
      `/user/sessions/${params.session_id}/drafts/${params.draft_id}`
      // {
      //   cancelToken: config?.cancelToken,
      //   ...config,
      // }
    );
  },

  generateDesignByDraftImage: (
    params: {
      session_id: string;
      draft_id: string;
      image_url: string;
    },
    config?: ApiConfig
  ) => {
    return http.post<{ design_id: string }>(
      `/user/sessions/${params.session_id}/drafts/${params.draft_id}/design`,
      {
        base64_image: params.image_url,
      },
      {
        cancelToken: config?.cancelToken,
        ...config,
      }
    );
  },

  cloneDraft: (
    params: {
      session_id: string;
      draft_id: string;
      beads: BeadItem[];
    },
    config?: ApiConfig
  ) => {
    return http.post<DesignDraftResponse>(
      `/user/sessions/${params.session_id}/drafts/${params.draft_id}/clone`,
      {
        Beads: params.beads,
      },
      {
        cancelToken: config?.cancelToken,
        ...config,
      }
    );
  },
  regenerateDraft: (
    params: {
      session_id: string;
      draft_id: string;
    },
    config?: ApiConfig
  ) => {
    return http.post<DesignDraftResponse>(
      `/user/sessions/${params.session_id}/drafts/${params.draft_id}/regenerate`,
      undefined,
      {
        cancelToken: config?.cancelToken,
        ...config,
      }
    );
  },

  queryDesignProgress: (
    params: {
      session_id: string;
      draft_id: string;
      design_id: string;
    },
    config?: ApiConfig
  ) => {
    return http.get<DesignProgressResponse>(
      `/user/sessions/${params.session_id}/drafts/${params.draft_id}/design`,
      {},
      {
        cancelToken: config?.cancelToken,
        ...config,
      }
    );
  },

  getChatHistory: (
    params: {
      session_id: string;
    },
    config?: ApiConfig
  ) => {
    return http.get<any>(
      `/user/sessions/${params.session_id}/history`,
      {},
      { cancelToken: config?.cancelToken, ...config }
    );
  },

  getSessionList: (
    params: {
      page: number;
      page_size: number;
    },
    config?: ApiConfig
  ) => {
    return http.get<any>(
      `/user/sessions?limit=${params.page_size}&offset=${params.page}`,
      {},
      { cancelToken: config?.cancelToken, ...config }
    );
  },

  saveDraft: (
    params: {
      session_id: string;
      beadItems: number[];
      image_base64: string;
    },
    config?: ApiConfig
  ) => {
    return http.post<{ draft: DesignDraftResponse }>(
      `/user/sessions/${params.session_id}/drafts/diy`,
      {
        items: params.beadItems,
        image_base64: params.image_base64,
      },
      {
        cancelToken: config?.cancelToken,
        ...config,
      }
    );
  },
  getDesignList: (params: { offset: number; limit: number }, config?: ApiConfig) => {
    return http.get<{
      data: any;
    }>(
      `/user/designs`,
      params,
      {
        showLoading: false,
        cancelToken: config?.cancelToken,
        ...config,
      }
    )
  },
  getSimplifiedDesignList: (params: { offset: number; limit: number }, config?: ApiConfig) => {
    return http.get<{
      data: any;
    }>(
      `/user/designs/list`,
      params,
      { cancelToken: config?.cancelToken, ...config }
    );
  },
  getDesignItem: (designId: number, config?: ApiConfig) => {
    return http.get<{
      data: any;
    }>(
      `/user/designs/${designId}`,
      undefined,
      {
        showLoading: false,
        cancelToken: config?.cancelToken,
        ...config,
      }
    )
  },
  // 商家端获取用户聊天历史
  getChatHistoryByMerchant: (
    params: {
      session_id: string;
    },
    config?: ApiConfig
  ) => {
    return http.get<any>(
      `/user/merchant_query/sessions/${params.session_id}/history`,
      {},
      { cancelToken: config?.cancelToken, ...config }
    );
  },
  // 商家端获取草稿详情
  getDraftDetailByMerchant: (
    params: {
      session_id: string;
      draft_id: string;
    },
    config?: ApiConfig
  ) => {
    return http.get<any>(
      `/user/merchant_query/sessions/${params.session_id}/drafts/${params.draft_id}`,
      {},
      { cancelToken: config?.cancelToken, ...config }
    );
  },
  uploadDraftImage: (
    params: {
      session_id: string;
      draft_id: string;
      image_base64: string;
    },
    config?: ApiConfig
  ) => {
    return http.post<any>(
      `/user/sessions/${params.session_id}/drafts/${params.draft_id}/image`,
      {
        image_base64: params.image_base64,
      },
      { cancelToken: config?.cancelToken, ...config }
    );
  },
  uploadProductImage: (
    params: {
      design_id: string;
      image_base64: string;
    },
    config?: ApiConfig
  ) => {

    return http.post<any>(
      `/user/designs/${params.design_id}/image`,
      {
        image_base64: params.image_base64,
      },
      { cancelToken: config?.cancelToken, ...config }
    );
  },
  saveDiyDesign: (
    params: {
      beadItems: number[];
      image_base64: string;
      wrist_size: number;
    },
    config?: ApiConfig
  ) => {
    return http.post<any>(
      `/user/designs/diy`,
      {
        items: params.beadItems,
        image_base64: params.image_base64,
        wrist_size: params.wrist_size,
      },
      { cancelToken: config?.cancelToken, ...config }
    );
  },
  deleteDesign: (designId: number, config?: ApiConfig) => {
    return http.delete<any>(
      `/user/designs/${designId}`,
      { cancelToken: config?.cancelToken, ...config }
    );
  },
  getDiyInspiration: (config?: ApiConfig) => {
    return http.post<any>(
      `/user/diy/inspiration`,
      {},
      { cancelToken: config?.cancelToken, ...config }
    );
  },
  getFeatureFlag: (config?: ApiConfig) => {
    return http.get<any>(
      `/configs/features`,
      {},
      { cancelToken: config?.cancelToken, ...config }
    );
  }
};
