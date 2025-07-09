import { ApiConfig } from "./api";
import http, { setBaseURL, setIsMock, CancelToken } from "./request";

export interface MessageItem {
  message_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface BaseResponse {
  code: number;
  message: string;
  data: any;
}

export interface BeadItem {
  id: string;
  name: string;
  image_url: string;
  color: string;
  wuxing: string;
  english: string;
  bead_diameter: number;
  funcs: string[];
}

export interface CreateSessionResponse extends BaseResponse {
  data: {
    session_id: string;
    messages: MessageItem[];
    recommends: string[];
    latest_draft: {
      session_id: string;
      draft_id: string;
      user_id: number;
      progress: number;
      wuxing: string[];
      size: number;
      beads: BeadItem[];
      created_at: string;
    };
    created_at: string;
  };
}

export interface ChatResponse extends BaseResponse {
  data: {
    session_id: string;
    message_id: string;
    role: "assistant" | "user";
    content: string;
    recommends: string[];
    created_at: string;
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
      `/user/sessions/${session_id}/history`
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
      `/user/sessions/${params.session_id}/drafts/${params.draft_id}`,
      // {
      //   cancelToken: config?.cancelToken,
      //   ...config,
      // }
    );
  },
};
