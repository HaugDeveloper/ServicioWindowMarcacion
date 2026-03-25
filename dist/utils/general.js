"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay = exports.timeLog = void 0;
exports.renderTemplate = renderTemplate;
// === Time Logger ===
const timeLog = (type, label) => {
    if (type === "start") {
        console.time(label);
    }
    else if (type === "end") {
        console.timeEnd(label);
    }
    else {
        console.warn(`timeLog: tipo desconocido "${type}"`);
    }
};
exports.timeLog = timeLog;
// ===================================
// === Delay Helper ===
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
exports.delay = delay;
// =================================
function renderTemplate(html, params) {
    return html.replace(/\$\{(\w+)\}/g, (_, key) => {
        return params[key] !== undefined ? String(params[key]) : "";
    });
}
