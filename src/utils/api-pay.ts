import { ApiConfig } from "./api";
import http from "./request";


export default {
  getReferencePrice: (params: {
    design_id: string;
  }, config?: ApiConfig) => {
    return http.get<any>(`/user/reference_price/${params.design_id}`, config);
  },
};