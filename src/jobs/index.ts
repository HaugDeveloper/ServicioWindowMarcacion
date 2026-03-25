import cron from "node-cron";
import { sendMail } from "../controllers/DashboardController";
import {
  syncTransaccionsBioTimes,
  syncPersonnelSqlS10ToBiotime,
  syncDevicesState,
} from "../controllers/CronJobsController";

const running = new Set<string>();

const runJob = (name: string, job: () => Promise<void>) => async () => {
  if (running.has(name)) {
    console.log(`[CRON] ${name} aún en ejecución, omitido`);
    return;
  }

  running.add(name);

  const start = Date.now();

  try {
    console.log(`[CRON] Iniciando ${name}`);

    // Timeout protector (ej: 10 min)
    await Promise.race([
      job(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout excedido")), 10 * 60 * 1000)
      ),
    ]);

    console.log(`[CRON] ${name} finalizado en ${Date.now() - start}ms`);
  } catch (error) {
    console.error(`[CRON] Error en ${name}:`, error);

    // IMPORTANTE: nunca relanzar error
    // throw error;  <-- NUNCA
  } finally {
    running.delete(name);
  }
};

export const initCrons = () => {
  console.log("Iniciando CRON jobs...");

  // Cada hora
  cron.schedule(
    "* * * * *",
    runJob("syncTransaccionsBioTimes", syncTransaccionsBioTimes),
    { timezone: "America/Lima" }
  );

  // 23:00
  cron.schedule(
    "* * * * *",
    runJob("syncPersonnelSqlS10ToBiotime", syncPersonnelSqlS10ToBiotime),
    { timezone: "America/Lima" }
  );

  // 08:30 AM
  cron.schedule(
    "* * * * *",
    runJob("sendMail", sendMail),
    { timezone: "America/Lima" }
  );

  // Cada hora
  cron.schedule(
    "* * * * *",
    runJob("syncDevicesState", syncDevicesState),
    { timezone: "America/Lima" }
  );

  console.log("CRON inicializados correctamente");
};