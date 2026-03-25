import fs                                           from "fs";
import nodemailer, { Transporter, SendMailOptions } from "nodemailer";
import { logCron }                                  from "../utils/cronLogger";

/* ============================================================
   Render de plantillas HTML
============================================================ */
function renderTemplate(
  templatePath: string,
  params: Record<string, any> = {}
): string {
  if (!fs.existsSync(templatePath)) {
    throw new Error(`La plantilla no existe: ${templatePath}`);
  }

  const rawHtml = fs.readFileSync(templatePath, "utf8");

  return rawHtml.replace(/\$\{(\w+)\}/g, (_, key) =>
    params[key] !== undefined ? String(params[key]) : ""
  );
}

/* ============================================================
   Interfaces
============================================================ */
export interface EmailParams {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject?: string;
  from?: string;
  templatePath?: string;
  templateParams?: Record<string, any>;
  text?: string;
  attachments?: SendMailOptions["attachments"];
}

/* ============================================================
   Servicio de correo SMTP
============================================================ */
export class EmailService {
  private transporter: Transporter;
  private defaultFrom: string;

  constructor() {
    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_SECURE,
      SMTP_USER,
      SMTP_PASS,
      SMTP_FROM,
    } = process.env;

    if (!SMTP_HOST || !SMTP_PORT) {
      throw new Error("SMTP_HOST o SMTP_PORT no definidos en .env");
    }

    this.defaultFrom =
      SMTP_FROM ?? '"SSCA - Reportes" <no-reply@haug.com.pe>';

    this.transporter = nodemailer.createTransport({
      host  : SMTP_HOST || 'mail.haug.com.pe',
      port  : Number(SMTP_PORT),
      secure: SMTP_SECURE === "true",
      
      family: 4, // FUERZA IPv4

      // Autenticación (si existe)
      auth:
        SMTP_USER && SMTP_PASS
          ? {
              user: SMTP_USER,
              pass: SMTP_PASS,
            }
          : undefined,

      // Pool SMTP (MUY IMPORTANTE)
      // pool: true,
      pool          : false,   // SOLUCIÓN CLAVE
      // maxConnections: 1,
      // maxMessages   : 10,
      maxConnections: 2,
      maxMessages   : 100,

      // Timeouts para evitar cuelgues
      // connectionTimeout: 20_000,   // 20s
      // greetingTimeout  : 15_000,
      // socketTimeout    : 20_000,

      connectionTimeout: 60_000,
      greetingTimeout  : 60_000,
      socketTimeout    : 60_000,

      // TLS relajado (intranet / mail interno)
      tls: {
        rejectUnauthorized: false,
      },
    } as nodemailer.TransportOptions); // 👈 SOLUCIÓN
  }

  /* ============================================================
     Verificar conexión SMTP
  ============================================================ */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log("Conexión SMTP exitosa");
      return true;
    } catch (error) {
      console.error("Error verificando SMTP:", error);
      return false;
    }
  }

  /* ============================================================
     Enviar correo con RETRY automático
  ============================================================ */
  async sendEmail(
    params: EmailParams,
    retries: number = 3
  ): Promise<any> {
    try {
      let htmlBody = params.text ?? "";

      if (params.templatePath) {
        htmlBody = renderTemplate(
          params.templatePath,
          params.templateParams
        );
      }

      const mailOptions: SendMailOptions = {
        from: params.from ?? this.defaultFrom,
        to: params.to,
        cc: params.cc,
        bcc: params.bcc,
        subject: params.subject ?? "Sin asunto",
        text:
          params.text ??
          "Este email requiere un cliente que soporte HTML",
        html: htmlBody,
        attachments: params.attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log(
        "Email enviado:",
        info.messageId,
        "→",
        params.to
      );

      return info;
    } catch (error) {
      if (retries > 0) {
        await logCron(
          "sendMail",
          "Error enviando correo SMTP",
          true,
          {
            error: error.message,
            host : process.env.SMTP_HOST,
            port : process.env.SMTP_PORT,
          }
        );
        console.error("Error enviando correo SMTP:", error);
        await new Promise((r) => setTimeout(r, 5000));
        return this.sendEmail(params, retries - 1);
      }

      console.error("Error definitivo enviando email:", error);
      await logCron(
          "sendMail",
          "Error definitivo enviando email",
          true,
          {
            error: error,
            host : process.env.SMTP_HOST,
            port : process.env.SMTP_PORT,
          }
        );
      throw error;
    }
  }
}

/* ============================================================
   Instancia única (singleton)
============================================================ */
export const emailService = new EmailService();
