import { AddressInfo } from "@/components/LogisticsCard";
import { ApiConfig } from "./api";
import http from "./request";


export default {
  addAddressToOrder: (params: { 
    order_uuid: string,
    detail_info: string,
    province_name: string,
    city_name: string,
    county_name: string,
    tel_number: string,
    user_name: string,
    national_code: string,
    postal_code: string,
  }, config?: ApiConfig) => {
    return http.post<any>(`/user/address`, params, config);
  },
  getReferencePrice: (params: {
    design_id: string;
  }, config?: ApiConfig) => {
    return http.get<any>(`/user/reference_price/${params.design_id}`, undefined, config);
  },
  getWaybillToken: (params: {
    order_id: string;
  }, config?: ApiConfig) => {
    return http.get<any>(`/user/orders/${params.order_id}/waybill_token`, undefined, config);
  },
  applyRefund: (params: { orderId: string, reason: string }, config?: ApiConfig) =>
    http.post<{
      data: any;
    }>(
      `/user/apply_refund`,
      { order_uuid: params.orderId, reason: params.reason },
      {
        showLoading: true,
        cancelToken: config?.cancelToken,
        ...config,
      }
    ),
  withdrawRefund: (params: { orderId: string }, config?: ApiConfig) =>
    http.post<any>(`/user/cancel_refund`, { order_uuid: params.orderId }, config),
  purchase: (params: { orderId: string, amount: number }, config?: ApiConfig) =>
    http.post<{
      data: {
        "trade_uuid": string,
        "prepay_id": string,
        "nonce_str": string,
        "package": string,
        "sign_type": "RSA",
        "pay_sign": string,
        "timestamp": string
      };
    }>(
      `/user/submit_payment`,
      { order_uuid: params.orderId, amount: params.amount },
      {
        showLoading: true,
        cancelToken: config?.cancelToken,
        ...config,
      }
    ),
  queryPayStatus: (params: { orderId: string }, config?: ApiConfig) =>
    http.post<{
      data: any;
    }>(`/user/query_payment_status`, { order_uuid: params.orderId }, config),
  confirmOrder: (params: {
    order_id: string;
  }, config?: ApiConfig) => {
    return http.get<any>(`/user/orders/${params.order_id}/confirm_receipt`, undefined, config);
  },
  confirmOrderCallback: (params: { orderId: string }, config?: ApiConfig) =>
    http.post<any>(`/user/orders/${params.orderId}/confirm_receipt/callback`, { success: true, }, config),
  confirmReceiptCallback: (params: { orderId: string }, config?: ApiConfig) =>
    http.get<any>(`/user/orders/${params.orderId}/confirm_receipt/callback`, undefined, config),
};
