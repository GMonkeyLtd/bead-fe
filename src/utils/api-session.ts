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
    messages: {
      role: "system";
      content: string;
      created_at: string;
    }[];
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
    // return new Promise((resolve) => {
    //   resolve({
    //     code: 200,
    //     message: "ok",
    //     data: {
    //       session_id: "197e9143aceb5a90f66ddb15df9",
    //       messages: [
    //         {
    //           role: "system",
    //           content: "你好，我是水晶疗愈师，很高兴为你服务。",
    //           created_at: "2025-07-08T16:08:26.574665449+08:00",
    //         },
    //       ],
    //       recommends: [
    //         "升职加薪",
    //         "招财进宝",
    //         "创业成功",
    //         "增强事业运",
    //         "增强自信",
    //       ],
    //       latest_draft: {
    //         session_id: "197e9143aceb5a90f66ddb15df9",
    //         draft_id: "197e9143ad2552034a472eacdfc",
    //         user_id: 2,
    //         progress: 100,
    //         wuxing: ["木", "火"],
    //         wishes: null,
    //         size: 20,
    //         name: "招财进宝",
    //         beads: [
    //           {
    //             bead_id: 7,
    //             name: "绿幽灵",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["木"],
    //             funcs: [
    //               "招财进宝",
    //               "创业成功",
    //               "增强事业运",
    //               "改善人际关系",
    //               "增强活力",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 15,
    //             name: "翡翠",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["木"],
    //             funcs: [
    //               "招财进宝",
    //               "改善人际关系",
    //               "增强活力",
    //               "保护健康",
    //               "增强智慧",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 16,
    //             name: "红宝石",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["火"],
    //             funcs: [
    //               "增强桃花运",
    //               "增强活力",
    //               "改善血液循环",
    //               "增强勇气",
    //               "偏财运",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 24,
    //             name: "绿发晶",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["木"],
    //             funcs: [
    //               "招财进宝",
    //               "偏财运",
    //               "增强事业运",
    //               "改善人际关系",
    //               "增强活力",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 25,
    //             name: "红发晶",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["火"],
    //             funcs: [
    //               "增强桃花运",
    //               "偏财运",
    //               "增强活力",
    //               "改善血液循环",
    //               "增强勇气",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 3,
    //             name: "紫水晶",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["火"],
    //             funcs: [
    //               "缓解压力",
    //               "改善睡眠",
    //               "增强直觉",
    //               "提升智慧",
    //               "偏财运",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 6,
    //             name: "粉晶",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E9%9D%92%E9%87%91%E7%9F%B3.png",
    //             color: "",
    //             wuxing: ["火"],
    //             funcs: [
    //               "增强桃花运",
    //               "婚姻和谐",
    //               "修复感情",
    //               "改善人际关系",
    //               "增强爱心",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 9,
    //             name: "青金石",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["木"],
    //             funcs: [
    //               "提升学习效率",
    //               "增强记忆力",
    //               "改善人际关系",
    //               "增强沟通能力",
    //               "提升智慧",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 11,
    //             name: "红玛瑙",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E9%9D%92%E9%87%91%E7%9F%B3.png",
    //             color: "",
    //             wuxing: ["火"],
    //             funcs: [
    //               "增强桃花运",
    //               "增强活力",
    //               "改善血液循环",
    //               "增强勇气",
    //               "保护气场",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 13,
    //             name: "绿松石",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["木"],
    //             funcs: [
    //               "改善人际关系",
    //               "增强沟通能力",
    //               "保护旅行",
    //               "增强活力",
    //               "平衡情绪",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 18,
    //             name: "石榴石",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["火"],
    //             funcs: [
    //               "增强桃花运",
    //               "改善血液循环",
    //               "增强活力",
    //               "保护气场",
    //               "增强勇气",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 10,
    //             name: "海蓝宝",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["水"],
    //             funcs: [
    //               "增强沟通能力",
    //               "改善人际关系",
    //               "平衡情绪",
    //               "增强直觉",
    //               "保护旅行",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 14,
    //             name: "珍珠",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["金", "水"],
    //             funcs: [
    //               "增强桃花运",
    //               "婚姻和谐",
    //               "改善皮肤",
    //               "平衡情绪",
    //               "增强女性魅力",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 17,
    //             name: "蓝宝石",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["水"],
    //             funcs: [
    //               "增强智慧",
    //               "改善人际关系",
    //               "增强直觉",
    //               "保护旅行",
    //               "平衡情绪",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 20,
    //             name: "白玉",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["金"],
    //             funcs: [
    //               "净化心灵",
    //               "增强记忆力",
    //               "提升学习效率",
    //               "平衡能量场",
    //               "增强智慧",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 1,
    //             name: "白水晶",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["金"],
    //             funcs: [
    //               "净化心灵",
    //               "增强记忆力",
    //               "提升学习效率",
    //               "平衡能量场",
    //               "增强人体能量",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 2,
    //             name: "黑曜石",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["水"],
    //             funcs: [
    //               "辟邪护身",
    //               "吸收负能量",
    //               "保护气场",
    //               "增强意志力",
    //               "守财聚财",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 4,
    //             name: "月光石",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["金", "水"],
    //             funcs: [
    //               "增强桃花运",
    //               "改善睡眠",
    //               "平衡情绪",
    //               "修复感情",
    //               "婚姻和谐",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 5,
    //             name: "黄水晶",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["土"],
    //             funcs: [
    //               "招财进宝",
    //               "升职加薪",
    //               "创业成功",
    //               "增强自信",
    //               "偏财运",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 8,
    //             name: "虎眼石",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["土"],
    //             funcs: [
    //               "招财进宝",
    //               "守财聚财",
    //               "创业成功",
    //               "增强意志力",
    //               "保护气场",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 12,
    //             name: "茶晶",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["土"],
    //             funcs: [
    //               "守财聚财",
    //               "改善睡眠",
    //               "增强意志力",
    //               "平衡能量",
    //               "保护气场",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 19,
    //             name: "琥珀",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["土"],
    //             funcs: [
    //               "守财聚财",
    //               "改善睡眠",
    //               "增强活力",
    //               "保护健康",
    //               "平衡情绪",
    //             ],
    //             diameter: 10,
    //           },
    //         ],
    //       },
    //       created_at: "2025-07-08T16:08:26.577+08:00",
    //     },
    //   });
    // });
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
    // return new Promise((resolve) => {
    //   resolve({
    //     code: 200,
    //     message: "ok",
    //     data: {
    //       session_id: "197e9143aceb5a90f66ddb15df9",
    //       messages: [
    //         {
    //           role: "system",
    //           content: "你好，我是水晶疗愈师，很高兴为你服务。",
    //           created_at: "2025-07-08T16:08:26.574665449+08:00",
    //         },
    //       ],
    //       recommends: [
    //         "升职加薪",
    //         "招财进宝",
    //         "创业成功",
    //         "增强事业运",
    //         "增强自信",
    //       ],
    //       latest_draft: {
    //         session_id: "197e9143aceb5a90f66ddb15df9",
    //         draft_id: "197e9143ad2552034a472eacdfc",
    //         user_id: 2,
    //         progress: 100,
    //         wuxing: ["木", "火"],
    //         wishes: null,
    //         size: 20,
    //         name: "招财进宝",
    //         beads: [
    //           {
    //             bead_id: 7,
    //             name: "绿幽灵",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["木"],
    //             funcs: [
    //               "招财进宝",
    //               "创业成功",
    //               "增强事业运",
    //               "改善人际关系",
    //               "增强活力",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 15,
    //             name: "翡翠",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["木"],
    //             funcs: [
    //               "招财进宝",
    //               "改善人际关系",
    //               "增强活力",
    //               "保护健康",
    //               "增强智慧",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 16,
    //             name: "红宝石",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["火"],
    //             funcs: [
    //               "增强桃花运",
    //               "增强活力",
    //               "改善血液循环",
    //               "增强勇气",
    //               "偏财运",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 24,
    //             name: "绿发晶",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["木"],
    //             funcs: [
    //               "招财进宝",
    //               "偏财运",
    //               "增强事业运",
    //               "改善人际关系",
    //               "增强活力",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 25,
    //             name: "红发晶",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["火"],
    //             funcs: [
    //               "增强桃花运",
    //               "偏财运",
    //               "增强活力",
    //               "改善血液循环",
    //               "增强勇气",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 3,
    //             name: "紫水晶",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["火"],
    //             funcs: [
    //               "缓解压力",
    //               "改善睡眠",
    //               "增强直觉",
    //               "提升智慧",
    //               "偏财运",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 6,
    //             name: "粉晶",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E9%9D%92%E9%87%91%E7%9F%B3.png",
    //             color: "",
    //             wuxing: ["火"],
    //             funcs: [
    //               "增强桃花运",
    //               "婚姻和谐",
    //               "修复感情",
    //               "改善人际关系",
    //               "增强爱心",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 9,
    //             name: "青金石",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["木"],
    //             funcs: [
    //               "提升学习效率",
    //               "增强记忆力",
    //               "改善人际关系",
    //               "增强沟通能力",
    //               "提升智慧",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 11,
    //             name: "红玛瑙",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E9%9D%92%E9%87%91%E7%9F%B3.png",
    //             color: "",
    //             wuxing: ["火"],
    //             funcs: [
    //               "增强桃花运",
    //               "增强活力",
    //               "改善血液循环",
    //               "增强勇气",
    //               "保护气场",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 13,
    //             name: "绿松石",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["木"],
    //             funcs: [
    //               "改善人际关系",
    //               "增强沟通能力",
    //               "保护旅行",
    //               "增强活力",
    //               "平衡情绪",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 18,
    //             name: "石榴石",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["火"],
    //             funcs: [
    //               "增强桃花运",
    //               "改善血液循环",
    //               "增强活力",
    //               "保护气场",
    //               "增强勇气",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 10,
    //             name: "海蓝宝",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["水"],
    //             funcs: [
    //               "增强沟通能力",
    //               "改善人际关系",
    //               "平衡情绪",
    //               "增强直觉",
    //               "保护旅行",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 14,
    //             name: "珍珠",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["金", "水"],
    //             funcs: [
    //               "增强桃花运",
    //               "婚姻和谐",
    //               "改善皮肤",
    //               "平衡情绪",
    //               "增强女性魅力",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 17,
    //             name: "蓝宝石",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["水"],
    //             funcs: [
    //               "增强智慧",
    //               "改善人际关系",
    //               "增强直觉",
    //               "保护旅行",
    //               "平衡情绪",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 20,
    //             name: "白玉",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["金"],
    //             funcs: [
    //               "净化心灵",
    //               "增强记忆力",
    //               "提升学习效率",
    //               "平衡能量场",
    //               "增强智慧",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 1,
    //             name: "白水晶",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["金"],
    //             funcs: [
    //               "净化心灵",
    //               "增强记忆力",
    //               "提升学习效率",
    //               "平衡能量场",
    //               "增强人体能量",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 2,
    //             name: "黑曜石",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["水"],
    //             funcs: [
    //               "辟邪护身",
    //               "吸收负能量",
    //               "保护气场",
    //               "增强意志力",
    //               "守财聚财",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 4,
    //             name: "月光石",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["金", "水"],
    //             funcs: [
    //               "增强桃花运",
    //               "改善睡眠",
    //               "平衡情绪",
    //               "修复感情",
    //               "婚姻和谐",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 5,
    //             name: "黄水晶",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["土"],
    //             funcs: [
    //               "招财进宝",
    //               "升职加薪",
    //               "创业成功",
    //               "增强自信",
    //               "偏财运",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 8,
    //             name: "虎眼石",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["土"],
    //             funcs: [
    //               "招财进宝",
    //               "守财聚财",
    //               "创业成功",
    //               "增强意志力",
    //               "保护气场",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 12,
    //             name: "茶晶",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["土"],
    //             funcs: [
    //               "守财聚财",
    //               "改善睡眠",
    //               "增强意志力",
    //               "平衡能量",
    //               "保护气场",
    //             ],
    //             diameter: 10,
    //           },
    //           {
    //             bead_id: 19,
    //             name: "琥珀",
    //             image_url: "https://zhuluoji.cn-sh2.ufileos.com/beads/%E7%99%BD%E6%B0%B4%E6%99%B61.png",
    //             color: "",
    //             wuxing: ["土"],
    //             funcs: [
    //               "守财聚财",
    //               "改善睡眠",
    //               "增强活力",
    //               "保护健康",
    //               "平衡情绪",
    //             ],
    //             diameter: 10,
    //           },
    //         ],
    //       },
    //       created_at: "2025-07-08T16:08:26.577+08:00",
    //     },
    //   });
    // });
  },

  // 获取最后一次会话
  getLastSession: (config?: ApiConfig) => {
    return http.get<SessionDetailResponse>("/user/sessions/latest");
    // return new Promise((resolve) => {
    //   resolve({
    //     data: {
    //       session_id: "123",
    //     },
    //   });
    // });
  },

  // 获取设计稿详情
  getDesignDraft: (
    params: { session_id: string; draft_id: string },
    config?: ApiConfig
  ) => {
    return http.get<DesignDraftResponse>(
      `/user/sessions/${params.session_id}/drafts/${params.draft_id}`,
      {
        cancelToken: config?.cancelToken,
        ...config,
      }
    );
    // return new Promise((resolve) => {
    //   resolve({
    //     code: 200,
    //     message: "ok",
    //     data: {},
    //   });
    // });
  },
};
