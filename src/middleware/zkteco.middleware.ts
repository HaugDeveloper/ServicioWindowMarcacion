import { Request, Response, NextFunction }  from 'express';
import fs                                   from 'fs';
import path                                 from 'path';
import { getConfig }                        from '../config/zkteco.config';
import Logger                               from '../utils/zkteco.logger';

const config = getConfig();

// ===============================
// FUNCIONES DE UTILIDAD
// ===============================
const getDailyLogFile = (): string => {
    const date = new Date().toISOString().split('T')[0];
    return `zkteco_requests_${date}.log`;
};

const safeLogFile = (filename: string, content: string) => {
    try {
        const filePath = path.join(config.paths.baseLogDir, filename);
        fs.appendFileSync(filePath, content + '\n');
    } catch (error) {
        console.debug(`No se pudo escribir log ${filename}:`, error.message);
    }
};

/**
 * Middleware principal para dispositivos ZKTeco
 * VERSIÓN CORREGIDA - Sin errores de headers
 */
export const zktecoLogger = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const { method, url, query } = req;
    const sn = query.SN as string || 'unknown';
    
    // Generar ID único para esta request
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    Logger.setRequestId(requestId);
    
    // Determinar tipo de comunicación basado en la URL
    let  tipoComunicacion: string                                = 'UNKNOWN';
    if   (url.includes('/iclock/getrequest')) tipoComunicacion   = 'GETREQUEST';
    else if (url.includes('/iclock/cdata')) tipoComunicacion     = 'CDATA';
    else if (url.includes('/iclock/querydata')) tipoComunicacion = 'QUERYDATA';
    else if (url.includes('/iclock/devicecmd')) tipoComunicacion = 'DEVICECMD';
    
    // Log a archivo (siempre)
    const logEntry = `[${new Date().toISOString()}] ${method} ${url} SN=${sn} REQID=${requestId}`;
    safeLogFile(getDailyLogFile(), logEntry);
    
    // Log a consola (solo en desarrollo)
    if (config.general.environment !== 'production') {
        console.log('\n\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════');
        console.log('\x1b[33m%s\x1b[0m', `[ZK Teco] ${method} ${url}`);
        console.log('\x1b[90m%s\x1b[0m', `   SN: ${sn}`);
        console.log('\x1b[90m%s\x1b[0m', `   REQID: ${requestId}`);
        console.log('\x1b[90m%s\x1b[0m', `   Time: ${new Date().toISOString()}`);
    }
    
    // Log de entrada a BD (no bloqueante)
    Logger.logDispositivo({
        sn_dispositivo   : sn,
        tipo_comunicacion: tipoComunicacion as any,
        direccion        : 'IN',
        metodo           : method,
        query_params     : query,
        request_id       : requestId
    }).catch(console.error);
    
    // Guardar referencias originales
    const originalSend = res.send;
    const originalJson = res.json;
    const originalEnd  = res.end;
    let   responseSent = false;
    
    // Función para loguear respuesta UNA SOLA VEZ
    const logResponse = (body: any) => {
        if (responseSent) return;
        responseSent = true;
        
        const duration = Date.now() - startTime;
        
        // Log en consola (desarrollo)
        if (config.general.environment !== 'production') {
            console.log('\x1b[32m%s\x1b[0m', `   Respuesta: ${res.statusCode} (${duration}ms)`);
            console.log('\x1b[36m%s\x1b[0m', '═════════════════════════════════════════════════\n');
        }
        
        // Log a BD (asíncrono, no bloquea)
        Logger.logDispositivo({
            sn_dispositivo         : sn,
            tipo_comunicacion      : tipoComunicacion as any,
            direccion              : 'OUT',
            metodo                 : method,
            query_params           : query,
            respuesta_enviada      : res.statusCode.toString(),
            tiempo_procesamiento_ms: duration,
            request_id             : requestId,
            body_procesado         : typeof body === 'string' ? body.substring(0, 1000): JSON.stringify(body).substring(0, 1000)
        }).catch(console.error);
    };
    
    // Sobrescribir res.send de forma segura
    res.send = function(body: any): Response {
        logResponse(body);
        return originalSend.call(this, body);
    };
    
    // Sobrescribir res.json de forma segura
    res.json = function(body: any): Response {
        logResponse(body);
        return originalJson.call(this, body);
    };
    
    // Sobrescribir res.end de forma segura
    res.end = function(chunk?: any, encoding?: any): Response {
        if (!responseSent) {
            logResponse(chunk);
        }
        return originalEnd.call(this, chunk, encoding);
    };
    
    next();
};

/**
 * Middleware para capturar body crudo con configuración
 */
export const rawBodyCapture = (options?: { maxSize?: number; saveToDisk?: boolean }) => {
    const maxSize    = options?.maxSize || 50 * 1024 * 1024;  // 50MB default
    const saveToDisk = options?.saveToDisk !== false;         // true por defecto
    
    return (req: Request, res: Response, next: NextFunction) => {
        let data: Buffer[] = [];
        let totalSize      = 0;
        
        req.on('data', (chunk: Buffer) => {
            data.push(chunk);
            totalSize += chunk.length;
            
            // Verificar tamaño máximo
            if (totalSize > maxSize) {
                req.destroy(new Error('Body demasiado grande'));
            }
        });
        
        req.on('end', () => {
            if (data.length > 0) {
                const rawData = Buffer.concat(data);
                const sn = req.query.SN as string || 'unknown';
                
                // Adjuntar al request
                (req as any).rawBody = rawData;
                (req as any).rawBodyString = rawData.toString('utf8');
                (req as any).rawBodySize = rawData.length;
                
                // Guardar a disco si está habilitado
                if (saveToDisk) {
                    const timestamp = Date.now();
                    const filename = `raw_${sn}_${timestamp}.bin`;
                    const filePath = path.join(config.paths.baseLogDir, config.paths.rawDataDir, filename);
                    
                    try {
                        fs.writeFileSync(filePath, rawData);
                        
                        if (config.general.environment !== 'production') {
                            console.log('\x1b[35m%s\x1b[0m', `Body guardado: ${filename} (${rawData.length} bytes)`);
                        }
                    } catch (error) {
                        console.error('Error guardando body raw:', error);
                    }
                }
                
                // Log del tamaño
                Logger.logUniversal({
                    tipo_accion   : 'API_CALL',
                    categoria     : 'DEVICE',
                    sn_dispositivo: sn,
                    descripcion   : `Body recibido: ${rawData.length} bytes`,
                    datos_enviados: { size: rawData.length }
                }).catch(console.error);
            }
            
            next();
        });
        
        req.on('error', (err) => {
            console.error('Error capturando body:', err);
            next(err);
        });
    };
};

/**
 * Middleware para validar dispositivos conocidos
 */
export const validateDevice = (req: Request, res: Response, next: NextFunction) => {
    const sn = req.query.SN as string;
    
    if (!sn) {
        return res.status(400).send('SN requerido');
    }
    
    // Aquí podrías verificar si el dispositivo está registrado
    // o permitir auto-registro
    
    next();
};

/**
 * Middleware para medir tiempo de respuesta
 */
export const responseTime = (req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime();
    
    // Guardar la función end original
    const originalEnd = res.end;
    
    // Sobrescribir end
    res.end = function(chunk?: any, encoding?: any): Response {
        const [seconds, nanoseconds] = process.hrtime(start);
        const duration               = seconds * 1000 + nanoseconds / 1e6;
        
        // Establecer header ANTES de llamar a end
        res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
        
        return originalEnd.call(this, chunk, encoding);
    };
    
    next();
};