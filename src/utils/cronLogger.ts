import fs from "fs/promises";
import path from "path";
import moment from "moment";

/**
 * Log para procesos CRON
 * @param jobName  Nombre del job (sendMail, syncTransaccionsBioTimes, etc)
 * @param message  Mensaje principal
 * @param isError  true = ERROR | false = OK
 * @param meta     Información adicional opcional
 */
export async function logCron(
  jobName: string,
  message: string,
  isError: boolean = false,
  meta?: any
) {
  try {
    const now   = moment();
    const fecha = now.format("YYYY-MM-DD");
    const hora  = now.format("HH:mm:ss");

    const logDir = path.join(process.cwd(), "logs", "cron");
    await fs.mkdir(logDir, { recursive: true });

    const filePath = path.join(logDir, `${jobName}_${fecha}.log`);

    let logLine = `[${fecha} ${hora}] ${isError ? "ERROR" : "OK"} | ${message}`;

    if (meta) {
      logLine += ` | ${JSON.stringify(meta)}`;
    }

    logLine += "\n";

    await fs.appendFile(filePath, logLine, "utf8");
  } catch (err) {
    console.error("No se pudo escribir log CRON", err);
  }
}
