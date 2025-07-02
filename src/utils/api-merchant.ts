import http, { setMerchantBaseURL } from "./request";

// 在应用启动时设置API基础URL
// setBaseURL("http://gmonkey.ai:8088/api/v1");
// setMerchantBaseURL("http://106.75.254.80:8181/api/v1");
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
  phone: string;
  password: string;
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

// 定义充值相关的数据类型
export interface RechargeParams {
  amount: number; // 充值金额
}

export interface WxPayParams {
  appId: string;
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: string;
  paySign: string;
}

export interface RechargeResult {
  order_id: string;
  amount: number;
  wx_pay_params: WxPayParams;
}

// 用户相关API
export const userApi = {
  // 用户登录 - 跳过认证检查，避免循环依赖
  login: (params: LoginParams) =>
    http.post<LoginResult>("/merchant/login", params, {
      skipAuth: true,
      showLoading: true,
    }),

  // 获取用户信息
  getUserInfo: () => http.post<User>(`/user/getuserinfo`),

  // 更新用户信息
  updateUser: (data: Partial<User>) =>
    http.post<User>(`/user/updateuserinfo`, data),

  // 用户退出登录
  logout: () => http.post("/auth/logout"),

  getOrderList: () => {
    // return new Promise((resolve) => {
    //   setTimeout(() => {
    //     resolve(orderList);
    //   }, 1000);
    // });

    return http.post("/merchant/getorderlist", { page: 0, page_size: 0 });
  },

  getDispatch: () => {
    return http.post("/merchant/getdispatch", { page: 0, page_size: 0 });
  },

  grabOrder: (orderId: string) => {
    return http.post("/merchant/graborder", { order_uuid: orderId });
  },
  cancelOrder: (orderId: string) => {
    return http.post("/merchant/cancelorder", { order_uuid: orderId });
  },
  completeOrder: (orderId: string) => {
    return http.post("/merchant/finishorder", { order_uuid: orderId });
  },

  getMerchantInfo: () => {
    return http.post("/merchant/getmerchantinfo");
  },  

  // 微信充值
  recharge: (params: RechargeParams) =>
    http.post<RechargeResult>("/merchant/recharge", params, {
      showLoading: true,
    }),

  // 查询充值记录
  getRechargeHistory: (page: number = 0, pageSize: number = 10) =>
    http.post("/merchant/getrechargehistory", { 
      page, 
      page_size: pageSize 
    }),

  // 充值结果查询
  queryRechargeResult: (orderId: string) =>
    http.post("/merchant/queryrechargeresult", { order_id: orderId }),
};

// 导出所有API
export default {
  user: userApi,
};
