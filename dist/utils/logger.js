"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../config/db"));
const mssql_1 = __importDefault(require("mssql"));
const uuid_1 = require("uuid");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class Logger {
    constructor() {
        this.requestId = (0, uuid_1.v4)();
    }
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    setRequestId(id) {
        this.requestId = id;
    }
    getRequestId() {
        return this.requestId;
    }
    // =============================================
    // LOG UNIVERSAL
    // =============================================
    async logUniversal(data) {
        var _a;
        try {
            const startTime = Date.now();
            const result = await db_1.default.exec([
                { name: 'pTIPO_ACCION', value: data.tipo_accion, type: mssql_1.default.VarChar(50) },
                { name: 'pCATEGORIA', value: data.categoria, type: mssql_1.default.VarChar(50) },
                { name: 'pNIVEL', value: data.nivel || 'INFO', type: mssql_1.default.VarChar(20) },
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
                { name: 'pREQUEST_ID', value: data.request_id || this.requestId, type: mssql_1.default.VarChar(100) }
            ], 'SSCA.SP_ADMS_LOG_UNIVERSAL_INSERT');
            return ((_a = result === null || result === void 0 ? void 0 : result[0]) === null || _a === void 0 ? void 0 : _a.ID_LOG_UNIVERSAL) || null;
        }
        catch (error) {
            console.error('Error insertando log universal:', error);
            return null;
        }
    }
    // =============================================
    // MÉTODOS DE AYUDA PARA CASOS COMUNES
    // =============================================
    // Log de error
    async logError(error, context, sn) {
        return this.logUniversal({
            tipo_accion: 'ERROR',
            categoria: 'SYSTEM',
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
    /**
     * Escribe un log diario en C:/Temp/logs/AAAA-MM-DD.log
     */
    async ensureDirSync(dirPath) {
        const parentDir = path_1.default.dirname(dirPath);
        if (!fs_1.default.existsSync(parentDir)) {
            await this.ensureDirSync(parentDir);
        }
        if (!fs_1.default.existsSync(dirPath)) {
            try {
                fs_1.default.mkdirSync(dirPath);
            }
            catch (err) {
                console.error("Error creando carpeta:", err);
            }
        }
    }
    async writeLog(message) {
        try {
            const logDir = path_1.default.join(process.cwd(), "logs"); // dentro del proyecto
            await this.ensureDirSync(logDir);
            const now = new Date();
            const date = now.toLocaleDateString("sv-SE"); // YYYY-MM-DD
            const time = now.toLocaleTimeString("en-GB"); // HH:mm:ss
            const logPath = path_1.default.join(logDir, `${date}.log`);
            const line = `[${time}] ${message}\n`;
            fs_1.default.appendFileSync(logPath, line, { encoding: "utf8" });
        }
        catch (err) {
            console.error("Error escribiendo log:", err);
        }
    }
}
exports.default = Logger.getInstance();
