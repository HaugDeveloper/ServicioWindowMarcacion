import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { getConfig, ZKTecoConfig } from '../config/zkteco.config';
import DB from '../config/db';
import sql from 'mssql';
import { v4 as uuidv4 } from 'uuid';

// Tipos basados en la configuración
export type LogNivel         = keyof ZKTecoConfig['logLevels'];
export type LogCategoria     = keyof ZKTecoConfig['logCategories'];
export type LogTipoAccion    = keyof ZKTecoConfig['actionTypes'];
export type TipoComunicacion = keyof ZKTecoConfig['communicationTypes'];
export type TablaCDATA       = keyof ZKTecoConfig['cdataTables'];

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
    tipo_comunicacion       : TipoComunicacion;
    direccion               : 'IN' | 'OUT';
    metodo                 ?: string;
    query_params           ?: any;
    body_raw               ?: string;
    body_procesado         ?: string;
    tabla_cdata            ?: TablaCDATA;
    lineas_procesadas      ?: number;
    registros_guardados    ?: number;
    respuesta_enviada      ?: string;
    codigo_error           ?: number;
    mensaje_error          ?: string;
    tiempo_procesamiento_ms?: number;
    tamano_bytes           ?: number;
    request_id             ?: string;
}

export interface LogFileOptions {
    maxSize?: number; // en bytes
    maxFiles?: number;
    compress?: boolean;
}

class ZKTecoLogger {
    private static instance: ZKTecoLogger;
    private config         : ZKTecoConfig;
    private requestId      : string;
    private logQueue       : any[] = [];
    private isProcessing = false;
    private logFiles: Map<string, { path: string; size: number }> = new Map();

    private constructor() {
        this.config    = getConfig();
        this.requestId = uuidv4();
        this.ensureDirectories();
        this.startQueueProcessor();
    }

    public static getInstance(): ZKTecoLogger {
        if (!ZKTecoLogger.instance) {
            ZKTecoLogger.instance = new ZKTecoLogger();
        }
        return ZKTecoLogger.instance;
    }

