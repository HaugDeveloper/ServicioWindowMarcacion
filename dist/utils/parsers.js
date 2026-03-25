"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseATTLOG = parseATTLOG;
exports.parseUSER = parseUSER;
exports.parseFP = parseFP;
exports.parseFace = parseFace;
// 🔹 Parser para ATTLOG (asistencias)
// export function parseATTLOG(line: string): Asistencia {
//   // Ejemplo línea real:
//   // "7    2025-08-21 10:21:42    0    1    0    0    0    255    0    0"
//   const parts = line.trim().split(/\s+/);
//   const PIN = parts[0] || "";
//   const fechaHora = `${parts[1]} ${parts[2]}`; // YYYY-MM-DD HH:mm:ss
//   const inOutMode = parts[3] || "0";           // Entrada/Salida
//   const verifyMode = parts[4] || "0";          // Tipo verificación
//   const workCode = parts[5] || "0";
//   const extras = parts.slice(6);               // [0,0,255,0,0]
//   return {
//     PIN,
//     FechaHora: fechaHora,
//     Estado: inOutMode,          // aquí guardamos InOutMode
//     WorkCode: workCode,
//     fechaLocal: new Date().toLocaleString("es-PE"),
//   };
// }
// utils/parsers.ts
function parseATTLOG(line) {
    // Ejemplo línea real:
    // "7    2025-08-21 10:21:42    0    1    0    0    0    255    0    0"
    const parts = line.trim().split(/\s+/);
    const PIN = parts[0] || "";
    const fechaHora = `${parts[1]} ${parts[2]}`; // YYYY-MM-DD HH:mm:ss
    const inOutMode = parts[3] || "0"; // Entrada/Salida
    const verifyMode = parts[4] || "0"; // Tipo verificación
    const workCode = parts[5] || "0";
    // Los extras reservados
    const reserved1 = parts[6] || "0";
    const reserved2 = parts[7] || "0";
    const reserved3 = parts[8] || "0";
    const reserved4 = parts[9] || "0";
    const reserved5 = parts[10] || "0";
    return {
        PIN,
        FechaHora: fechaHora,
        InOutMode: inOutMode,
        VerifyMode: verifyMode,
        WorkCode: workCode,
        Reserved1: reserved1,
        Reserved2: reserved2,
        Reserved3: reserved3,
        Reserved4: reserved4,
        Reserved5: reserved5,
        fechaLocal: new Date().toLocaleString("es-PE"),
        tipo: "ATTLOG",
        Estado: "OK",
    };
}
// 🔹 Parser para USER
function parseUSER(line) {
    // Ejemplo línea: "PIN=1234\tName=Juan Perez\tCard=000123"
    const fields = line.split("\t");
    const user = {};
    for (const field of fields) {
        const [key, value] = field.split("=");
        if (key && value !== undefined) {
            user[key.trim()] = value.trim();
        }
    }
    return user;
}
// 🔹 Parser para FP (huellas)
function parseFP(line) {
    // Ejemplo línea: "PIN=1234\tFID=0\tTMP=huellaEnBase64"
    const fields = line.split("\t");
    const huella = {};
    for (const field of fields) {
        const [key, value] = field.split("=");
        if (key && value !== undefined) {
            huella[key.trim()] = value.trim();
        }
    }
    return huella;
}
// 🔹 Parser para FACE (rostros)
function parseFace(line) {
    // Ejemplo línea: "PIN=1234\tFID=1\tTEMPLATE=rostroBase64"
    const fields = line.split("\t");
    const rostro = {};
    for (const field of fields) {
        const [key, value] = field.split("=");
        if (key && value !== undefined) {
            rostro[key.trim()] = value.trim();
        }
    }
    return rostro;
}
