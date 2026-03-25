import axios, { AxiosResponse } from "axios";
import { ZKTECO_CONFIG }        from "../config/conf";
import {
  IZktecoAuthRequest,
  IZktecoAuthResponse,
  IZktecoRequestOptions,
} from "../interfaces/IZKTecoAuthBioTime";

export class ZKTeco_Auth_BioTime {
  private baseUrl : string;
  private path    : string;
  private username: string;
  private password: string;

  // cache interno
  private staticToken   : string | null    = null;
  private staticTokenExp: number | null = null

  constructor() {
    this.baseUrl  = ZKTECO_CONFIG.ZKTECO_BASE_URL;
    this.path     = ZKTECO_CONFIG.ZKTECO_BASE_URL_JWT_API_TOKEN_AUTH;
    this.username = ZKTECO_CONFIG.ZKTECO_USERNAME;
    this.password = ZKTECO_CONFIG.ZKTECO_PASSWORD;
  }

  async JwtApiTokenAuth(
    username?: string,
    password?: string
  ): Promise<IZktecoAuthResponse | null> {
    const url = `${this.baseUrl}${this.path}`;
    const payload: IZktecoAuthRequest = {
      username: username,
      password: password,
    };
    
    try {
      const response: AxiosResponse<IZktecoAuthResponse> = await axios.post(url, payload, {
        headers: { "Content-Type": "application/json" },
      });
      return response.data;
    } catch (err: any) {
      console.error("Error en login ZKTECO:", err.response?.data || err.message);
      return null;
    }
  }

  // Método para obtener token estático de admin/admin123
  async getStaticToken(): Promise<string | null> {
    const now = Math.floor(Date.now() / 1000);

    // si existe token en cache y no ha expirado
    if (this.staticToken && this.staticTokenExp && this.staticTokenExp > now) {
      return this.staticToken;
    }

    // login fijo
    const response = await this.JwtApiTokenAuth(ZKTECO_CONFIG.ZKTECO_USERNAME, ZKTECO_CONFIG.ZKTECO_PASSWORD);
    if (response?.token) {
      this.staticToken    = response.token;
      this.staticTokenExp = now + 3600;  // dura 1h (ajustar según ZK)
      return this.staticToken;
    }

    return null;
  }

  async request<T = any>(
    options: IZktecoRequestOptions
  ): Promise<T | null> {
    const { path, method = "GET", body, token, params } = options;
    const url = `${this.baseUrl}${path}`;
    // console.log('url:>>> ', url)

    try {
      const response: AxiosResponse<T> = await axios.request({
        url,
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `JWT ${token}` } : {}),
        },
        data  : body,
        params, // aquí lo pasas directo
      });
      return response.data;
    } catch (err: any) {
      if (err.response) {
        console.error(
          `Error en request ZKTECO zkteco_auth_biotime.ts: ${err.response.status} - ${err.response.statusText}`
        );
      } else {
        console.error("Error en request ZKTECO zkteco_auth_biotime.ts:", err.message);
      }
      return null;
    }
  }

}