    // =============================================
    // INICIALIZACIÓN Y UTILIDADES
    // =============================================
    private ensureDirectories(): void {
        const dirs = [
            this.config.paths.baseLogDir,
            path.join(this.config.paths.baseLogDir, this.config.paths.rawDataDir),
            path.join(this.config.paths.baseLogDir, this.config.paths.processedDataDir),
            path.join(this.config.paths.baseLogDir, this.config.paths.backupsDir),
            path.join(this.config.paths.baseLogDir, this.config.paths.templatesDir)
        ];

        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`📁 Directorio creado: ${dir}`);
            }
        });
    }

    private getLogPath(subdir: string, filename: string): string {
        return path.join(this.config.paths.baseLogDir, subdir, filename);
    }

    private formatTimestamp(date: Date = new Date()): string {
        const format = this.config.datetimeFormats.logTimestamp;
        // Implementar formateo según necesidad
        return date.toISOString();
    }

    private getFileTimestamp(date: Date = new Date()): string {
        return date.toISOString().replace(/[:.]/g, '-');
    }

    public setRequestId(id: string): void {
        this.requestId = id;
    }

    public getRequestId(): string {
        return this.requestId;
    }

    // =============================================
    // LOG EN ARCHIVO (CON ROTACIÓN)
    // =============================================
    public async logToFile(filename: string, content: string, subdir: string = ''): Promise<boolean> {
        try {
            const fullPath = subdir 
                ? this.getLogPath(subdir, filename)
                : path.join(this.config.paths.baseLogDir, filename);
            
            // Verificar rotación
            await this.checkRotation(fullPath);
            
            fs.appendFileSync(fullPath, content + '\n');
            
            // Actualizar tamaño
            const stats = fs.statSync(fullPath);
            this.logFiles.set(filename, { path: fullPath, size: stats.size });
            
            return true;
        } catch (error) {
            console.error(`Error escribiendo archivo ${filename}:`, error);
            return false;
        }
    }

    private async checkRotation(filePath: string): Promise<void> {
        try {
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                const maxSize = 10 * 1024 * 1024; // 10MB
                
                if (stats.size > maxSize) {
                    const dir = path.dirname(filePath);
                    const ext = path.extname(filePath);
                    const base = path.basename(filePath, ext);
                    const timestamp = this.getFileTimestamp();
                    
                    const rotatedPath = path.join(dir, `${base}_${timestamp}${ext}`);
                    fs.renameSync(filePath, rotatedPath);
                    
                    // Comprimir si es necesario
                    if (this.config.general.environment === 'production') {
                        // Aquí podrías comprimir el archivo rotado
                    }
                }
            }
        } catch (error) {
            console.error('Error en rotación de log:', error);
        }
    }

    // =============================================
    // PROCESADOR DE COLA DE LOGS (BD)
    // =============================================
    private startQueueProcessor(): void {
        setInterval(() => this.processQueue(), 5000); // Procesar cada 5 segundos
    }

    private async processQueue(): Promise<void> {
        if (this.isProcessing || this.logQueue.length === 0) return;
        
        this.isProcessing = true;
        
        while (this.logQueue.length > 0) {
            const logItem = this.logQueue.shift();
            try {
                await this.insertLogToDatabase(logItem);
            } catch (error) {
                console.error('Error procesando log en cola:', error);
                // Guardar en archivo como respaldo
                await this.logToFile(
                    'failed_logs.txt',
                    JSON.stringify({ ...logItem, error: error.message })
                );
            }
        }
        
        this.isProcessing = false;
    }

    private async insertLogToDatabase(logItem: any): Promise<void> {
        if (logItem.type === 'universal') {
            await DB.exec(
                this.buildUniversalParams(logItem.data),
                'SSCA.SP_ADMS_LOG_UNIVERSAL_INSERT'
            );
        } else if (logItem.type === 'dispositivo') {
            await DB.exec(
                this.buildDispositivoParams(logItem.data),
                'SSCA.SP_ADMS_LOG_DISPOSITIVO_UPSERT'
            );
        }
    }

    // =============================================
    // LOG UNIVERSAL (con cola)
    // =============================================
    public async logUniversal(data: LogUniversalData): Promise<void> {
        const logItem = {
            type: 'universal',
            data: {
                ...data,
                nivel: data.nivel || this.config.logLevels.INFO,
                request_id: data.request_id || this.requestId,
                timestamp: new Date().toISOString()
            }
        };

        // Guardar en archivo siempre
        const logLine = `[${this.formatTimestamp()}] ${data.categoria} | ${data.tipo_accion} | ${data.sn_dispositivo || 'N/A'} | ${data.descripcion || ''}`;
        await this.logToFile('universal.log', logLine);

        // Encolar para BD
        this.logQueue.push(logItem);
        
        // Si la cola es muy grande, procesar inmediatamente
        if (this.logQueue.length > 100) {
            this.processQueue();
        }
    }

    private buildUniversalParams(data: any): any[] {
        return [
            { name: 'pTIPO_ACCION', value: data.tipo_accion, type: sql.VarChar(50) },
            { name: 'pCATEGORIA', value: data.categoria, type: sql.VarChar(50) },
            { name: 'pNIVEL', value: data.nivel, type: sql.VarChar(20) },
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
            { name: 'pREQUEST_ID', value: data.request_id, type: sql.VarChar(100) }
        ];
    }

    // =============================================
    // LOG DE DISPOSITIVO
    // =============================================
    public async logDispositivo(data: LogDispositivoData): Promise<void> {
        const logItem = {
            type: 'dispositivo',
            data: {
                ...data,
                request_id: this.requestId,
                timestamp: new Date().toISOString()
            }
        };

        // Guardar en archivo
        const logLine = `[${this.formatTimestamp()}] ${data.direccion} | ${data.tipo_comunicacion} | ${data.sn_dispositivo} | ${data.tabla_cdata || ''} | Líneas:${data.lineas_procesadas || 0}`;
        await this.logToFile(`device_${data.sn_dispositivo}.log`, logLine, this.config.paths.processedDataDir);

        // Encolar para BD
        this.logQueue.push(logItem);
    }

    private buildDispositivoParams(data: any): any[] {
        return [
            { name: 'pSN_DISPOSITIVO', value: data.sn_dispositivo, type: sql.VarChar(50) },
            { name: 'pMODELO', value: data.modelo, type: sql.VarChar(100) },
            { name: 'pFIRMWARE_VERSION', value: data.firmware_version, type: sql.VarChar(50) },
            { name: 'pIP_DISPOSITIVO', value: data.ip_dispositivo, type: sql.VarChar(50) },
            { name: 'pTIPO_COMUNICACION', value: data.tipo_comunicacion, type: sql.VarChar(30) },
            { name: 'pDIRECCION', value: data.direccion, type: sql.VarChar(10) },
            { name: 'pMETODO', value: data.metodo, type: sql.VarChar(10) },
            { name: 'pQUERY_PARAMS', value: data.query_params ? JSON.stringify(data.query_params) : null, type: sql.NVarChar(sql.MAX) },
            { name: 'pBODY_RAW', value: data.body_raw, type: sql.NVarChar(sql.MAX) },
            { name: 'pBODY_PROCESADO', value: data.body_procesado, type: sql.NVarChar(sql.MAX) },
            { name: 'pTABLA_CDATA', value: data.tabla_cdata, type: sql.VarChar(50) },
            { name: 'pLINEAS_PROCESADAS', value: data.lineas_procesadas, type: sql.Int },
            { name: 'pREGISTROS_GUARDADOS', value: data.registros_guardados, type: sql.Int },
            { name: 'pRESPUESTA_ENVIADA', value: data.respuesta_enviada || 'OK', type: sql.VarChar(50) },
            { name: 'pCODIGO_ERROR', value: data.codigo_error, type: sql.Int },
            { name: 'pMENSAJE_ERROR', value: data.mensaje_error, type: sql.NVarChar(sql.MAX) },
            { name: 'pTIEMPO_PROCESAMIENTO_MS', value: data.tiempo_procesamiento_ms, type: sql.Int },
            { name: 'pTAMANO_BYTES', value: data.tamano_bytes, type: sql.Int },
            { name: 'pREQUEST_ID', value: data.request_id, type: sql.VarChar(100) }
        ];
    }

    // =============================================
    // MÉTODOS DE AYUDA (SHORTCUTS)
    // =============================================
    public async logApiCall(req: Request, categoria: LogCategoria, descripcion: string, data?: any) {
        return this.logUniversal({
            tipo_accion: 'API_CALL',
            categoria,
            metodo_http   : req.method,
            endpoint      : req.path,
            ip_origen     : req.ip || req.socket.remoteAddress,
            user_agent    : req.get('user-agent'),
            sn_dispositivo: req.query.SN as string || req.body.sn,
            descripcion,
            datos_enviados: {
                query: req.query,
                body: req.body,
                params: req.params
            },
            ...data
        });
    }

    public async logError(error: any, context?: string, sn?: string) {
        return this.logUniversal({
            tipo_accion   : 'ERROR',
            categoria     : 'ERROR',
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

    public async logComandoEnviado(sn: string, comando: string, usuario?: string) {
        return this.logUniversal({
            tipo_accion    : 'COMANDO_ENVIADO',
            categoria      : 'COMMAND',
            sn_dispositivo : sn,
            comando_enviado: comando,
            usuario_app    : usuario,
            descripcion    : `Comando enviado a dispositivo ${sn}`
        });
    }

    public async logMarcacionesRecibidas(sn: string, lineas: number, registros: number) {
        return this.logUniversal({
            tipo_accion    : 'MARCACION_RECIBIDA',
            categoria      : 'ATTENDANCE',
            sn_dispositivo : sn,
            filas_afectadas: registros,
            descripcion    : `${lineas} líneas recibidas, ${registros} registros guardados`
        });
    }
}

export default ZKTecoLogger.getInstance();