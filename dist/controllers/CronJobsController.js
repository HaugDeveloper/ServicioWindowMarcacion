"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncDevicesState = syncDevicesState;
exports.syncTransaccionsBioTimes = syncTransaccionsBioTimes;
exports.syncPersonnelSqlS10ToBiotime = syncPersonnelSqlS10ToBiotime;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const moment_1 = __importDefault(require("moment"));
const index_1 = require("../api/index");
const db_1 = __importDefault(require("../config/db"));
const conf_1 = require("../config/conf");
const ZKTecoPersonnelBioTimeController_1 = __importDefault(require("./ZKTecoPersonnelBioTimeController"));
const emailService_1 = require("../services/emailService");
const logger_1 = __importDefault(require("../utils/logger"));
const zktecoApi = new index_1.zkteco.zkteco_auth_biotime.ZKTeco_Auth_BioTime();
/* ============================================================
   MANEJO GLOBAL DE ERRORES (NO CAER SERVICIO)
============================================================ */
process.on('uncaughtException', async (err) => {
    await logger_1.default.writeLog(`UNCAUGHT EXCEPTION: ${err.message}`);
    await logger_1.default.logError(err, 'uncaughtException');
});
process.on('unhandledRejection', async (reason) => {
    await logger_1.default.writeLog(`UNHANDLED REJECTION: ${reason}`);
    await logger_1.default.logError(reason, 'unhandledRejection');
});
/* ============================================================
   MANEJADOR DE ESTADOS DE DISPOSITIVOS
============================================================ */
const stateFilePath = path_1.default.join(__dirname, "../storage/deviceState.json");
function loadState() {
    try {
        if (!fs_1.default.existsSync(stateFilePath)) {
            return { devices: {} };
        }
        const data = fs_1.default.readFileSync(stateFilePath, "utf-8");
        return JSON.parse(data);
    }
    catch (error) {
        logger_1.default.writeLog(`Error leyendo estado: ${error.message}`);
        return { devices: {} };
    }
}
function saveState(state) {
    try {
        const dir = path_1.default.dirname(stateFilePath);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        fs_1.default.writeFileSync(stateFilePath, JSON.stringify(state, null, 2));
    }
    catch (error) {
        logger_1.default.writeLog(`Error guardando estado: ${error.message}`);
    }
}
/* ============================================================
   SYNC DISPOSITIVOS
============================================================ */
async function syncDevicesState() {
    await logger_1.default.writeLog("=== INICIO syncDevicesState ===");
    try {
        const state = loadState();
        const staticToken = await zktecoApi.getStaticToken();
        const response = await zktecoApi.request({
            path: "/iclock/api/terminals/?page_size=1000",
            method: "GET",
            token: staticToken
        });
        const devices = (response.data || []).map(normalizeTerminal);
        const activeDevices = devices.filter(d => !isDeviceDown(d));
        const downDevices = devices.filter(isDeviceDown);
        const now = new Date();
        const hour = now.getHours();
        const today = now.toISOString().split("T")[0];
        await logger_1.default.writeLog(`Total dispositivos: ${devices.length}`);
        await logger_1.default.writeLog(`Activos: ${activeDevices.length} | Caídos: ${downDevices.length}`);
        // OFFLINE
        for (const device of downDevices) {
            const deviceState = state.devices[device.sn] || {};
            if (deviceState.lastState !== "DOWN") {
                await sendDeviceDownMail(device);
                state.devices[device.sn] = {
                    ...deviceState,
                    lastState: "DOWN"
                };
                await logger_1.default.writeLog(`ALERTA OFFLINE: ${device.sn}`);
            }
        }
        // ONLINE
        for (const device of activeDevices) {
            const deviceState = state.devices[device.sn] || {};
            if (deviceState.lastState === "DOWN") {
                await sendDeviceActiveMail(device);
                state.devices[device.sn] = {
                    ...deviceState,
                    lastState: "ACTIVE"
                };
                await logger_1.default.writeLog(`RECUPERADO: ${device.sn}`);
            }
        }
        // REPORTE DIARIO 6 AM
        if (hour === 6) {
            await logger_1.default.writeLog("REPORTE DIARIO ONLINE");
            for (const device of activeDevices) {
                const deviceState = state.devices[device.sn] || {};
                if (deviceState.lastActiveNotificationDate !== today) {
                    await sendDeviceActiveMail(device);
                    state.devices[device.sn] = {
                        ...deviceState,
                        lastActiveNotificationDate: today,
                        lastState: "ACTIVE"
                    };
                    await logger_1.default.writeLog(`REPORTE DIARIO: ${device.sn}`);
                }
            }
        }
        saveState(state);
    }
    catch (error) {
        await logger_1.default.writeLog(`ERROR syncDevicesState: ${error.message}`);
        await logger_1.default.logError(error, 'syncDevicesState');
    }
    await logger_1.default.writeLog("=== FIN syncDevicesState ===\n");
}
/* ============================================================
   EMAILS
============================================================ */
async function sendDeviceActiveMail(device) {
    try {
        const fecha = (0, moment_1.default)().format("DD/MM/YYYY HH:mm");
        await emailService_1.emailService.sendEmail({
            to: [process.env.CORREO_SOPORTE || "soporte@haug.com.pe"],
            subject: `DISPOSITIVO ONLINE - ${device.alias}`,
            templatePath: path_1.default.join(__dirname, "../template/NOTIFICACION_REPORTE_DISPOSITIVO_ACTIVO.html"),
            templateParams: { fecha, ...device, estado: "EN LÍNEA" }
        });
        await logger_1.default.writeLog(`Email ONLINE enviado: ${device.sn}`);
    }
    catch (error) {
        await logger_1.default.writeLog(`Error email ONLINE: ${error.message}`);
    }
}
async function sendDeviceDownMail(device) {
    try {
        const fecha = (0, moment_1.default)().format("DD/MM/YYYY HH:mm");
        await emailService_1.emailService.sendEmail({
            to: [process.env.CORREO_SOPORTE || "soporte@haug.com.pe"],
            subject: `DISPOSITIVO OFFLINE - ${device.alias}`,
            templatePath: path_1.default.join(__dirname, "../template/NOTIFICACION_REPORTE_DISPOSITIVO_CAIDO.html"),
            templateParams: { fecha, ...device }
        });
        await logger_1.default.writeLog(`Email OFFLINE enviado: ${device.sn}`);
    }
    catch (error) {
        await logger_1.default.writeLog(`Error email OFFLINE: ${error.message}`);
    }
}
/* ============================================================
   HELPERS
============================================================ */
function normalizeTerminal(t) {
    return { ...t, state: Number(t.state) };
}
function isDeviceDown(t) {
    if (t.state === 0)
        return true;
    if (!t.last_activity)
        return true;
    const last = new Date(t.last_activity.replace(" ", "T"));
    const diff = (Date.now() - last.getTime()) / 60000;
    return diff > 10;
}
/* ============================================================
   SYNC TRANSACCIONES
============================================================ */
async function syncTransaccionsBioTimes() {
    const start = Date.now();
    await logger_1.default.writeLog("=== INICIO syncTransaccionsBioTimes ===");
    try {
        const result = await db_1.default.exec([], conf_1.STORE_PROCEDURE.SSCA.SSCA_SP_PARAMETROS_SISTEMA_LIST);
        const { start_time, end_time } = result[0];
        await logger_1.default.writeLog(`Rango: ${start_time} → ${end_time}`);
        const token = await zktecoApi.getStaticToken();
        let allData = [];
        let page = 1;
        while (true) {
            const response = await zktecoApi.request({
                path: "/iclock/api/transactions/",
                method: "GET",
                token,
                params: { start_time, end_time, page_size: 1000, page }
            });
            const data = (response === null || response === void 0 ? void 0 : response.data) || [];
            await logger_1.default.writeLog(`Página ${page}: ${data.length}`);
            if (!data.length)
                break;
            allData.push(...data);
            if (data.length < 1000)
                break;
            page++;
        }
        if (allData.length) {
            await db_1.default.exec([{ json: JSON.stringify(allData) }], conf_1.STORE_PROCEDURE.SSCA.SSCA_SP_BIOTIME_TRANSACCIONES_INSERT);
            await logger_1.default.writeLog(`Insertados: ${allData.length}`);
        }
        else {
            await logger_1.default.writeLog("Sin datos");
        }
    }
    catch (error) {
        await logger_1.default.writeLog(`ERROR: ${error.message}`);
        await logger_1.default.logError(error, 'syncTransaccionsBioTimes');
    }
    await logger_1.default.writeLog("=== FIN syncTransaccionsBioTimes ===\n");
}
/* ============================================================
   SYNC PERSONAL
============================================================ */
async function syncPersonnelSqlS10ToBiotime() {
    await logger_1.default.writeLog("=== INICIO syncPersonnel ===");
    try {
        const req = {
            body: {
                CodSucursal: process.env.CODSUCURSAL || "001",
                CodProyectoNoProd: process.env.CODPROYECTONOPROD || "16386",
                usuario: "administrador"
            }
        };
        const res = {
            status: () => ({
                json: async (data) => {
                    await logger_1.default.writeLog("Respuesta recibida de controller");
                    return data;
                }
            })
        };
        await ZKTecoPersonnelBioTimeController_1.default.SincronizarEmployees(req, res);
    }
    catch (error) {
        await logger_1.default.writeLog(`ERROR: ${error.message}`);
        await logger_1.default.logError(error, 'syncPersonnel');
    }
    await logger_1.default.writeLog("=== FIN syncPersonnel ===\n");
}
