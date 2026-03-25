import dotenv from "dotenv";
import sql    from "mssql";
dotenv.config();

export const config: sql.config = {
  user    : process.env.DB_USER         || "user",
  password: process.env.DB_PASSWORD     || "123",
  server  : process.env.DB_SERVER       || "localhost",
  database: process.env.DB_DATABASENAME || "BK_RECURSOS",
  // options : {
  //   trustedConnection: true,
  // },
  options: {
    encrypt               : true,   // si usas TLS
    trustServerCertificate: true,   // <--- ignora certificados autofirmados
  },
  parseJSON     : true,
  pool          : { max: 200, min: 0, idleTimeoutMillis: 10000 },
  requestTimeout: 300000 // 👈 aquí sí es válido                                          // GLOBAL - 2 minutos
};

// === Config de ZKTeco BioTime ===
export const ZKTECO_CONFIG = {
  ZKTECO_BASE_URL                   : process.env.ZKTECO_BASE_URL ?? "",
  ZKTECO_USERNAME                   : process.env.ZKTECO_USERNAME ?? "admin",
  ZKTECO_PASSWORD                   : process.env.ZKTECO_PASSWORD ?? "admin123",
  // Auth
  ZKTECO_BASE_URL_JWT_API_TOKEN_AUTH: "/jwt-api-token-auth/",
  // Personnel
  // Device
};

export const STORE_PROCEDURE = {
  ADMS: {
    GETREQUEST: "[ADMS].[GET_REQUEST]",
    CDATA     : "[ADMS].[CDATA]"
  },
  SSCA: {
    SSCA_SP_GERENCIA_LIST                                : "[SSCA].[SP_GERENCIA_LIST]",
    SSCA_SP_CENTRO_COSTO_LIST                            : "[SSCA].[SP_CENTRO_COSTO_LIST]",
    SSCA_SP_BIOTIME_AREA_INSERT_JSON                     : "[SSCA].[SP_BIOTIME_AREA_INSERT_JSON]",
    SSCA_SP_BIOTIME_AREA_INSERT                          : "[SSCA].[SP_BIOTIME_AREA_INSERT]",
    SSCA_SP_PERSONAL_S10_LIST                            : "[SSCA].[SP_PERSONAL_S10_LIST]",
    SSCA_SP_BIOTIME_PERSONAL_JSON_SYNC                   : "[SSCA].[SP_BIOTIME_PERSONAL_JSON_SYNC]",
    SSCA_SP_BIOTIME_PERSONAL_LIST                        : "[SSCA].[SP_BIOTIME_PERSONAL_LIST]",
    SSCA_SP_BIOTIME_PERSONAL_UPDATE_FROM_ZK              : "[SSCA].[SP_BIOTIME_PERSONAL_UPDATE_FROM_ZK]",
    SSCA_SP_PARAMETROS_SISTEMA_LIST                      : "[SSCA].[SP_PARAMETROS_SISTEMA_LIST]",
    SSCA_SP_BIOTIME_TRANSACCIONES_INSERT                 : "[SSCA].[SP_BIOTIME_TRANSACCIONES_INSERT]",
    SSCA_SP_SINCRONIZAR_BIOTIME_MARCACION_PERSONAL       : "[SSCA].[SP_SINCRONIZAR_BIOTIME_MARCACION_PERSONAL]",
    SSCA_NOTIFICACION_REPORTE_MARCACIONES_POR_FECHA      : "[SSCA].[NOTIFICACION_REPORTE_MARCACIONES_POR_FECHA]",
    SSCA_NOTIFICACION_REPORTE_MARCACIONES_POR_FECHA_EXCEL: "[SSCA].[NOTIFICACION_REPORTE_MARCACIONES_POR_FECHA_EXCEL]",
    SSCA_SP_ADMS_PERSONAL_SYNC                           : "[SSCA].[SP_ADMS_PERSONAL_SYNC]",
    SSCA_SP_ADMS_MARCACIONES_INSERT                      : "[SSCA].[SP_ADMS_MARCACIONES_INSERT]",
    SSCA_SP_SINCRONIZAR_ADMS_MARCACION_PERSONAL          : "[SSCA].[SP_SINCRONIZAR_ADMS_MARCACION_PERSONAL]",
    SSCA_SP_ADMS_HUELLAS_UPSERT                          : "[SSCA].[SP_ADMS_HUELLAS_UPSERT]",
    SSCA_SP_ADMS_HUELLAS_GET_BY_PIN                      : "[SSCA].[SP_ADMS_HUELLAS_GET_BY_PIN]",
    SSCS_SP_ADMS_FACIALES_GET_BY_PIN                     : "[SSCA].[SP_ADMS_FACIALES_GET_BY_PIN]",
  },
  TRABAJADOR: {
    GET_PERSONAL : "[MARCACION].[usp_ListarPersonal]",
    SYNC_PERSONAL: "[MARCACION].[usp_SincronizarMarcaciones]"
  },
};
