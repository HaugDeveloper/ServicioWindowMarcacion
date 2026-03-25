import fs                               from "fs";
import path                             from "path";
import moment                           from "moment";
import { zkteco }                       from "../api/index";
import DB                               from "../config/db";
import { STORE_PROCEDURE }              from "../config/conf";
import zKTecoPersonnelBioTimeController from "./ZKTecoPersonnelBioTimeController";
import { emailService }                 from "../services/emailService";
import logger                           from '../utils/logger';

const zktecoApi = new zkteco.zkteco_auth_biotime.ZKTeco_Auth_BioTime();

/* ============================================================
   MANEJO GLOBAL DE ERRORES (NO CAER SERVICIO)
============================================================ */
process.on('uncaughtException', async (err) => {
  await logger.writeLog(`UNCAUGHT EXCEPTION: ${err.message}`);
  await logger.logError(err, 'uncaughtException');
});

process.on('unhandledRejection', async (reason: any) => {
  await logger.writeLog(`UNHANDLED REJECTION: ${reason}`);
  await logger.logError(reason, 'unhandledRejection');
});

/* ============================================================
   MANEJADOR DE ESTADOS DE DISPOSITIVOS
============================================================ */

const stateFilePath = path.join(__dirname, "../storage/deviceState.json");

type DeviceState = {
  lastState?: "ACTIVE" | "DOWN";
  lastActiveNotificationDate?: string;
};

type StateFile = {
  devices: Record<string, DeviceState>;
};

function loadState(): StateFile {
  try {
    if (!fs.existsSync(stateFilePath)) {
      return { devices: {} };
    }

    const data = fs.readFileSync(stateFilePath, "utf-8");
    return JSON.parse(data);

  } catch (error: any) {
    logger.writeLog(`Error leyendo estado: ${error.message}`);
    return { devices: {} };
  }
}

function saveState(state: StateFile) {
  try {
    const dir = path.dirname(stateFilePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2));

  } catch (error: any) {
    logger.writeLog(`Error guardando estado: ${error.message}`);
  }
}

/* ============================================================
   SYNC DISPOSITIVOS
============================================================ */

export async function syncDevicesState() {

  await logger.writeLog("=== INICIO syncDevicesState ===");

  try {
    const state = loadState();

    const staticToken = await zktecoApi.getStaticToken();

    const response = await zktecoApi.request({
      path: "/iclock/api/terminals/?page_size=1000",
      method: "GET",
      token: staticToken
    });

    const devices = (response.data || []).map(normalizeTerminal);

    const activeDevices = devices.filter(d => !isDeviceDown(d));
    const downDevices   = devices.filter(isDeviceDown);

    const now   = new Date();
    const hour  = now.getHours();
    const today = now.toISOString().split("T")[0];

    await logger.writeLog(`Total dispositivos: ${devices.length}`);
    await logger.writeLog(`Activos: ${activeDevices.length} | Caídos: ${downDevices.length}`);

    // OFFLINE
    for (const device of downDevices) {
      const deviceState = state.devices[device.sn] || {};

      if (deviceState.lastState !== "DOWN") {

        await sendDeviceDownMail(device);

        state.devices[device.sn] = {
          ...deviceState,
          lastState: "DOWN"
        };

        await logger.writeLog(`ALERTA OFFLINE: ${device.sn}`);
      }
    }

    // ONLINE
    for (const device of activeDevices) {
      const deviceState = state.devices[device.sn] || {};

      if (deviceState.lastState === "DOWN") {

        await sendDeviceActiveMail(device);

        state.devices[device.sn] = {
          ...deviceState,
          lastState: "ACTIVE"
        };

        await logger.writeLog(`RECUPERADO: ${device.sn}`);
      }
    }

    // REPORTE DIARIO 6 AM
    if (hour === 6) {

      await logger.writeLog("REPORTE DIARIO ONLINE");

      for (const device of activeDevices) {

        const deviceState = state.devices[device.sn] || {};

        if (deviceState.lastActiveNotificationDate !== today) {

          await sendDeviceActiveMail(device);

          state.devices[device.sn] = {
            ...deviceState,
            lastActiveNotificationDate: today,
            lastState: "ACTIVE"
          };

          await logger.writeLog(`REPORTE DIARIO: ${device.sn}`);
        }
      }
    }

    saveState(state);

  } catch (error: any) {
    await logger.writeLog(`ERROR syncDevicesState: ${error.message}`);
    await logger.logError(error, 'syncDevicesState');
  }

  await logger.writeLog("=== FIN syncDevicesState ===\n");
}

