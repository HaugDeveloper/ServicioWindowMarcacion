import { Router } from "express";
import { CronJobsController } from "../controllers";

const router: Router = Router();

// Ejecutar manualmente
router.get("/sync-transactions", CronJobsController.syncTransaccionsBioTimes);
router.get("/sync-personnel", CronJobsController.syncPersonnelSqlS10ToBiotime);
router.get("/sync-devices", CronJobsController.syncDevicesState);

export default router;