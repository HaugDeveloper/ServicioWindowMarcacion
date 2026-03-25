import { Request } from 'express';
import DB from '../config/db';
import sql from 'mssql';
import { v4 as uuidv4 } from 'uuid';
import fs from "fs";
import path from "path";

export type LogNivel      = 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
export type LogCategoria  = 'SYSTEM' | 'DEVICE' | 'USER' | 'ATTENDANCE' | 'BIOMETRIC' | 'COMMAND' | 'SERVICE';
export type LogTipoAccion = 
  | 'ERROR'
  | 'API_CALL'
  | 'SERVICE_WINDOWS'
  | 'COMANDO_ENVIADO'
  | 'COMANDO_RECIBIDO'
  | 'MARCACION_RECIBIDA'
  | 'HUELLA_RECIBIDA'
  | 'FACIAL_RECIBIDO'
  | 'USUARIO_CREADO'
  | 'USUARIO_RECIBIDO'
  | 'USUARIO_ACTUALIZADO'
  | 'USUARIO_ELIMINADO'
  | 'DISPOSITIVO_REGISTRADO'
  | 'ERROR';

export interface LogUniversalData {
  tipo_accion        ?: LogTipoAccion;
  categoria          ?: LogCategoria;
  nivel              ?: LogNivel;
  metodo_http        ?: string;
  endpoint           ?: string;
  ip_origen          ?: string;
  user_agent         ?: string;
  sn_dispositivo     ?: string;
  modelo_dispositivo ?: string;
  usuario_app        ?: string;
  pin_usuario        ?: string;
  descripcion        ?: string;
  datos_enviados     ?: any;
  datos_recibidos    ?: any;
  comando_enviado    ?: string;
  resultado          ?: any;
  tiempo_ejecucion_ms?: number;
  filas_afectadas    ?: number;
  codigo_respuesta   ?: number;
  session_id         ?: string;
  request_id         ?: string;
}

export interface LogDispositivoData {
  sn_dispositivo          : string;
  modelo                 ?: string;
  firmware_version       ?: string;
  ip_dispositivo         ?: string;
  tipo_comunicacion       : 'GETREQUEST' | 'CDATA' | 'QUERYDATA' | 'DEVICECMD';
  direccion               : 'IN' | 'OUT';
  metodo                 ?: string;
  query_params           ?: any;
  body_raw               ?: string;
  body_procesado         ?: string;
  tabla_cdata            ?: 'ATTLOG' | 'OPERLOG' | 'BIODATA' | 'USER' | null;
  lineas_procesadas      ?: number;
  registros_guardados    ?: number;
  respuesta_enviada      ?: string;
  codigo_error           ?: number;
  mensaje_error          ?: string;
  tiempo_procesamiento_ms?: number;
  tamano_bytes           ?: number;
  request_id             ?: string;
}

class Logger {
  private static instance: Logger;
  private requestId: string;

  private constructor() {
    this.requestId = uuidv4();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public setRequestId(id: string) {
    this.requestId = id;
  }

  public getRequestId(): string {
    return this.requestId;
  }

  // =============================================
  // LOG UNIVERSAL
  // =============================================
  public async logUniversal(data: LogUniversalData): Promise<number | null> {
    try {
      const startTime = Date.now();

      const result = await DB.exec(
        [
          { name: 'pTIPO_ACCION', value: data.tipo_accion, type: sql.VarChar(50) },
          { name: 'pCATEGORIA', value: data.categoria, type: sql.VarChar(50) },
          { name: 'pNIVEL', value: data.nivel || 'INFO', type: sql.VarChar(20) },
          { name: 'pMETODO_HTTP', value: data.metodo_http, type: sql.VarChar(10) },
          { name: 'pENDPOINT', value: data.endpoint, type: sql.VarChar(200) },
          { name: 'pIP_ORIGEN', value: data.ip_origen, type: sql.VarChar(50) },
          { name: 'pUSER_AGENT', value: data.user_agent, type: sql.VarChar(500) },
          { name: 'pSN_DISPOSITIVO', value: data.sn_dispositivo, type: sql.VarChar(50) },
          { name: 'pMODELO_DISPOSITIVO', value: data.modelo_dispositivo, type: sql.VarChar(100) },
          { name: 'pUSUARIO_APP', value: data.usuario_app, type: sql.VarChar(100) },
          { name: 'pPIN_USUARIO', value: data.pin_usuario, type: sql.VarChar(50) },
          { name: 'pDESCRIPCION', value: data.descripcion, type: sql.NVarChar(sql.MAX) },
          { name: 'pDATOS_ENVIADOS', value: data.datos_enviados ? JSON.stringify(data.datos_enviados) : null, type: sql.NVarChar(sql.MAX) },
          { name: 'pDATOS_RECIBIDOS', value: data.datos_recibidos ? JSON.stringify(data.datos_recibidos) : null, type: sql.NVarChar(sql.MAX) },
          { name: 'pCOMANDO_ENVIADO', value: data.comando_enviado, type: sql.NVarChar(sql.MAX) },
          { name: 'pRESULTADO', value: data.resultado ? JSON.stringify(data.resultado) : null, type: sql.NVarChar(sql.MAX) },
          { name: 'pTIEMPO_EJECUCION_MS', value: data.tiempo_ejecucion_ms, type: sql.Int },
          { name: 'pFILAS_AFECTADAS', value: data.filas_afectadas, type: sql.Int },
          { name: 'pCODIGO_RESPUESTA', value: data.codigo_respuesta, type: sql.Int },
          { name: 'pSESSION_ID', value: data.session_id, type: sql.VarChar(100) },
          { name: 'pREQUEST_ID', value: data.request_id || this.requestId, type: sql.VarChar(100) }
        ],
        'SSCA.SP_ADMS_LOG_UNIVERSAL_INSERT'
      );

      return result?.[0]?.ID_LOG_UNIVERSAL || null;
    } catch (error) {
      console.error('Error insertando log universal:', error);
      return null;
    }
  }

  // =============================================
  // MÉTODOS DE AYUDA PARA CASOS COMUNES
  // =============================================

  // Log de error
  public async logError(error: any, context?: string, sn?: string) {
    return this.logUniversal({
      tipo_accion   : 'ERROR',
      categoria     : 'SYSTEM',
      nivel         : 'ERROR',
      sn_dispositivo: sn,
      descripcion   : context || 'Error en sistema',
      resultado     : {
        message: error.message,
        stack  : error.stack,
        code   : error.code
      }
    });
  }

  /**
   * Escribe un log diario en C:/Temp/logs/AAAA-MM-DD.log
   */
  public async ensureDirSync(dirPath: string): Promise<void> {
    const parentDir = path.dirname(dirPath);
    if (!fs.existsSync(parentDir)) {
      await this.ensureDirSync(parentDir);
    }
    if (!fs.existsSync(dirPath)) {
      try {
        fs.mkdirSync(dirPath);
      } catch (err) {
        console.error("Error creando carpeta:", err);
      }
    }
  }

  public async writeLog(message: string): Promise<void> {
    try {
      const logDir = path.join(process.cwd(), "logs"); // dentro del proyecto
      await this.ensureDirSync(logDir);

      const now = new Date();

      const date = now.toLocaleDateString("sv-SE"); // YYYY-MM-DD
      const time = now.toLocaleTimeString("en-GB"); // HH:mm:ss

      const logPath = path.join(logDir, `${date}.log`);

      const line = `[${time}] ${message}\n`;

      fs.appendFileSync(logPath, line, { encoding: "utf8" });

    } catch (err) {
      console.error("Error escribiendo log:", err);
    }
  }
  
}

export default Logger.getInstance();