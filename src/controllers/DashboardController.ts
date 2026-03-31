import DB                     from "../config/db";
import { STORE_PROCEDURE }    from "../config/conf";
import sql                    from "mssql";
import { emailService }       from "../services/emailService";
import ExcelJS                from "exceljs";
import path                   from "path";
import moment                 from "moment";
import fsSync                 from "fs";
import fs                     from "fs/promises";
import { logCron }            from "../utils/cronLogger";

// import { runCronSafe }        from "../services/cronLock";
// import { sendMailWithRetry }  from "../services/sendMailWithRetry";


const CodSucursal       = process.env.CODSUCURSAL       || '001';
const CodProyectoNoProd = process.env.CODPROYECTONOPROD || '16386';

export async function sendMail() {
  let filePath: string | null = null;

  const fechaHoy = moment()
    .subtract(1, 'days')
    .format('DD-MM-YYYY');

  try {
    console.log(fechaHoy);

    await logCron(
      "sendMail",
      `Inicio envío correo | Fecha reporte: ${fechaHoy}`
    );

    const data = await GETNOTIFICACIONREPORTEMARCACIONESPORFECHA(
      CodSucursal,
      CodProyectoNoProd,
      fechaHoy
    );

    filePath = await GETNOTIFICACIONREPORTEMARCACIONESPORFECHAEXCEL(
      CodSucursal,
      CodProyectoNoProd,
      fechaHoy
    );

    const templatePath = path.join(
      __dirname,
      "../template/NOTIFICACION_REPORTE_MARCACIONES_POR_FECHA.html"
    );

    // const templatePath = path.join(
    //   __dirname,
    //   "..",
    //   process.env.NODE_ENV === "production" ? "dist" : "src",
    //   "services",
    //   "NOTIFICACION_REPORTE_MARCACIONES_POR_FECHA.html"
    // );

    await emailService.sendEmail({
      to     : [process.env.CORREO_PRUEBA],
      // to     :  [process.env.CORREO_RRRHH],
      // cc     :  parseEmails(process.env.CORREO_PRUEBA),
      bcc    : [],
      subject: `Reporte de Marcaciones de la fecha - ${data.fecha}`,
      text   : `Resumen de marcaciones para ${data.fecha}: Activos ${data.Total_Personal_Biotime}, Marcaciones ${data.Total_Marcaron}.`,
      templatePath,
      templateParams: data,
      attachments   : [
        {
          filename   : `Reporte_Marcaciones_${fechaHoy}.xlsx`,
          path       : filePath,
          contentType: 
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      ],
    });

    await logCron(
      "sendMail",
      `Correo enviado correctamente | Total marcaciones: ${data.Total_Marcaron}`
    );

    console.log("Email de reporte enviado correctamente.");
  } catch (error) {
    console.error("Error enviando el correo:", error);
    await logCron(
      "sendMail",
      `Fallo envío correo | ${error.message || error}`,
      true
    );
    // throw error;
  } finally {
    // ELIMINAR ARCHIVO TEMPORAL SIEMPRE
    if (filePath) {
      try {
        await fs.unlink(filePath);
        await logCron(
          "sendMail",
          `Archivo temporal eliminado: ${filePath}`
        );
      } catch (err: any) {
        await logCron(
          "sendMail",
          `No se pudo eliminar archivo: ${err.message}`,
          true
        );
      }
    }
  }
}

function parseEmails(envVar?: string) {
  return (envVar || "")
    .split(",")
    .map(e => e.trim())
    .filter(Boolean);
}

// ==================================================
// --- Función para obtener marcaciones por fecha ---
export async function GETNOTIFICACIONREPORTEMARCACIONESPORFECHA(CodSucursal: string, CodProyectoNoProd: string, fecha: string) {
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
export async function SSCA_NOTIFICACION_REPORTE_MARCACIONES_POR_FECHA(CodSucursal: string, CodProyectoNoProd: string, fecha: string) {
  const result: any[] = await DB.exec(
    [
      { name: 'CodSucursal', value: CodSucursal, type: sql.VarChar },
      { name: 'CodProyectoNoProd', value: CodProyectoNoProd, type: sql.VarChar },
      { name: 'Fecha', value: fecha, type: sql.VarChar },
    ],
    STORE_PROCEDURE.SSCA.SSCA_NOTIFICACION_REPORTE_MARCACIONES_POR_FECHA
  );
  return result;
};

// ==================================================
// --- Función para obtener marcaciones por fecha ---
export async function GETNOTIFICACIONREPORTEMARCACIONESPORFECHAEXCEL(CodSucursal: string, CodProyectoNoProd: string, fecha: string) {

  const data = await SSCA_NOTIFICACION_REPORTE_MARCACIONES_POR_FECHA_EXCEL(
    CodSucursal,
    CodProyectoNoProd,
    fecha
  );

  const workbook = new ExcelJS.Workbook();
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
      top   : { style: "thin" },
      left  : { style: "thin" },
      bottom: { style: "thin" },
      right : { style: "thin" },
    };
  });

  // Agregar datos
  data.forEach((row: any) => {
    const newRow = sheet.addRow({
      dni            : row.DNI,
      codobrero      : row.CODOBRERO,
      personal       : row.PERSONAL,
      fecha          : formatoFechaSQL(row.FECHA),
      ingreso        : row.Ingreso ?? "",
      salidaAlmorzar : row.SalidaAlmorzar ?? "",
      retornoAlmorzar: row.RetornoAlmorzar ?? "",
      salida         : row.Salida ?? "",
      total          : row.TOTAL_MARCACIONES,
      marco          : row.MARCO,
    });

    // Lista de columnas a centrar
    const columnasCentrar = ["fecha", "ingreso", "salidaAlmorzar", "retornoAlmorzar", "salida", "total"];

    columnasCentrar.forEach((col) => {
      const cell = newRow.getCell(col);
      cell.alignment = { horizontal: "center", vertical: "middle" };
      // Mantener bordes
      cell.border = {
        top   : { style: "thin" },
        left  : { style: "thin" },
        bottom: { style: "thin" },
        right : { style: "thin" },
      };
    });

    newRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top   : { style: "thin" },
        left  : { style: "thin" },
        bottom: { style: "thin" },
        right : { style: "thin" },
      };
    });


  });

  // const tempFolder = path.join(__dirname, "..", "..", "src", "temp");
  let tempFolder = '';

  if (process.env.NODE_ENV === 'production') {
    tempFolder = path.join(__dirname, "..", "temp");
  } else {
    tempFolder = path.join(__dirname, "..", "temp");
  }
  if (!fsSync.existsSync(tempFolder)) fsSync.mkdirSync(tempFolder, { recursive: true });

  const filePath = path.join(tempFolder, `Reporte_Marcaciones_${fecha}.xlsx`);
  await workbook.xlsx.writeFile(filePath);

  return filePath;
}

// ==========================
// Convierte FECHA SQL → DD/MM/YYYY sin afectar zona horaria
function formatoFechaSQL(valor: any): string {
  if (!valor) return "";

  const fecha = new Date(valor);

  // Obtener componentes UTC para no alterar la fecha
  const dia = String(fecha.getUTCDate()).padStart(2, "0");
  const mes = String(fecha.getUTCMonth() + 1).padStart(2, "0"); // Mes base 0
  const anio = fecha.getUTCFullYear();

  return `${dia}/${mes}/${anio}`;
}

// SQL STORE PROCEDURE
export async function SSCA_NOTIFICACION_REPORTE_MARCACIONES_POR_FECHA_EXCEL(CodSucursal: string, CodProyectoNoProd: string, fecha: string) {
  const result: any[] = await DB.exec(
    [
      { name: 'CodSucursal', value: CodSucursal, type: sql.VarChar },
      { name: 'CodProyectoNoProd', value: CodProyectoNoProd, type: sql.VarChar },
      { name: 'Fecha', value: fecha, type: sql.VarChar },
    ],
    STORE_PROCEDURE.SSCA.SSCA_NOTIFICACION_REPORTE_MARCACIONES_POR_FECHA_EXCEL
  );
  return result;
};
