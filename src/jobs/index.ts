import cron, { ScheduledTask } from "node-cron";
import { sendMail } from "../controllers/DashboardController";
import {
  syncTransaccionsBioTimes,
  syncPersonnelSqlS10ToBiotime,
  syncDevicesState,
} from "../controllers/CronJobsController";

const running = new Set<string>();
const tasks: ScheduledTask[] = []; // 🔥 IMPORTANTE

/* ============================================================
   WRAPPER SEGURO
============================================================ */
const runJob = (name: string, job: () => Promise<void>) => async () => {

  if (running.has(name)) {
    console.log(`[CRON] ${name} aún en ejecución, omitido`);
    return;
  }

  running.add(name);
  const start = Date.now();

  try {

    console.log(`[CRON] Iniciando ${name}`);

    await Promise.race([
      job(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout excedido")), 10 * 60 * 1000)
      ),
    ]);

    console.log(`[CRON] ${name} finalizado en ${Date.now() - start}ms`);

  } catch (error) {

    console.error(`[CRON] Error en ${name}:`, error);

  } finally {
    running.delete(name);
  }
};

/* ============================================================
   INICIAR CRONS
============================================================ */
export const initCrons = () => {

  console.log("Iniciando CRON jobs...");

  tasks.push(
    cron.schedule(
      "0 * * * *",
      runJob("syncTransaccionsBioTimes", syncTransaccionsBioTimes),
      { timezone: "America/Lima" }
    )
  );

  tasks.push(
    cron.schedule(
      "0 23 * * *",
      runJob("syncPersonnelSqlS10ToBiotime", syncPersonnelSqlS10ToBiotime),
      { timezone: "America/Lima" }
    )
  );

  tasks.push(
    cron.schedule(
      "30 8 * * *",
      runJob("sendMail", sendMail),
      { timezone: "America/Lima" }
    )
  );

  tasks.push(
    cron.schedule(
      "0 * * * *",
      runJob("syncDevicesState", syncDevicesState),
      { timezone: "America/Lima" }
    )
  );

  console.log("CRON inicializados correctamente");
};

/* ============================================================
   DETENER CRONS 🔥 CLAVE
============================================================ */
export const stopCrons = async () => {

  console.log("Deteniendo CRON jobs...");

  for (const task of tasks) {
    try {
      task.stop();      // detiene ejecución
      task.destroy();   // limpia completamente
    } catch (error) {
      console.error("Error deteniendo cron:", error);
    }
  }

  tasks.length = 0;

  console.log("CRON detenidos correctamente");
};