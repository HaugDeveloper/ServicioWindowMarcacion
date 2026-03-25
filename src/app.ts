import express, { Application, Request, Response } from "express";
import cors                                         from "cors";
import path                                         from "path";
import morgan                                       from "morgan";
import dotenv                                       from "dotenv";
import { initCrons }                                from "./jobs";
import logger                                       from './utils/logger';

// dotenv.config();

function getHoraPeru(): string {
  return new Date().toLocaleTimeString('es-PE', {
    timeZone: 'America/Lima',
    hour12: false
  });
}

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
            : true,
        credentials         : true,
        allowedHeaders      : ["Content-Type", "Authorization", "access-token"],
        exposedHeaders      : ["Content-Range", "X-Content-Range"],
        maxAge              : 3600,
        optionsSuccessStatus: 200,
      })
    );

    // ===============================
    // MORGAN → LOGGER (NO console.log)
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
    // BODY PARSER
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

    // ===============================
    // HEALTH CHECK
    // ===============================
    this.app.get("/health", async (req: Request, res: Response) => {

      await logger.writeLog("Health check ejecutado");

      res.status(200).json({
        status      : "OK",
        timestamp   : new Date().toISOString(),
        environment : process.env.NODE_ENV,
        uptime      : process.uptime(),
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
      logger.logError(error, 'initCrons');
    }
  }

  public start(): void {

    const port = this.app.get("port");

    const server = this.app.listen(port, async () => {

      await logger.writeLog("======================================");
      await logger.writeLog("SERVICIO DE MARCADORES HAUG");
      await logger.writeLog("======================================");
      await logger.writeLog(`Entorno: ${process.env.NODE_ENV || "development"}`);
      await logger.writeLog(`Puerto: ${port}`);
      await logger.writeLog(`URL: http://localhost:${port}`);
      await logger.writeLog(`DB: ${process.env.DB_SERVER || "No configurada"}`);
      await logger.writeLog(`Inicio: ${new Date().toISOString()}`);
      await logger.writeLog("======================================\n");

      // 🔥 CRONS DESPUÉS DE INICIAR
      this.initCrons();
    });

    // ===============================
    // ERRORES DEL SERVER
    // ===============================
    server.on("error", async (error: any) => {

      if (error.code === "EADDRINUSE") {
        await logger.writeLog(`ERROR: Puerto ${port} en uso`);
      } else {
        await logger.writeLog(`ERROR SERVER: ${error.message}`);
      }

      await logger.logError(error, 'server');
    });
  }
}

/* ============================================================
   INICIO APP
============================================================ */

(async () => {

  await logger.writeLog("======================================");
  await logger.writeLog("INICIANDO SERVICIO...");
  await logger.writeLog("======================================");

  const server = new App();
  server.start();

})();

/* ============================================================
   SEÑALES DEL SISTEMA (WINDOWS SERVICE)
============================================================ */

process.on("SIGTERM", async () => {
  await logger.writeLog("SIGTERM recibido - cerrando servicio...");
});

process.on("SIGINT", async () => {
  await logger.writeLog("SIGINT recibido - cerrando servicio...");
});

/* ============================================================
   ERRORES GLOBALES
============================================================ */

process.on('uncaughtException', async (err) => {
  await logger.writeLog(`UNCAUGHT EXCEPTION: ${err.message}`);
  await logger.logError(err, 'uncaughtException');
});

process.on('unhandledRejection', async (reason: any) => {
  await logger.writeLog(`UNHANDLED REJECTION: ${reason}`);
  await logger.logError(reason, 'unhandledRejection');
});