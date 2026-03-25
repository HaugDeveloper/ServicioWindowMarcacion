"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
// Ejecutar manualmente
router.get("/sync-transactions", controllers_1.CronJobsController.syncTransaccionsBioTimes);
router.get("/sync-personnel", controllers_1.CronJobsController.syncPersonnelSqlS10ToBiotime);
router.get("/sync-devices", controllers_1.CronJobsController.syncDevicesState);
exports.default = router;
