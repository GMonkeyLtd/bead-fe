import { ApiConfig } from "./api";
import http from "./request";


export default {
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
  }
};