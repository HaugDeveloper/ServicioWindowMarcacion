/**
 * Configuración centralizada para el sistema ZKTeco
 * ==================================================
 * Todas las configuraciones en un solo lugar para fácil mantenimiento
 */
import path from "path";

export interface ZKTecoConfig {
    // Configuración general
    general: {
        appName         : string;
        version         : string;
        environment     : 'development' | 'production' | 'testing';
        defaultTimezone : string;
        logRetentionDays: number;
    };
    
    // Directorios
    paths: {
        baseLogDir      : string;
        rawDataDir      : string;
        processedDataDir: string;
        backupsDir      : string;
        templatesDir    : string;
    };
    
    // Dispositivos conocidos
    devices: {
        knownDevices: Record<string, DeviceConfig>;
        autoRegister: boolean;
        defaultModel: string;
    };
    
    // Configuración de comunicación
    communication: {
        maxCommandIdLength: number;
        commandPrefix     : string;
        responseOk        : string;
        maxQueueSize      : number;
        commandTimeoutMs  : number;
    };
    
    // Endpoints del protocolo
    endpoints: {
        iclock: {
            registry  : string;
            cdata     : string;
            getrequest: string;
            querydata : string;
            devicecmd : string;
        };
        api: {
            base        : string;
            users       : string;
            fingerprints: string;
            faces       : string;
            commands    : string;
            logs        : string;
            devices     : string;
            time        : string;
        };
    };
    
    // Tipos de tablas CDATA
    cdataTables: {
        ATTLOG   : 'ATTLOG';
        OPERLOG  : 'OPERLOG';
        BIODATA  : 'BIODATA';
        USER     : 'USER';
        FINGERTMP: 'FINGERTMP';
        FACE     : 'FACE';
    };
    
    // Tipos de comandos
    commands: {
        LOG        : string;
        DATA_UPDATE: string;
        DATA_QUERY : string;
        DATA_COUNT : string;
        DATA_DELETE: string;
        SET_OPTIONS: string;
        GET_OPTIONS: string;
    };
    
    // Tipos de biométricos
    biometricTypes: {
        FINGERPRINT : 1;
        FACE_IR     : 2;   // Near-infrared face
        FACE_VISIBLE: 9;   // Visible light face
        PALM        : 10;
    };
    
    // Categorías de logs
    logCategories: {
        SYSTEM    : 'SYSTEM';
        DEVICE    : 'DEVICE';
        USER      : 'USER';
        ATTENDANCE: 'ATTENDANCE';
        BIOMETRIC : 'BIOMETRIC';
        COMMAND   : 'COMMAND';
        ERROR     : 'ERROR';
    };
    
    // Niveles de log
    logLevels: {
        INFO   : 'INFO';
        WARNING: 'WARNING';
        ERROR  : 'ERROR';
        DEBUG  : 'DEBUG';
    };
    
    // Tipos de acción
    actionTypes: {
        API_CALL              : 'API_CALL';
        ERROR                 : 'ERROR';
        COMANDO_ENVIADO       : 'COMANDO_ENVIADO';
        COMANDO_RECIBIDO      : 'COMANDO_RECIBIDO';
        MARCACION_RECIBIDA    : 'MARCACION_RECIBIDA';
        HUELLA_RECIBIDA       : 'HUELLA_RECIBIDA';
        FACIAL_RECIBIDO       : 'FACIAL_RECIBIDO';
        USUARIO_CREADO        : 'USUARIO_CREADO';
        USUARIO_ACTUALIZADO   : 'USUARIO_ACTUALIZADO';
        USUARIO_ELIMINADO     : 'USUARIO_ELIMINADO';
        DISPOSITIVO_REGISTRADO: 'DISPOSITIVO_REGISTRADO';
    };
    
    // Tipos de comunicación
    communicationTypes: {
        GETREQUEST: 'GETREQUEST';
        CDATA     : 'CDATA';
        QUERYDATA : 'QUERYDATA';
        DEVICECMD : 'DEVICECMD';
    };
    
    // Formatos de fecha/hora
    datetimeFormats: {
        dateFormat   : string;
        timeFormat   : string;
        fileTimestamp: string;
        logTimestamp : string;
    };
}

export interface DeviceConfig {
    sn                  : string;
    model               : string;
    name               ?: string;
    location           ?: string;
    supportsFace        : boolean;
    supportsFingerprint : boolean;
    supportsPalm        : boolean;
    timezone            : string;
    firmware           ?: string;
    platform           ?: string;
    ip                 ?: string;
    port               ?: number;
}

