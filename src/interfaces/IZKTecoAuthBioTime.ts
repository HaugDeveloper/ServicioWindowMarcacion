// Request de login
export interface IZktecoAuthRequest {
  username: string;
  password: string;
}

// Response de login
export interface IZktecoAuthResponse {
  token      ?: string;  // JWT
  refresh    ?: string;
  detail     ?: string;  // en caso de error
  [k: string] : any;
}

// Opciones generales para request
export interface IZktecoRequestOptions {
  path   : string;                             // ej: "personnel/api/areas/"
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body  ?: Record<string, any>;
  token ?: string;                             // JWT o Token normal
  params?: Record<string, any>;                // soporte query params
}

export interface IApiResponse<T = any> {
  status : boolean;
  code   : number;
  message: string;
  data?  : T;
}
