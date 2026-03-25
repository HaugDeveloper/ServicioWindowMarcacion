import axios, { AxiosResponse } from "axios";
import { ZKTECO_CONFIG }        from "../config/conf";
import {
  IZktecoAuthRequest,
  IZktecoAuthResponse,
  IZktecoRequestOptions,
} from "../interfaces/IZKTecoAuthBioTime";

class ZKTeco_Personnel_BioTime<T = any> {

  private baseUrl : string;
  private path    : string;

  constructor() {
    this.baseUrl  = ZKTECO_CONFIG.ZKTECO_BASE_URL;
    this.path     = ZKTECO_CONFIG.ZKTECO_BASE_URL_JWT_API_TOKEN_AUTH;
  }

  async request<T = any>(
    options: IZktecoRequestOptions
  ): Promise<T | null> {
    const { path, method = "GET", body, token } = options;
    const url = `${this.baseUrl}${path}`;

    try {
      const resp: AxiosResponse<T> = await axios.request({
        url,
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `JWT ${token}` } : {}),
        },
        data: body,
      });
      return resp.data;
    } catch (err: any) {
      console.error("Error en request ZKTECO zkteco_personnel_biotime.ts:", err.response?.data || err.message);
      return null;
    }
  }
}

export default ZKTeco_Personnel_BioTime;