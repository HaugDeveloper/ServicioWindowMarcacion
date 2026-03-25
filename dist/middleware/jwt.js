"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateJwtZKTecoBioTimes = exports.validateJwtZKTecoBioTime = exports.validateJwtMiddleware = exports.getToken = exports.validateToken = exports.generatedJwt = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// === Clave secreta en Base64, igual que en C# ===
const secretBase64 = "217ecf3235559b87e1dbf129f2d610f11a4a9dff9568a73fc8e6a13150ca88e8";
const secretKey = Buffer.from(secretBase64, "base64"); // equivalente a Convert.FromBase64String
// =============================
// Generar JWT (como en C# GenerateToken)
// =============================
const generatedJwt = (additionalClaims = {}, expirationMinutes = 60) => {
    const payload = {
        ...additionalClaims,
    };
    const options = {
        algorithm: "HS256",
        expiresIn: `${expirationMinutes}m`,
    };
    return jsonwebtoken_1.default.sign(payload, secretKey, options);
};
exports.generatedJwt = generatedJwt;
// =============================
// Validar JWT (como ValidateToken en C#)
// =============================
const validateToken = (token) => {
    console.log("TOKEN RECIBIDO:", token);
    try {
        return jsonwebtoken_1.default.verify(token, secretKey, {
            algorithms: ["HS256"],
        });
    }
    catch {
        return null;
    }
};
exports.validateToken = validateToken;
// =============================
// Obtener Token decodificado (como GetToken en C#)
// =============================
const getToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.decode(token, { complete: true });
        return decoded === null || decoded === void 0 ? void 0 : decoded.payload;
    }
    catch {
        return null;
    }
};
exports.getToken = getToken;
// =============================
// Middleware de validación de JWT
// =============================
const validateJwtMiddleware = (req, res, next) => {
    var _a;
    const authHeader = ((_a = req.headers["authorization"]) === null || _a === void 0 ? void 0 : _a.toString()) || "";
    const token = authHeader.replace(/^Bearer\s+/i, ""); // elimina "Bearer "
    // console.log('req en middleware: ', req);
    // console.log('token en middleware: ', token);
    if (!token) {
        return res.status(401).json({
            status: 401,
            message: "Falta autorización",
            isStatus: false,
        });
    }
    const decoded = (0, exports.validateToken)(token);
    if (!decoded) {
        return res.status(401).json({
            status: 401,
            message: "Token inválido o expirado",
            isStatus: false,
        });
    }
    // Guardamos el payload en el request para usarlo en los controladores
    req.decoded = decoded;
    next();
};
exports.validateJwtMiddleware = validateJwtMiddleware;
const validateJwtZKTecoBioTime = (req, res, next) => {
    var _a;
    const authHeader = ((_a = req.headers["authorization"]) === null || _a === void 0 ? void 0 : _a.toString()) || "";
    const token = authHeader.replace(/^Bearer\s+/i, ""); // elimina "Bearer "
    // console.log('req en middleware: ', req);
    // console.log('token en middleware: ', token);
    if (!token) {
        return res.status(401).json({
            status: 401,
            message: "Falta autorización",
            isStatus: false,
        });
    }
    const decoded = (0, exports.validateToken)(token);
    if (!decoded) {
        return res.status(401).json({
            status: 401,
            message: "Token inválido o expirado",
            isStatus: false,
        });
    }
    // Guardamos el payload en el request para usarlo en los controladores
    req.decoded = decoded;
    next();
};
exports.validateJwtZKTecoBioTime = validateJwtZKTecoBioTime;
const validateJwtZKTecoBioTimes = (req, res, next) => {
    var _a;
    // Lee el header estándar Authorization
    const authHeader = ((_a = req.headers["authorization"]) === null || _a === void 0 ? void 0 : _a.toString()) || "";
    // Limpia "JWT " o "Bearer " del inicio
    const token = authHeader.replace(/^JWT\s+|^Bearer\s+/i, "");
    if (!token) {
        return res.status(401).json({
            status: 401,
            message: "Falta autorización",
            isStatus: false,
        });
    }
    const decoded = (0, exports.validateToken)(token);
    if (!decoded) {
        return res.status(401).json({
            status: 401,
            message: "Token inválido o expirado",
            isStatus: false,
        });
    }
    req.decoded = decoded;
    next();
};
exports.validateJwtZKTecoBioTimes = validateJwtZKTecoBioTimes;
// export const generatedJwt = (metadata: object) => {
//   return new Promise<string>((resolve, reject) => {
//     const auth: string = jwt.sign(metadata, process.env.KEY_SECRET_JWT || "");
//     resolve(auth);
//   });
// };
// export const validateJwt = async (
//   req : Request,
//   res : Response,
//   next: NextFunction
// ) => {
//   const token: string = req.headers["access-token"]?.toString() || "";
//   if (!token)
//     return res
//       .status(200)
//       .json({ status: false, message: "Falta autorización" });
//   await jwt.verify(
//     token,
//     process.env.KEY_SECRET_JWT || "",
//     (err: any, decoded: any) => {
//       if (err)
//         return res.status(200).json({
//           status : false,
//           message: "Se agotó el tiempo de espera",
//         });
//       req.decoded = { ...decoded };
//       next();
//     }
//   );
// };
// src/middleware/jwt.ts
// import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
// import crypto from "crypto";
// // === Clave secreta en base64, igual que en tu C# ===
// const secretBase64 = "217ecf3235559b87e1dbf129f2d610f11a4a9dff9568a73fc8e6a13150ca88e8";
// const secretKey    = Buffer.from(secretBase64, "base64");                                 // equivalente a Convert.FromBase64String
// // =============================
// // Generar JWT
// // =============================
// export const generatedJwt = (
//   additionalClaims: Record<string, string> = {},
//   expirationMinutes: number = 60
// ): string => {
//   const payload = {
//     ...additionalClaims,
//   };
//   const options: SignOptions = {
//     algorithm: "HS256",
//     expiresIn: `${expirationMinutes}m`,
//   };
//   return jwt.sign(payload, secretKey, options);
// };
// // =============================
// // Validar JWT
// // =============================
// export const validateToken = (token: string): JwtPayload | null => {
//   try {
//     return jwt.verify(token, secretKey, {
//       algorithms: ["HS256"],
//     }) as JwtPayload;
//   } catch (error) {
//     return null;
//   }
// };
// // =============================
// // Obtener Token Decodificado (sin validar expiración)
// // =============================
// export const getToken = (token: string): JwtPayload | null => {
//   try {
//     const decoded = jwt.decode(token, { complete: true });
//     return decoded?.payload as JwtPayload;
//   } catch (error) {
//     return null;
//   }
// };
