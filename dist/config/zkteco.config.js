"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportsFingerprint = exports.supportsFace = exports.getDeviceConfig = exports.getConfig = exports.defaultConfig = void 0;
/**
 * Configuración centralizada para el sistema ZKTeco
 * ==================================================
 * Todas las configuraciones en un solo lugar para fácil mantenimiento
 */
const path_1 = __importDefault(require("path"));
// Configuración por defecto
exports.defaultConfig = {
    general: {
        appName: 'ADMS-ZKTeco-Integration',
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        defaultTimezone: '-0500',
        logRetentionDays: 30
    },
    paths: {
        baseLogDir: process.env.LOG_DIR || path_1.default.join(__dirname, '../../logs'),
        rawDataDir: 'raw',
        processedDataDir: 'processed',
        backupsDir: 'backups',
        templatesDir: 'templates'
    },
    devices: {
        knownDevices: {
            'SYZ8251600601': {
                sn: 'SYZ8251600601',
                model: 'SpeedFace V5L',
                name: 'SpeedFace Principal',
                location: 'Oficina Principal',
                supportsFace: true,
                supportsFingerprint: true,
                supportsPalm: false,
                timezone: '-0500',
                firmware: '1.0.0',
                platform: 'Linux'
            },
            'COVG215160125': {
                sn: 'COVG215160125',
                model: 'MB560-VL',
                name: 'MB560 Entrada',
                location: 'Entrada Principal',
                supportsFace: true,
                supportsFingerprint: true,
                supportsPalm: false,
                timezone: '-0500',
                firmware: '1.0.0',
                platform: 'Linux'
            }
        },
        autoRegister: true,
        defaultModel: 'ZKTeco Generic'
    },
    communication: {
        maxCommandIdLength: 10,
        commandPrefix: 'C:',
        responseOk: 'OK',
        maxQueueSize: 1000,
        commandTimeoutMs: 30000
    },
    endpoints: {
        iclock: {
            registry: '/iclock/registry',
            cdata: '/iclock/cdata',
            getrequest: '/iclock/getrequest',
            querydata: '/iclock/querydata',
            devicecmd: '/iclock/devicecmd'
        },
        api: {
            base: '/api',
            users: '/api/users',
            fingerprints: '/api/fingerprints',
            faces: '/api/faces',
            commands: '/api/commands',
            logs: '/api/logs',
            devices: '/api/devices',
            time: '/api/time'
        }
    },
    cdataTables: {
        ATTLOG: 'ATTLOG',
        OPERLOG: 'OPERLOG',
        BIODATA: 'BIODATA',
        USER: 'USER',
        FINGERTMP: 'FINGERTMP',
        FACE: 'FACE'
    },
    commands: {
        LOG: 'LOG',
        DATA_UPDATE: 'DATA UPDATE',
        DATA_QUERY: 'DATA QUERY',
        DATA_COUNT: 'DATA COUNT',
        DATA_DELETE: 'DATA DELETE',
        SET_OPTIONS: 'SET OPTIONS',
        GET_OPTIONS: 'GET OPTIONS'
    },
    biometricTypes: {
        FINGERPRINT: 1,
        FACE_IR: 2,
        FACE_VISIBLE: 9,
        PALM: 10
    },
    logCategories: {
        SYSTEM: 'SYSTEM',
        DEVICE: 'DEVICE',
        USER: 'USER',
        ATTENDANCE: 'ATTENDANCE',
        BIOMETRIC: 'BIOMETRIC',
        COMMAND: 'COMMAND',
        ERROR: 'ERROR'
    },
    logLevels: {
        INFO: 'INFO',
        WARNING: 'WARNING',
        ERROR: 'ERROR',
        DEBUG: 'DEBUG'
    },
    actionTypes: {
        API_CALL: 'API_CALL',
        ERROR: 'ERROR',
        COMANDO_ENVIADO: 'COMANDO_ENVIADO',
        COMANDO_RECIBIDO: 'COMANDO_RECIBIDO',
        MARCACION_RECIBIDA: 'MARCACION_RECIBIDA',
        HUELLA_RECIBIDA: 'HUELLA_RECIBIDA',
        FACIAL_RECIBIDO: 'FACIAL_RECIBIDO',
        USUARIO_CREADO: 'USUARIO_CREADO',
        USUARIO_ACTUALIZADO: 'USUARIO_ACTUALIZADO',
        USUARIO_ELIMINADO: 'USUARIO_ELIMINADO',
        DISPOSITIVO_REGISTRADO: 'DISPOSITIVO_REGISTRADO'
    },
    communicationTypes: {
        GETREQUEST: 'GETREQUEST',
        CDATA: 'CDATA',
        QUERYDATA: 'QUERYDATA',
        DEVICECMD: 'DEVICECMD'
    },
    datetimeFormats: {
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm:ss',
        fileTimestamp: 'YYYY-MM-DD_HH-mm-ss',
        logTimestamp: 'YYYY-MM-DD HH:mm:ss'
    }
};
// Función para obtener configuración (permite sobreescribir)
const getConfig = () => {
    // Aquí podrías cargar config desde archivo o BD
    return exports.defaultConfig;
};
exports.getConfig = getConfig;
// Helper para obtener dispositivo conocido
const getDeviceConfig = (sn) => {
    const config = (0, exports.getConfig)();
    return config.devices.knownDevices[sn] || null;
};
exports.getDeviceConfig = getDeviceConfig;
// Helper para determinar si un dispositivo soporta facial
const supportsFace = (sn) => {
    const device = (0, exports.getDeviceConfig)(sn);
    return device ? device.supportsFace : false;
};
exports.supportsFace = supportsFace;
// Helper para determinar si un dispositivo soporta huella
const supportsFingerprint = (sn) => {
    const device = (0, exports.getDeviceConfig)(sn);
    return device ? device.supportsFingerprint : true; // Por defecto true
};
exports.supportsFingerprint = supportsFingerprint;
