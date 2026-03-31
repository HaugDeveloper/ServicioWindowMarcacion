import express, { Application, Request, Response } from "express";
import cors                                         from "cors";
import morgan                                       from "morgan";
import dotenv                                       from "dotenv";
import { initCrons, stopCrons }                     from "./jobs";
import logger                                       from "./utils/logger";

dotenv.config();

/* ============================================================
   VARIABLES GLOBALES
============================================================ */
let serverInstance: any;
let isShuttingDown = false;

/* ============================================================
   UTILIDADES
============================================================ */
function getHoraPeru(): string {
  return new Date().toLocaleTimeString("es-PE", {
    timeZone: "America/Lima",
    hour12  : false
  });
}

/* ============================================================
   APP CLASS
============================================================ */
class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.config();
    this.routes();
  }

  private config(): void {

    const port = process.env.PORT || 9999;
    this.app.set("port", port);

    // ===============================
    // CORS
    // ===============================
    this.app.use(
      cors({
        origin:
          process.env.NODE_ENV === "production"
            ? ["http://ti.haug.com.pe"]
                            :  true,
        credentials         : true,
        allowedHeaders      : ["Content-Type", "Authorization", "access-token"],
        exposedHeaders      : ["Content-Range", "X-Content-Range"],
        maxAge              : 3600,
        optionsSuccessStatus: 200,
      })
    );

    // ===============================
    // MORGAN → LOGGER
    // ===============================
    const stream = {
      write: async (message: string) => {
        await logger.writeLog(`[HTTP] ${message.trim()}`);
      }
    };

    this.app.use(
      morgan(
        process.env.NODE_ENV === "production" ? "combined" : "dev",
        { stream }
      )
    );

    // ===============================
    // BODY
    // ===============================
    this.app.use(express.json({ limit: "50MB" }));
    this.app.use(express.urlencoded({ limit: "50MB", extended: true }));

    // ===============================
    // TRUST PROXY
    // ===============================
    this.app.set("trust proxy", true);

    logger.writeLog("Middlewares configurados correctamente");
  }

  private routes(): void {

    this.app.get("/health", async (_req: Request, res: Response) => {

      await logger.writeLog("Health check ejecutado");

      res.status(200).json({
        status     : "OK",
        timestamp  : new Date().toISOString(),
        environment: process.env.NODE_ENV,
        uptime     : process.uptime(),
      });
    });
  }

  private initCrons(): void {
    try {

      logger.writeLog("======================================");
      logger.writeLog("INICIALIZANDO CRON JOBS...");
      logger.writeLog("======================================");

      initCrons();

      logger.writeLog("CRON iniciados correctamente");
      logger.writeLog(`CRON activos desde: ${getHoraPeru()}`);

    } catch (error: any) {
      logger.writeLog(`ERROR CRON: ${error.message}`);
      logger.logError(error, "initCrons");
    }
  }

  public start(): void {

    const port = this.app.get("port");

    serverInstance = this.app.listen(port, async () => {

      await logger.writeLog("======================================");
      await logger.writeLog("SERVICIO DE MARCADORES HAUG");
      await logger.writeLog("======================================");
      await logger.writeLog(`Entorno: ${process.env.NODE_ENV || "development"}`);
      await logger.writeLog(`Puerto: ${port}`);
      await logger.writeLog(`URL: http://localhost:${port}`);
      await logger.writeLog(`DB: ${process.env.DB_SERVER || "No configurada"}`);
      await logger.writeLog(`Inicio: ${new Date().toISOString()}`);
      await logger.writeLog("======================================\n");

      this.initCrons();
    });

    serverInstance.on("error", async (error: any) => {

      if (error.code === "EADDRINUSE") {
        await logger.writeLog(`ERROR: Puerto ${port} en uso`);
      } else {
        await logger.writeLog(`ERROR SERVER: ${error.message}`);
      }

      await logger.logError(error, "server");
    });
  }
}

/* ============================================================
   SHUTDOWN CONTROLADO
============================================================ */
async function shutdown(signal: string) {

  if (isShuttingDown) return;
  isShuttingDown = true;

  try {
    await logger.writeLog(`\n${signal} recibido - cerrando servicio...`);

    // ===============================
    // DETENER CRONS
    // ===============================
    try {
      await stopCrons();
      await logger.writeLog("CRON detenidos correctamente");
    } catch (error: any) {
      await logger.writeLog(`ERROR al detener CRON: ${error.message}`);
    }

    // ===============================
    // CERRAR SERVIDOR HTTP
    // ===============================
    if (serverInstance) {
      await new Promise<void>((resolve, reject) => {
        serverInstance.close((err: any) => {
          if (err) return reject(err);
          resolve();
        });
      });

      await logger.writeLog("Servidor HTTP cerrado");
    }

    await logger.writeLog("Proceso finalizado correctamente\n");

    process.exit(0);

  } catch (error: any) {
    await logger.writeLog(`ERROR en shutdown: ${error.message}`);
    process.exit(1);
  }
}

/* ============================================================
   INICIO APP
============================================================ */
(async () => {

  await logger.writeLog("======================================");
  await logger.writeLog("INICIANDO SERVICIO...");
  await logger.writeLog("======================================");

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
  await logger.writeLog(`UNCAUGHT EXCEPTION: ${err.message}`);
  await logger.logError(err, "uncaughtException");
  await shutdown("uncaughtException");
});

process.on("unhandledRejection", async (reason: any) => {
  await logger.writeLog(`UNHANDLED REJECTION: ${reason}`);
  await logger.logError(reason, "unhandledRejection");
  await shutdown("unhandledRejection");
});