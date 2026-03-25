"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const jobs_1 = require("./jobs");
const logger_1 = __importDefault(require("./utils/logger"));
// dotenv.config();
function getHoraPeru() {
    return new Date().toLocaleTimeString('es-PE', {
        timeZone: 'America/Lima',
        hour12: false
    });
}
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
        // MORGAN → LOGGER (NO console.log)
        // ===============================
        const stream = {
            write: async (message) => {
                await logger_1.default.writeLog(`[HTTP] ${message.trim()}`);
            }
        };
        this.app.use((0, morgan_1.default)(process.env.NODE_ENV === "production" ? "combined" : "dev", { stream }));
        // ===============================
        // BODY PARSER
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
        // ===============================
        // HEALTH CHECK
        // ===============================
        this.app.get("/health", async (req, res) => {
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
            logger_1.default.logError(error, 'initCrons');
        }
    }
    start() {
        const port = this.app.get("port");
        const server = this.app.listen(port, async () => {
            await logger_1.default.writeLog("======================================");
            await logger_1.default.writeLog("SERVICIO DE MARCADORES HAUG");
            await logger_1.default.writeLog("======================================");
            await logger_1.default.writeLog(`Entorno: ${process.env.NODE_ENV || "development"}`);
            await logger_1.default.writeLog(`Puerto: ${port}`);
            await logger_1.default.writeLog(`URL: http://localhost:${port}`);
            await logger_1.default.writeLog(`DB: ${process.env.DB_SERVER || "No configurada"}`);
            await logger_1.default.writeLog(`Inicio: ${new Date().toISOString()}`);
            await logger_1.default.writeLog("======================================\n");
            // 🔥 CRONS DESPUÉS DE INICIAR
            this.initCrons();
        });
        // ===============================
        // ERRORES DEL SERVER
        // ===============================
        server.on("error", async (error) => {
            if (error.code === "EADDRINUSE") {
                await logger_1.default.writeLog(`ERROR: Puerto ${port} en uso`);
            }
            else {
                await logger_1.default.writeLog(`ERROR SERVER: ${error.message}`);
            }
            await logger_1.default.logError(error, 'server');
        });
    }
}
/* ============================================================
   INICIO APP
============================================================ */
(async () => {
    await logger_1.default.writeLog("======================================");
    await logger_1.default.writeLog("INICIANDO SERVICIO...");
    await logger_1.default.writeLog("======================================");
    const server = new App();
    server.start();
})();
/* ============================================================
   SEÑALES DEL SISTEMA (WINDOWS SERVICE)
============================================================ */
process.on("SIGTERM", async () => {
    await logger_1.default.writeLog("SIGTERM recibido - cerrando servicio...");
});
process.on("SIGINT", async () => {
    await logger_1.default.writeLog("SIGINT recibido - cerrando servicio...");
});
/* ============================================================
   ERRORES GLOBALES
============================================================ */
process.on('uncaughtException', async (err) => {
    await logger_1.default.writeLog(`UNCAUGHT EXCEPTION: ${err.message}`);
    await logger_1.default.logError(err, 'uncaughtException');
});
process.on('unhandledRejection', async (reason) => {
    await logger_1.default.writeLog(`UNHANDLED REJECTION: ${reason}`);
    await logger_1.default.logError(reason, 'unhandledRejection');
});
