// Respuesta cruda de ZKTeco
export interface IZKTecoApiResponse<T = any> {
  count   : number;
  next   ?: string | null;
  previous?: string | null;
  msg    ?: string;
  code   ?: number;
  data   ?: T[];
}

// Tu respuesta estándar
export interface IResponse<T = any> {
  status       : boolean;
  code         : number;
  message     ?: string;
  metadata    ?: T | null;
  zkteco_token?: string;
}
