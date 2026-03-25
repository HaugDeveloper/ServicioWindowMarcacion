"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.EmailService = void 0;
const fs_1 = __importDefault(require("fs"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const cronLogger_1 = require("../utils/cronLogger");
/* ============================================================
   Render de plantillas HTML
============================================================ */
function renderTemplate(templatePath, params = {}) {
    if (!fs_1.default.existsSync(templatePath)) {
        throw new Error(`La plantilla no existe: ${templatePath}`);
    }
    const rawHtml = fs_1.default.readFileSync(templatePath, "utf8");
    return rawHtml.replace(/\$\{(\w+)\}/g, (_, key) => params[key] !== undefined ? String(params[key]) : "");
}
/* ============================================================
   Servicio de correo SMTP
============================================================ */
class EmailService {
    constructor() {
        const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM, } = process.env;
        if (!SMTP_HOST || !SMTP_PORT) {
            throw new Error("SMTP_HOST o SMTP_PORT no definidos en .env");
        }
        this.defaultFrom =
            SMTP_FROM !== null && SMTP_FROM !== void 0 ? SMTP_FROM : '"SSCA - Reportes" <no-reply@haug.com.pe>';
        this.transporter = nodemailer_1.default.createTransport({
            host: SMTP_HOST || 'mail.haug.com.pe',
            port: Number(SMTP_PORT),
            secure: SMTP_SECURE === "true",
            family: 4, // FUERZA IPv4
            // Autenticación (si existe)
            auth: SMTP_USER && SMTP_PASS
                ? {
                    user: SMTP_USER,
                    pass: SMTP_PASS,
                }
                : undefined,
            // Pool SMTP (MUY IMPORTANTE)
            // pool: true,
            pool: false, // SOLUCIÓN CLAVE
            // maxConnections: 1,
            // maxMessages   : 10,
            maxConnections: 2,
            maxMessages: 100,
            // Timeouts para evitar cuelgues
            // connectionTimeout: 20_000,   // 20s
            // greetingTimeout  : 15_000,
            // socketTimeout    : 20_000,
            connectionTimeout: 60000,
            greetingTimeout: 60000,
            socketTimeout: 60000,
            // TLS relajado (intranet / mail interno)
            tls: {
                rejectUnauthorized: false,
            },
        }); // 👈 SOLUCIÓN
    }
    /* ============================================================
       Verificar conexión SMTP
    ============================================================ */
    async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log("Conexión SMTP exitosa");
            return true;
        }
        catch (error) {
            console.error("Error verificando SMTP:", error);
            return false;
        }
    }
    /* ============================================================
       Enviar correo con RETRY automático
    ============================================================ */
    async sendEmail(params, retries = 3) {
        var _a, _b, _c, _d;
        try {
            let htmlBody = (_a = params.text) !== null && _a !== void 0 ? _a : "";
            if (params.templatePath) {
                htmlBody = renderTemplate(params.templatePath, params.templateParams);
            }
            const mailOptions = {
                from: (_b = params.from) !== null && _b !== void 0 ? _b : this.defaultFrom,
                to: params.to,
                cc: params.cc,
                bcc: params.bcc,
                subject: (_c = params.subject) !== null && _c !== void 0 ? _c : "Sin asunto",
                text: (_d = params.text) !== null && _d !== void 0 ? _d : "Este email requiere un cliente que soporte HTML",
                html: htmlBody,
                attachments: params.attachments,
            };
            const info = await this.transporter.sendMail(mailOptions);
            console.log("Email enviado:", info.messageId, "→", params.to);
            return info;
        }
        catch (error) {
            if (retries > 0) {
                await (0, cronLogger_1.logCron)("sendMail", "Error enviando correo SMTP", true, {
                    error: error.message,
                    host: process.env.SMTP_HOST,
                    port: process.env.SMTP_PORT,
                });
                console.error("Error enviando correo SMTP:", error);
                await new Promise((r) => setTimeout(r, 5000));
                return this.sendEmail(params, retries - 1);
            }
            console.error("Error definitivo enviando email:", error);
            await (0, cronLogger_1.logCron)("sendMail", "Error definitivo enviando email", true, {
                error: error,
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
            });
            throw error;
        }
    }
}
exports.EmailService = EmailService;
/* ============================================================
   Instancia única (singleton)
============================================================ */
exports.emailService = new EmailService();
