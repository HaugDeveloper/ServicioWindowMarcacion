"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCrons = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const DashboardController_1 = require("../controllers/DashboardController");
const CronJobsController_1 = require("../controllers/CronJobsController");
const running = new Set();
const runJob = (name, job) => async () => {
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
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout excedido")), 10 * 60 * 1000)),
        ]);
        console.log(`[CRON] ${name} finalizado en ${Date.now() - start}ms`);
    }
    catch (error) {
        console.error(`[CRON] Error en ${name}:`, error);
        // IMPORTANTE: nunca relanzar error
        // throw error;  <-- NUNCA
    }
    finally {
        running.delete(name);
    }
};
const initCrons = () => {
    console.log("Iniciando CRON jobs...");
    // Cada hora
    node_cron_1.default.schedule("* * * * *", runJob("syncTransaccionsBioTimes", CronJobsController_1.syncTransaccionsBioTimes), { timezone: "America/Lima" });
    // 23:00
    node_cron_1.default.schedule("* * * * *", runJob("syncPersonnelSqlS10ToBiotime", CronJobsController_1.syncPersonnelSqlS10ToBiotime), { timezone: "America/Lima" });
    // 08:30 AM
    node_cron_1.default.schedule("* * * * *", runJob("sendMail", DashboardController_1.sendMail), { timezone: "America/Lima" });
    // Cada hora
    node_cron_1.default.schedule("* * * * *", runJob("syncDevicesState", CronJobsController_1.syncDevicesState), { timezone: "America/Lima" });
    console.log("CRON inicializados correctamente");
};
exports.initCrons = initCrons;
