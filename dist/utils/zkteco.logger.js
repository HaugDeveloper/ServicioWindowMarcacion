"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const zkteco_config_1 = require("../config/zkteco.config");
const db_1 = __importDefault(require("../config/db"));
const mssql_1 = __importDefault(require("mssql"));
const uuid_1 = require("uuid");
class ZKTecoLogger {
    constructor() {
        this.logQueue = [];
        this.isProcessing = false;
        this.logFiles = new Map();
        this.config = (0, zkteco_config_1.getConfig)();
        this.requestId = (0, uuid_1.v4)();
        this.ensureDirectories();
        this.startQueueProcessor();
    }
    static getInstance() {
        if (!ZKTecoLogger.instance) {
            ZKTecoLogger.instance = new ZKTecoLogger();
        }
        return ZKTecoLogger.instance;
    }
    // =============================================
    // INICIALIZACIÓN Y UTILIDADES
    // =============================================
    ensureDirectories() {
        const dirs = [
            this.config.paths.baseLogDir,
            path_1.default.join(this.config.paths.baseLogDir, this.config.paths.rawDataDir),
            path_1.default.join(this.config.paths.baseLogDir, this.config.paths.processedDataDir),
            path_1.default.join(this.config.paths.baseLogDir, this.config.paths.backupsDir),
            path_1.default.join(this.config.paths.baseLogDir, this.config.paths.templatesDir)
        ];
        dirs.forEach(dir => {
            if (!fs_1.default.existsSync(dir)) {
                fs_1.default.mkdirSync(dir, { recursive: true });
                console.log(`📁 Directorio creado: ${dir}`);
            }
        });
    }
    getLogPath(subdir, filename) {
        return path_1.default.join(this.config.paths.baseLogDir, subdir, filename);
    }
    formatTimestamp(date = new Date()) {
        const format = this.config.datetimeFormats.logTimestamp;
        // Implementar formateo según necesidad
        return date.toISOString();
    }
    getFileTimestamp(date = new Date()) {
        return date.toISOString().replace(/[:.]/g, '-');
    }
    setRequestId(id) {
        this.requestId = id;
    }
    getRequestId() {
        return this.requestId;
    }
    // =============================================
    // LOG EN ARCHIVO (CON ROTACIÓN)
    // =============================================
    async logToFile(filename, content, subdir = '') {
        try {
            const fullPath = subdir
                ? this.getLogPath(subdir, filename)
                : path_1.default.join(this.config.paths.baseLogDir, filename);
            // Verificar rotación
            await this.checkRotation(fullPath);
            fs_1.default.appendFileSync(fullPath, content + '\n');
            // Actualizar tamaño
            const stats = fs_1.default.statSync(fullPath);
            this.logFiles.set(filename, { path: fullPath, size: stats.size });
            return true;
        }
        catch (error) {
            console.error(`Error escribiendo archivo ${filename}:`, error);
            return false;
        }
    }
    async checkRotation(filePath) {
        try {
            if (fs_1.default.existsSync(filePath)) {
                const stats = fs_1.default.statSync(filePath);
                const maxSize = 10 * 1024 * 1024; // 10MB
                if (stats.size > maxSize) {
                    const dir = path_1.default.dirname(filePath);
                    const ext = path_1.default.extname(filePath);
                    const base = path_1.default.basename(filePath, ext);
                    const timestamp = this.getFileTimestamp();
                    const rotatedPath = path_1.default.join(dir, `${base}_${timestamp}${ext}`);
                    fs_1.default.renameSync(filePath, rotatedPath);
                    // Comprimir si es necesario
                    if (this.config.general.environment === 'production') {
                        // Aquí podrías comprimir el archivo rotado
                    }
                }
            }
        }
        catch (error) {
            console.error('Error en rotación de log:', error);
        }
    }
    // =============================================
    // PROCESADOR DE COLA DE LOGS (BD)
    // =============================================
    startQueueProcessor() {
        setInterval(() => this.processQueue(), 5000); // Procesar cada 5 segundos
    }
    async processQueue() {
        if (this.isProcessing || this.logQueue.length === 0)
            return;
        this.isProcessing = true;
        while (this.logQueue.length > 0) {
            const logItem = this.logQueue.shift();
            try {
                await this.insertLogToDatabase(logItem);
            }
            catch (error) {
                console.error('Error procesando log en cola:', error);
                // Guardar en archivo como respaldo
                await this.logToFile('failed_logs.txt', JSON.stringify({ ...logItem, error: error.message }));
            }
        }
        this.isProcessing = false;
    }
    async insertLogToDatabase(logItem) {
        if (logItem.type === 'universal') {
            await db_1.default.exec(this.buildUniversalParams(logItem.data), 'SSCA.SP_ADMS_LOG_UNIVERSAL_INSERT');
        }
        else if (logItem.type === 'dispositivo') {
            await db_1.default.exec(this.buildDispositivoParams(logItem.data), 'SSCA.SP_ADMS_LOG_DISPOSITIVO_UPSERT');
        }
    }
    // =============================================
    // LOG UNIVERSAL (con cola)
    // =============================================
    async logUniversal(data) {
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
    buildUniversalParams(data) {
        return [
            { name: 'pTIPO_ACCION', value: data.tipo_accion, type: mssql_1.default.VarChar(50) },
            { name: 'pCATEGORIA', value: data.categoria, type: mssql_1.default.VarChar(50) },
            { name: 'pNIVEL', value: data.nivel, type: mssql_1.default.VarChar(20) },
            { name: 'pMETODO_HTTP', value: data.metodo_http, type: mssql_1.default.VarChar(10) },
            { name: 'pENDPOINT', value: data.endpoint, type: mssql_1.default.VarChar(200) },
            { name: 'pIP_ORIGEN', value: data.ip_origen, type: mssql_1.default.VarChar(50) },
            { name: 'pUSER_AGENT', value: data.user_agent, type: mssql_1.default.VarChar(500) },
            { name: 'pSN_DISPOSITIVO', value: data.sn_dispositivo, type: mssql_1.default.VarChar(50) },
            { name: 'pMODELO_DISPOSITIVO', value: data.modelo_dispositivo, type: mssql_1.default.VarChar(100) },
            { name: 'pUSUARIO_APP', value: data.usuario_app, type: mssql_1.default.VarChar(100) },
            { name: 'pPIN_USUARIO', value: data.pin_usuario, type: mssql_1.default.VarChar(50) },
            { name: 'pDESCRIPCION', value: data.descripcion, type: mssql_1.default.NVarChar(mssql_1.default.MAX) },
            { name: 'pDATOS_ENVIADOS', value: data.datos_enviados ? JSON.stringify(data.datos_enviados) : null, type: mssql_1.default.NVarChar(mssql_1.default.MAX) },
            { name: 'pDATOS_RECIBIDOS', value: data.datos_recibidos ? JSON.stringify(data.datos_recibidos) : null, type: mssql_1.default.NVarChar(mssql_1.default.MAX) },
            { name: 'pCOMANDO_ENVIADO', value: data.comando_enviado, type: mssql_1.default.NVarChar(mssql_1.default.MAX) },
            { name: 'pRESULTADO', value: data.resultado ? JSON.stringify(data.resultado) : null, type: mssql_1.default.NVarChar(mssql_1.default.MAX) },
            { name: 'pTIEMPO_EJECUCION_MS', value: data.tiempo_ejecucion_ms, type: mssql_1.default.Int },
            { name: 'pFILAS_AFECTADAS', value: data.filas_afectadas, type: mssql_1.default.Int },
            { name: 'pCODIGO_RESPUESTA', value: data.codigo_respuesta, type: mssql_1.default.Int },
            { name: 'pSESSION_ID', value: data.session_id, type: mssql_1.default.VarChar(100) },
            { name: 'pREQUEST_ID', value: data.request_id, type: mssql_1.default.VarChar(100) }
        ];
    }
    // =============================================
    // LOG DE DISPOSITIVO
    // =============================================
    async logDispositivo(data) {
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
    buildDispositivoParams(data) {
        return [
            { name: 'pSN_DISPOSITIVO', value: data.sn_dispositivo, type: mssql_1.default.VarChar(50) },
            { name: 'pMODELO', value: data.modelo, type: mssql_1.default.VarChar(100) },
            { name: 'pFIRMWARE_VERSION', value: data.firmware_version, type: mssql_1.default.VarChar(50) },
            { name: 'pIP_DISPOSITIVO', value: data.ip_dispositivo, type: mssql_1.default.VarChar(50) },
            { name: 'pTIPO_COMUNICACION', value: data.tipo_comunicacion, type: mssql_1.default.VarChar(30) },
            { name: 'pDIRECCION', value: data.direccion, type: mssql_1.default.VarChar(10) },
            { name: 'pMETODO', value: data.metodo, type: mssql_1.default.VarChar(10) },
            { name: 'pQUERY_PARAMS', value: data.query_params ? JSON.stringify(data.query_params) : null, type: mssql_1.default.NVarChar(mssql_1.default.MAX) },
            { name: 'pBODY_RAW', value: data.body_raw, type: mssql_1.default.NVarChar(mssql_1.default.MAX) },
            { name: 'pBODY_PROCESADO', value: data.body_procesado, type: mssql_1.default.NVarChar(mssql_1.default.MAX) },
            { name: 'pTABLA_CDATA', value: data.tabla_cdata, type: mssql_1.default.VarChar(50) },
            { name: 'pLINEAS_PROCESADAS', value: data.lineas_procesadas, type: mssql_1.default.Int },
            { name: 'pREGISTROS_GUARDADOS', value: data.registros_guardados, type: mssql_1.default.Int },
            { name: 'pRESPUESTA_ENVIADA', value: data.respuesta_enviada || 'OK', type: mssql_1.default.VarChar(50) },
            { name: 'pCODIGO_ERROR', value: data.codigo_error, type: mssql_1.default.Int },
            { name: 'pMENSAJE_ERROR', value: data.mensaje_error, type: mssql_1.default.NVarChar(mssql_1.default.MAX) },
            { name: 'pTIEMPO_PROCESAMIENTO_MS', value: data.tiempo_procesamiento_ms, type: mssql_1.default.Int },
            { name: 'pTAMANO_BYTES', value: data.tamano_bytes, type: mssql_1.default.Int },
            { name: 'pREQUEST_ID', value: data.request_id, type: mssql_1.default.VarChar(100) }
        ];
    }
    // =============================================
    // MÉTODOS DE AYUDA (SHORTCUTS)
    // =============================================
    async logApiCall(req, categoria, descripcion, data) {
        return this.logUniversal({
            tipo_accion: 'API_CALL',
            categoria,
            metodo_http: req.method,
            endpoint: req.path,
            ip_origen: req.ip || req.socket.remoteAddress,
            user_agent: req.get('user-agent'),
            sn_dispositivo: req.query.SN || req.body.sn,
            descripcion,
            datos_enviados: {
                query: req.query,
                body: req.body,
                params: req.params
            },
            ...data
        });
    }
    async logError(error, context, sn) {
        return this.logUniversal({
            tipo_accion: 'ERROR',
            categoria: 'ERROR',
            nivel: 'ERROR',
            sn_dispositivo: sn,
            descripcion: context || 'Error en sistema',
            resultado: {
                message: error.message,
                stack: error.stack,
                code: error.code
            }
        });
    }
    async logComandoEnviado(sn, comando, usuario) {
        return this.logUniversal({
            tipo_accion: 'COMANDO_ENVIADO',
            categoria: 'COMMAND',
            sn_dispositivo: sn,
            comando_enviado: comando,
            usuario_app: usuario,
            descripcion: `Comando enviado a dispositivo ${sn}`
        });
    }
    async logMarcacionesRecibidas(sn, lineas, registros) {
        return this.logUniversal({
            tipo_accion: 'MARCACION_RECIBIDA',
            categoria: 'ATTENDANCE',
            sn_dispositivo: sn,
            filas_afectadas: registros,
            descripcion: `${lineas} líneas recibidas, ${registros} registros guardados`
        });
    }
}
exports.default = ZKTecoLogger.getInstance();