/* ============================================================
   EMAILS
============================================================ */

async function sendDeviceActiveMail(device: any) {
  try {
    const fecha = moment().format("DD/MM/YYYY HH:mm");

    await emailService.sendEmail({
      to     : [process.env.CORREO_SOPORTE || "soporte@haug.com.pe"],
      subject: `DISPOSITIVO ONLINE - ${device.alias}`,
      templatePath: path.join(__dirname,"../template/NOTIFICACION_REPORTE_DISPOSITIVO_ACTIVO.html"),
      templateParams: { fecha, ...device, estado: "EN LÍNEA" }
    });

    await logger.writeLog(`Email ONLINE enviado: ${device.sn}`);

  } catch (error: any) {
    await logger.writeLog(`Error email ONLINE: ${error.message}`);
  }
}

async function sendDeviceDownMail(device: any) {
  try {
    const fecha = moment().format("DD/MM/YYYY HH:mm");

    await emailService.sendEmail({
      to     : [process.env.CORREO_SOPORTE || "soporte@haug.com.pe"],
      subject: `DISPOSITIVO OFFLINE - ${device.alias}`,
      templatePath: path.join(__dirname,"../template/NOTIFICACION_REPORTE_DISPOSITIVO_CAIDO.html"),
      templateParams: { fecha, ...device }
    });

    await logger.writeLog(`Email OFFLINE enviado: ${device.sn}`);

  } catch (error: any) {
    await logger.writeLog(`Error email OFFLINE: ${error.message}`);
  }
}

/* ============================================================
   HELPERS
============================================================ */

function normalizeTerminal(t: any) {
  return { ...t, state: Number(t.state) };
}

function isDeviceDown(t: any): boolean {
  if (t.state === 0) return true;
  if (!t.last_activity) return true;

  const last = new Date(t.last_activity.replace(" ", "T"));
  const diff = (Date.now() - last.getTime()) / 60000;

  return diff > 10;
}

/* ============================================================
   SYNC TRANSACCIONES
============================================================ */

export async function syncTransaccionsBioTimes() {
  const start = Date.now();

  await logger.writeLog("=== INICIO syncTransaccionsBioTimes ===");

  try {

    const result: any[] = await DB.exec(
      [],
      STORE_PROCEDURE.SSCA.SSCA_SP_PARAMETROS_SISTEMA_LIST
    );

    const { start_time, end_time } = result[0];

    await logger.writeLog(`Rango: ${start_time} → ${end_time}`);

    const token = await zktecoApi.getStaticToken();

    let allData: any[] = [];
    let page = 1;

    while (true) {

      const response = await zktecoApi.request({
        path: "/iclock/api/transactions/",
        method: "GET",
        token,
        params: { start_time, end_time, page_size: 1000, page }
      });

      const data = response?.data || [];

      await logger.writeLog(`Página ${page}: ${data.length}`);

      if (!data.length) break;

      allData.push(...data);

      if (data.length < 1000) break;

      page++;
    }

    if (allData.length) {

      await DB.exec(
        [{ json: JSON.stringify(allData) }],
        STORE_PROCEDURE.SSCA.SSCA_SP_BIOTIME_TRANSACCIONES_INSERT
      );

      await logger.writeLog(`Insertados: ${allData.length}`);

    } else {
      await logger.writeLog("Sin datos");
    }

  } catch (error: any) {
    await logger.writeLog(`ERROR: ${error.message}`);
    await logger.logError(error, 'syncTransaccionsBioTimes');
  }

  await logger.writeLog("=== FIN syncTransaccionsBioTimes ===\n");
}

/* ============================================================
   SYNC PERSONAL
============================================================ */

export async function syncPersonnelSqlS10ToBiotime() {

  await logger.writeLog("=== INICIO syncPersonnel ===");

  try {

    const req: any = {
      body: {
        CodSucursal      : process.env.CODSUCURSAL || "001",
        CodProyectoNoProd: process.env.CODPROYECTONOPROD || "16386",
        usuario          : "administrador"
      }
    };

    const res: any = {
      status: () => ({
        json: async (data: any) => {
          await logger.writeLog("Respuesta recibida de controller");
          return data;
        }
      })
    };

    await zKTecoPersonnelBioTimeController.SincronizarEmployees(req, res);

  } catch (error: any) {
    await logger.writeLog(`ERROR: ${error.message}`);
    await logger.logError(error, 'syncPersonnel');
  }

  await logger.writeLog("=== FIN syncPersonnel ===\n");
}