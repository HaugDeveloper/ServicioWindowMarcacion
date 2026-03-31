"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const jobs_1 = require("./jobs");
const logger_1 = __importDefault(require("./utils/logger"));
dotenv_1.default.config();
/* ============================================================
   VARIABLES GLOBALES
============================================================ */
let serverInstance;
let isShuttingDown = false;
/* ============================================================
   UTILIDADES
============================================================ */
function getHoraPeru() {
    return new Date().toLocaleTimeString("es-PE", {
        timeZone: "America/Lima",
        hour12: false
    });
}
/* ============================================================
   APP CLASS
============================================================ */
class App {
    constructor() {
        this.app = (0, express_1.default)();
        this.config();
        this.routes();
    }
    config() {
        const port = process.env.PORT || 9999;
        this.app.set("port", port);
        // ===============================
        // CORS
        // ===============================
        this.app.use((0, cors_1.default)({
            origin: process.env.NODE_ENV === "production"
                ? ["http://ti.haug.com.pe"]
                : true,
            credentials: true,
            allowedHeaders: ["Content-Type", "Authorization", "access-token"],
            exposedHeaders: ["Content-Range", "X-Content-Range"],
            maxAge: 3600,
            optionsSuccessStatus: 200,
        }));
        // ===============================
        // MORGAN → LOGGER
        // ===============================
        const stream = {
            write: async (message) => {
                await logger_1.default.writeLog(`[HTTP] ${message.trim()}`);
            }
        };
        this.app.use((0, morgan_1.default)(process.env.NODE_ENV === "production" ? "combined" : "dev", { stream }));
        // ===============================
        // BODY
        // ===============================
        this.app.use(express_1.default.json({ limit: "50MB" }));
        this.app.use(express_1.default.urlencoded({ limit: "50MB", extended: true }));
        // ===============================
        // TRUST PROXY
        // ===============================
        this.app.set("trust proxy", true);
        logger_1.default.writeLog("Middlewares configurados correctamente");
    }
    routes() {
        this.app.get("/health", async (_req, res) => {
            await logger_1.default.writeLog("Health check ejecutado");
            res.status(200).json({
                status: "OK",
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV,
                uptime: process.uptime(),
            });
        });
    }
    initCrons() {
        try {
            logger_1.default.writeLog("======================================");
            logger_1.default.writeLog("INICIALIZANDO CRON JOBS...");
            logger_1.default.writeLog("======================================");
            (0, jobs_1.initCrons)();
            logger_1.default.writeLog("CRON iniciados correctamente");
            logger_1.default.writeLog(`CRON activos desde: ${getHoraPeru()}`);
        }
        catch (error) {
            logger_1.default.writeLog(`ERROR CRON: ${error.message}`);
            logger_1.default.logError(error, "initCrons");
        }
    }
    start() {
        const port = this.app.get("port");
        serverInstance = this.app.listen(port, async () => {
            await logger_1.default.writeLog("======================================");
            await logger_1.default.writeLog("SERVICIO DE MARCADORES HAUG");
            await logger_1.default.writeLog("======================================");
            await logger_1.default.writeLog(`Entorno: ${process.env.NODE_ENV || "development"}`);
            await logger_1.default.writeLog(`Puerto: ${port}`);
            await logger_1.default.writeLog(`URL: http://localhost:${port}`);
            await logger_1.default.writeLog(`DB: ${process.env.DB_SERVER || "No configurada"}`);
            await logger_1.default.writeLog(`Inicio: ${new Date().toISOString()}`);
            await logger_1.default.writeLog("======================================\n");
            this.initCrons();
        });
        serverInstance.on("error", async (error) => {
            if (error.code === "EADDRINUSE") {
                await logger_1.default.writeLog(`ERROR: Puerto ${port} en uso`);
            }
            else {
                await logger_1.default.writeLog(`ERROR SERVER: ${error.message}`);
            }
            await logger_1.default.logError(error, "server");
        });
    }
}
/* ============================================================
   SHUTDOWN CONTROLADO
============================================================ */
async function shutdown(signal) {
    if (isShuttingDown)
        return;
    isShuttingDown = true;
    try {
        await logger_1.default.writeLog(`\n${signal} recibido - cerrando servicio...`);
        // ===============================
        // DETENER CRONS
        // ===============================
        try {
            await (0, jobs_1.stopCrons)();
            await logger_1.default.writeLog("CRON detenidos correctamente");
        }
        catch (error) {
            await logger_1.default.writeLog(`ERROR al detener CRON: ${error.message}`);
        }
        // ===============================
        // CERRAR SERVIDOR HTTP
        // ===============================
        if (serverInstance) {
            await new Promise((resolve, reject) => {
                serverInstance.close((err) => {
                    if (err)
                        return reject(err);
                    resolve();
                });
            });
            await logger_1.default.writeLog("Servidor HTTP cerrado");
        }
        await logger_1.default.writeLog("Proceso finalizado correctamente\n");
        process.exit(0);
    }
    catch (error) {
        await logger_1.default.writeLog(`ERROR en shutdown: ${error.message}`);
        process.exit(1);
    }
}
/* ============================================================
   INICIO APP
============================================================ */
(async () => {
    await logger_1.default.writeLog("======================================");
    await logger_1.default.writeLog("INICIANDO SERVICIO...");
    await logger_1.default.writeLog("======================================");
    const app = new App();
    app.start();
})();
/* ============================================================
   SEÑALES DEL SISTEMA
============================================================ */
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
/* ============================================================
   ERRORES GLOBALES
============================================================ */
process.on("uncaughtException", async (err) => {
    await logger_1.default.writeLog(`UNCAUGHT EXCEPTION: ${err.message}`);
    await logger_1.default.logError(err, "uncaughtException");
    await shutdown("uncaughtException");
});
process.on("unhandledRejection", async (reason) => {
    await logger_1.default.writeLog(`UNHANDLED REJECTION: ${reason}`);
    await logger_1.default.logError(reason, "unhandledRejection");
    await shutdown("unhandledRejection");
});
