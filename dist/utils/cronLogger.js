"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logCron = logCron;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const moment_1 = __importDefault(require("moment"));
/**
 * Log para procesos CRON
 * @param jobName  Nombre del job (sendMail, syncTransaccionsBioTimes, etc)
 * @param message  Mensaje principal
 * @param isError  true = ERROR | false = OK
 * @param meta     Información adicional opcional
 */
async function logCron(jobName, message, isError = false, meta) {
    try {
        const now = (0, moment_1.default)();
        const fecha = now.format("YYYY-MM-DD");
        const hora = now.format("HH:mm:ss");
        const logDir = path_1.default.join(process.cwd(), "logs", "cron");
        await promises_1.default.mkdir(logDir, { recursive: true });
        const filePath = path_1.default.join(logDir, `${jobName}_${fecha}.log`);
        let logLine = `[${fecha} ${hora}] ${isError ? "ERROR" : "OK"} | ${message}`;
        if (meta) {
            logLine += ` | ${JSON.stringify(meta)}`;
        }
        logLine += "\n";
        await promises_1.default.appendFile(filePath, logLine, "utf8");
    }
    catch (err) {
        console.error("No se pudo escribir log CRON", err);
    }
}
