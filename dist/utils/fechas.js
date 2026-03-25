"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fechaLocal = fechaLocal;
exports.horaLocalLima = horaLocalLima;
exports.fechaPeru = fechaPeru;
// Retorna fecha local en formato string (Lima)
function fechaLocal() {
    return new Date().toLocaleString("es-PE", {
        timeZone: "America/Lima",
        hour12: false,
    });
}
// Retorna hora local en Lima (HH:mm:ss)
function horaLocalLima() {
    return new Date().toLocaleTimeString("es-PE", {
        timeZone: "America/Lima",
        hour12: false,
    });
}
function fechaPeru() {
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, "0");
    const dia = String(ahora.getDate()).padStart(2, "0");
    return `${año}-${mes}-${dia}`;
}
