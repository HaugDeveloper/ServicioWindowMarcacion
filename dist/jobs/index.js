"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopCrons = exports.initCrons = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const DashboardController_1 = require("../controllers/DashboardController");
const CronJobsController_1 = require("../controllers/CronJobsController");
const running = new Set();
const tasks = []; // 🔥 IMPORTANTE
/* ============================================================
   WRAPPER SEGURO
============================================================ */
const runJob = (name, job) => async () => {
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
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout excedido")), 10 * 60 * 1000)),
        ]);
        console.log(`[CRON] ${name} finalizado en ${Date.now() - start}ms`);
    }
    catch (error) {
        console.error(`[CRON] Error en ${name}:`, error);
    }
    finally {
        running.delete(name);
    }
};
/* ============================================================
   INICIAR CRONS
============================================================ */
const initCrons = () => {
    console.log("Iniciando CRON jobs...");
    tasks.push(node_cron_1.default.schedule("0 * * * *", runJob("syncTransaccionsBioTimes", CronJobsController_1.syncTransaccionsBioTimes), { timezone: "America/Lima" }));
    tasks.push(node_cron_1.default.schedule("0 23 * * *", runJob("syncPersonnelSqlS10ToBiotime", CronJobsController_1.syncPersonnelSqlS10ToBiotime), { timezone: "America/Lima" }));
    tasks.push(node_cron_1.default.schedule("30 8 * * *", runJob("sendMail", DashboardController_1.sendMail), { timezone: "America/Lima" }));
    tasks.push(node_cron_1.default.schedule("0 * * * *", runJob("syncDevicesState", CronJobsController_1.syncDevicesState), { timezone: "America/Lima" }));
    console.log("CRON inicializados correctamente");
};
exports.initCrons = initCrons;
/* ============================================================
   DETENER CRONS 🔥 CLAVE
============================================================ */
const stopCrons = async () => {
    console.log("Deteniendo CRON jobs...");
    for (const task of tasks) {
        try {
            task.stop(); // 🔥 detiene ejecución
            task.destroy(); // 🔥 limpia completamente
        }
        catch (error) {
            console.error("Error deteniendo cron:", error);
        }
    }
    tasks.length = 0;
    console.log("CRON detenidos correctamente");
};
exports.stopCrons = stopCrons;
