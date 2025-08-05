import { AddressInfo } from "@/components/LogisticsCard";
import { ApiConfig } from "./api";
import http from "./request";


export default {
  addAddressToOrder: (params: AddressInfo & { order_uuid: string }, config?: ApiConfig) => {
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
  confirmOrder: (params: {
    order_id: string;
  }, config?: ApiConfig) => {
    return http.get<any>(`/user/orders/${params.order_id}/confirm_receipt`, undefined, config);
  },
  applyRefund: (params: {orderId: string, reason: string}, config?: ApiConfig) =>
    http.post<{
      data: {
        any: [];
      };
    }>(
      `/user/apply_refund`,
      { order_uuid: params.orderId, params.reason },
      {
        showLoading: true,
        cancelToken: config?.cancelToken,
        ...config,
      }
    ),
  purchase: (params: {orderId: string, amount: number},  config?: ApiConfig) =>
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
      { order_uuid: params.orderId, params.amount },
      {
        showLoading: true,
        cancelToken: config?.cancelToken,
        ...config,
      }
    ),
};