// Configuración por defecto
export const defaultConfig: ZKTecoConfig = {
    general: {
        appName         : 'ADMS-ZKTeco-Integration',
        version         : '2.0.0',
        environment     : (process.env.NODE_ENV as any) || 'development',
        defaultTimezone : '-0500',
        logRetentionDays: 30
    },
    
    paths: {
        baseLogDir      : process.env.LOG_DIR || path.join(__dirname, '../../logs'),
        rawDataDir      : 'raw',
        processedDataDir: 'processed',
        backupsDir      : 'backups',
        templatesDir    : 'templates'
    },
    
    devices: {
        knownDevices: {
            'SYZ8251600601': {
                sn                 : 'SYZ8251600601',
                model              : 'SpeedFace V5L',
                name               : 'SpeedFace Principal',
                location           : 'Oficina Principal',
                supportsFace       : true,
                supportsFingerprint: true,
                supportsPalm       : false,
                timezone           : '-0500',
                firmware           : '1.0.0',
                platform           : 'Linux'
            },
            'COVG215160125': {
                sn                 : 'COVG215160125',
                model              : 'MB560-VL',
                name               : 'MB560 Entrada',
                location           : 'Entrada Principal',
                supportsFace       : true,
                supportsFingerprint: true,
                supportsPalm       : false,
                timezone           : '-0500',
                firmware           : '1.0.0',
                platform           : 'Linux'
            }
        },
        autoRegister: true,
        defaultModel: 'ZKTeco Generic'
    },
    
    communication: {
        maxCommandIdLength: 10,
        commandPrefix     : 'C:',
        responseOk        : 'OK',
        maxQueueSize      : 1000,
        commandTimeoutMs  : 30000
    },
    
    endpoints: {
        iclock: {
            registry  : '/iclock/registry',
            cdata     : '/iclock/cdata',
            getrequest: '/iclock/getrequest',
            querydata : '/iclock/querydata',
            devicecmd : '/iclock/devicecmd'
        },
        api: {
            base        : '/api',
            users       : '/api/users',
            fingerprints: '/api/fingerprints',
            faces       : '/api/faces',
            commands    : '/api/commands',
            logs        : '/api/logs',
            devices     : '/api/devices',
            time        : '/api/time'
        }
    },
    
    cdataTables: {
        ATTLOG   : 'ATTLOG',
        OPERLOG  : 'OPERLOG',
        BIODATA  : 'BIODATA',
        USER     : 'USER',
        FINGERTMP: 'FINGERTMP',
        FACE     : 'FACE'
    },
    
    commands: {
        LOG        : 'LOG',
        DATA_UPDATE: 'DATA UPDATE',
        DATA_QUERY : 'DATA QUERY',
        DATA_COUNT : 'DATA COUNT',
        DATA_DELETE: 'DATA DELETE',
        SET_OPTIONS: 'SET OPTIONS',
        GET_OPTIONS: 'GET OPTIONS'
    },
    
    biometricTypes: {
        FINGERPRINT : 1,
        FACE_IR     : 2,
        FACE_VISIBLE: 9,
        PALM        : 10
    },
    
    logCategories: {
        SYSTEM    : 'SYSTEM',
        DEVICE    : 'DEVICE',
        USER      : 'USER',
        ATTENDANCE: 'ATTENDANCE',
        BIOMETRIC : 'BIOMETRIC',
        COMMAND   : 'COMMAND',
        ERROR     : 'ERROR'
    },
    
    logLevels: {
        INFO   : 'INFO',
        WARNING: 'WARNING',
        ERROR  : 'ERROR',
        DEBUG  : 'DEBUG'
    },
    
    actionTypes: {
        API_CALL              : 'API_CALL',
        ERROR                 : 'ERROR',
        COMANDO_ENVIADO       : 'COMANDO_ENVIADO',
        COMANDO_RECIBIDO      : 'COMANDO_RECIBIDO',
        MARCACION_RECIBIDA    : 'MARCACION_RECIBIDA',
        HUELLA_RECIBIDA       : 'HUELLA_RECIBIDA',
        FACIAL_RECIBIDO       : 'FACIAL_RECIBIDO',
        USUARIO_CREADO        : 'USUARIO_CREADO',
        USUARIO_ACTUALIZADO   : 'USUARIO_ACTUALIZADO',
        USUARIO_ELIMINADO     : 'USUARIO_ELIMINADO',
        DISPOSITIVO_REGISTRADO: 'DISPOSITIVO_REGISTRADO'
    },
    
    communicationTypes: {
        GETREQUEST: 'GETREQUEST',
        CDATA     : 'CDATA',
        QUERYDATA : 'QUERYDATA',
        DEVICECMD : 'DEVICECMD'
    },
    
    datetimeFormats: {
        dateFormat   : 'YYYY-MM-DD',
        timeFormat   : 'HH:mm:ss',
        fileTimestamp: 'YYYY-MM-DD_HH-mm-ss',
        logTimestamp : 'YYYY-MM-DD HH:mm:ss'
    }
};

// Función para obtener configuración (permite sobreescribir)
export const getConfig = (): ZKTecoConfig => {
    // Aquí podrías cargar config desde archivo o BD
    return defaultConfig;
};

// Helper para obtener dispositivo conocido
export const getDeviceConfig = (sn: string): DeviceConfig | null => {
    const config = getConfig();
    return config.devices.knownDevices[sn] || null;
};

// Helper para determinar si un dispositivo soporta facial
export const supportsFace = (sn: string): boolean => {
    const device = getDeviceConfig(sn);
    return device ? device.supportsFace : false;
};

// Helper para determinar si un dispositivo soporta huella
export const supportsFingerprint = (sn: string): boolean => {
    const device = getDeviceConfig(sn);
    return device ? device.supportsFingerprint : true; // Por defecto true
};