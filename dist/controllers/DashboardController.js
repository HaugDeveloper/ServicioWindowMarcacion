"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = sendMail;
exports.GETNOTIFICACIONREPORTEMARCACIONESPORFECHA = GETNOTIFICACIONREPORTEMARCACIONESPORFECHA;
exports.SSCA_NOTIFICACION_REPORTE_MARCACIONES_POR_FECHA = SSCA_NOTIFICACION_REPORTE_MARCACIONES_POR_FECHA;
exports.GETNOTIFICACIONREPORTEMARCACIONESPORFECHAEXCEL = GETNOTIFICACIONREPORTEMARCACIONESPORFECHAEXCEL;
exports.SSCA_NOTIFICACION_REPORTE_MARCACIONES_POR_FECHA_EXCEL = SSCA_NOTIFICACION_REPORTE_MARCACIONES_POR_FECHA_EXCEL;
const db_1 = __importDefault(require("../config/db"));
const conf_1 = require("../config/conf");
const mssql_1 = __importDefault(require("mssql"));
const emailService_1 = require("../services/emailService");
const exceljs_1 = __importDefault(require("exceljs"));
const path_1 = __importDefault(require("path"));
const moment_1 = __importDefault(require("moment"));
const fs_1 = __importDefault(require("fs"));
const promises_1 = __importDefault(require("fs/promises"));
const cronLogger_1 = require("../utils/cronLogger");
// import { runCronSafe }        from "../services/cronLock";
// import { sendMailWithRetry }  from "../services/sendMailWithRetry";
const CodSucursal = process.env.CODSUCURSAL || '001';
const CodProyectoNoProd = process.env.CODPROYECTONOPROD || '16386';
async function sendMail() {
    let filePath = null;
    const fechaHoy = (0, moment_1.default)()
        .subtract(1, 'days')
        .format('DD-MM-YYYY');
    try {
        console.log(fechaHoy);
        await (0, cronLogger_1.logCron)("sendMail", `Inicio envío correo | Fecha reporte: ${fechaHoy}`);
        const data = await GETNOTIFICACIONREPORTEMARCACIONESPORFECHA(CodSucursal, CodProyectoNoProd, fechaHoy);
        filePath = await GETNOTIFICACIONREPORTEMARCACIONESPORFECHAEXCEL(CodSucursal, CodProyectoNoProd, fechaHoy);
        const templatePath = path_1.default.join(__dirname, "../template/NOTIFICACION_REPORTE_MARCACIONES_POR_FECHA.html");
        // const templatePath = path.join(
        //   __dirname,
        //   "..",
        //   process.env.NODE_ENV === "production" ? "dist" : "src",
        //   "services",
        //   "NOTIFICACION_REPORTE_MARCACIONES_POR_FECHA.html"
        // );
        await emailService_1.emailService.sendEmail({
            to: [
                "mario.incio@haug.com.pe"
            ],
            // to     : [
            //   "maria.mendizabal@haug.com.pe"
            // ],
            // cc: [
            //   "jose.romero@haug.com.pe",
            //   "jose.romero@haug.com.pe"
            // ],
            // cc     : [
            //   "soporte@haug.com.pe",
            //   "renzo.zelaya@haug.com.pe",
            //   "mario.incio@haug.com.pe",
            //   "christian.torres@haug.com.pe",
            //   "freddy.rendon@haug.com.pe"
            // ],
            // bcc    : [
            //   "jose.romero@haug.com.pe"
            // ],
            subject: `Reporte de Marcaciones de la fecha - ${data.fecha}`,
            text: `Resumen de marcaciones para ${data.fecha}: Activos ${data.Total_Personal_Biotime}, Marcaciones ${data.Total_Marcaron}.`,
            templatePath,
            templateParams: data,
            attachments: [
                {
                    filename: `Reporte_Marcaciones_${fechaHoy}.xlsx`,
                    path: filePath,
                    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                },
            ],
        });
        await (0, cronLogger_1.logCron)("sendMail", `Correo enviado correctamente | Total marcaciones: ${data.Total_Marcaron}`);
        console.log("Email de reporte enviado correctamente.");
    }
    catch (error) {
        console.error("Error enviando el correo:", error);
        await (0, cronLogger_1.logCron)("sendMail", `Fallo envío correo | ${error.message || error}`, true);
        // throw error;
    }
    finally {
        // ELIMINAR ARCHIVO TEMPORAL SIEMPRE
        if (filePath) {
            try {
                await promises_1.default.unlink(filePath);
                await (0, cronLogger_1.logCron)("sendMail", `Archivo temporal eliminado: ${filePath}`);
            }
            catch (err) {
                await (0, cronLogger_1.logCron)("sendMail", `No se pudo eliminar archivo: ${err.message}`, true);
            }
        }
    }
}
// ==================================================
// --- Función para obtener marcaciones por fecha ---
async function GETNOTIFICACIONREPORTEMARCACIONESPORFECHA(CodSucursal, CodProyectoNoProd, fecha) {
    // console.log("Fecha solicitada:", fecha);
    const result = await SSCA_NOTIFICACION_REPORTE_MARCACIONES_POR_FECHA(CodSucursal, CodProyectoNoProd, fecha);
    // console.log("Datos obtenidos result:", result);
    const row = result[0] || {};
    // console.log("Datos obtenidos row:", row);
    return {
        fecha: fecha,
        Total_Personal_S10: row.Total_Personal_S10 || 0,
        Total_Personal_Biotime: row.Total_Personal_Biotime || 0,
        Total_Marcaron: row.Total_Marcaron || 0,
        Total_NoMarcaron: row.Total_NoMarcaron || 0,
        Total_Huella: row.Total_Huella || 0,
        Total_Rostro: row.Total_Rostro || 0,
        Total_Foto: row.Total_Foto || 0,
        Total_ConBiometria: row.Total_ConBiometria || 0,
        Total_SinBiometria: row.Total_SinBiometria || 0,
        Total_Ingresos: row.Total_Ingresos || 0,
        Total_SalidaAlmorzar: row.Total_SalidaAlmorzar || 0,
        Total_RetornoAlmorzar: row.Total_RetornoAlmorzar || 0,
        Total_Salida: row.Total_Salida || 0
    };
}
// SQL STORE PROCEDURE
async function SSCA_NOTIFICACION_REPORTE_MARCACIONES_POR_FECHA(CodSucursal, CodProyectoNoProd, fecha) {
    const result = await db_1.default.exec([
        { name: 'CodSucursal', value: CodSucursal, type: mssql_1.default.VarChar },
        { name: 'CodProyectoNoProd', value: CodProyectoNoProd, type: mssql_1.default.VarChar },
        { name: 'Fecha', value: fecha, type: mssql_1.default.VarChar },
    ], conf_1.STORE_PROCEDURE.SSCA.SSCA_NOTIFICACION_REPORTE_MARCACIONES_POR_FECHA);
    return result;
}
;
// ==================================================
// --- Función para obtener marcaciones por fecha ---
async function GETNOTIFICACIONREPORTEMARCACIONESPORFECHAEXCEL(CodSucursal, CodProyectoNoProd, fecha) {
    const data = await SSCA_NOTIFICACION_REPORTE_MARCACIONES_POR_FECHA_EXCEL(CodSucursal, CodProyectoNoProd, fecha);
    const workbook = new exceljs_1.default.Workbook();
    const sheet = workbook.addWorksheet("Reporte");
    sheet.columns = [
        { header: "DNI", key: "dni", width: 12 },
        { header: "CODOBRERO", key: "codobrero", width: 12 },
        { header: "PERSONAL", key: "personal", width: 50 },
        { header: "FECHA", key: "fecha", width: 12 },
        { header: "Ingreso", key: "ingreso", width: 12 },
        { header: "Salida Almuerzo", key: "salidaAlmorzar", width: 16 },
        { header: "Retorno Almuerzo", key: "retornoAlmorzar", width: 18 },
        { header: "Salida", key: "salida", width: 12 },
        { header: "Total Marcaciones", key: "total", width: 20 },
        { header: "Marcó", key: "marco", width: 20 },
    ];
    const headerRow = sheet.getRow(1);
    headerRow.height = 20;
    headerRow.eachCell((cell) => {
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFF00" },
        };
        cell.font = { color: { argb: "000000" }, bold: true };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
        };
    });
    // Agregar datos
    data.forEach((row) => {
        var _a, _b, _c, _d;
        const newRow = sheet.addRow({
            dni: row.DNI,
            codobrero: row.CODOBRERO,
            personal: row.PERSONAL,
            fecha: formatoFechaSQL(row.FECHA),
            ingreso: (_a = row.Ingreso) !== null && _a !== void 0 ? _a : "",
            salidaAlmorzar: (_b = row.SalidaAlmorzar) !== null && _b !== void 0 ? _b : "",
            retornoAlmorzar: (_c = row.RetornoAlmorzar) !== null && _c !== void 0 ? _c : "",
            salida: (_d = row.Salida) !== null && _d !== void 0 ? _d : "",
            total: row.TOTAL_MARCACIONES,
            marco: row.MARCO,
        });
        // Lista de columnas a centrar
        const columnasCentrar = ["fecha", "ingreso", "salidaAlmorzar", "retornoAlmorzar", "salida", "total"];
        columnasCentrar.forEach((col) => {
            const cell = newRow.getCell(col);
            cell.alignment = { horizontal: "center", vertical: "middle" };
            // Mantener bordes
            cell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
        });
        newRow.eachCell({ includeEmpty: true }, (cell) => {
            cell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
        });
    });
    // const tempFolder = path.join(__dirname, "..", "..", "src", "temp");
    let tempFolder = '';
    if (process.env.NODE_ENV === 'production') {
        tempFolder = path_1.default.join(__dirname, "..", "temp");
    }
    else {
        tempFolder = path_1.default.join(__dirname, "..", "temp");
    }
    if (!fs_1.default.existsSync(tempFolder))
        fs_1.default.mkdirSync(tempFolder, { recursive: true });
    const filePath = path_1.default.join(tempFolder, `Reporte_Marcaciones_${fecha}.xlsx`);
    await workbook.xlsx.writeFile(filePath);
    return filePath;
}
// ==========================
// Convierte FECHA SQL → DD/MM/YYYY sin afectar zona horaria
function formatoFechaSQL(valor) {
    if (!valor)
        return "";
    const fecha = new Date(valor);
    // Obtener componentes UTC para no alterar la fecha
    const dia = String(fecha.getUTCDate()).padStart(2, "0");
    const mes = String(fecha.getUTCMonth() + 1).padStart(2, "0"); // Mes base 0
    const anio = fecha.getUTCFullYear();
    return `${dia}/${mes}/${anio}`;
}
// SQL STORE PROCEDURE
async function SSCA_NOTIFICACION_REPORTE_MARCACIONES_POR_FECHA_EXCEL(CodSucursal, CodProyectoNoProd, fecha) {
    const result = await db_1.default.exec([
        { name: 'CodSucursal', value: CodSucursal, type: mssql_1.default.VarChar },
        { name: 'CodProyectoNoProd', value: CodProyectoNoProd, type: mssql_1.default.VarChar },
        { name: 'Fecha', value: fecha, type: mssql_1.default.VarChar },
    ], conf_1.STORE_PROCEDURE.SSCA.SSCA_NOTIFICACION_REPORTE_MARCACIONES_POR_FECHA_EXCEL);
    return result;
}
;
