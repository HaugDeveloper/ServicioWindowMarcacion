import { Request, Response, NextFunction }  from "express";
import jwt, { JwtPayload, SignOptions }     from "jsonwebtoken";

// === Clave secreta en Base64, igual que en C# ===
const secretBase64 =
  "217ecf3235559b87e1dbf129f2d610f11a4a9dff9568a73fc8e6a13150ca88e8";
const secretKey = Buffer.from(secretBase64, "base64"); // equivalente a Convert.FromBase64String

// =============================
// Generar JWT (como en C# GenerateToken)
// =============================
export const generatedJwt = (
  additionalClaims: Record<string, string | number> = {},
  expirationMinutes: number = 60
): string => {
  const payload = {
    ...additionalClaims,
  };

  const options: SignOptions = {
    algorithm: "HS256",
    expiresIn: `${expirationMinutes}m`,
  };

  return jwt.sign(payload, secretKey, options);
};

// =============================
// Validar JWT (como ValidateToken en C#)
// =============================
export const validateToken = (token: string): JwtPayload | null => {
  console.log("TOKEN RECIBIDO:", token);
  try {
    return jwt.verify(token, secretKey, {
      algorithms: ["HS256"],
    }) as JwtPayload;
  } catch {
    return null;
  }
};

// =============================
// Obtener Token decodificado (como GetToken en C#)
// =============================
export const getToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.decode(token, { complete: true });
    return decoded?.payload as JwtPayload;
  } catch {
    return null;
  }
};

// =============================
// Middleware de validación de JWT
// =============================
export const validateJwtMiddleware = (
  req : Request,
  res : Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"]?.toString() || "";
  const token      = authHeader.replace(/^Bearer\s+/i, "");           // elimina "Bearer "

  // console.log('req en middleware: ', req);
  // console.log('token en middleware: ', token);

  if (!token) {
    return res.status(401).json({
      status  : 401,
      message : "Falta autorización",
      isStatus: false,
    });
  }

  const decoded = validateToken(token);
  if (!decoded) {
    return res.status(401).json({
      status  : 401,
      message : "Token inválido o expirado",
      isStatus: false,
    });
  }

  // Guardamos el payload en el request para usarlo en los controladores
  (req as any).decoded = decoded;
  next();
};

export const validateJwtZKTecoBioTime = (
  req : Request,
  res : Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"]?.toString() || "";
  const token      = authHeader.replace(/^Bearer\s+/i, "");           // elimina "Bearer "

  // console.log('req en middleware: ', req);
  // console.log('token en middleware: ', token);

  if (!token) {
    return res.status(401).json({
      status  : 401,
      message : "Falta autorización",
      isStatus: false,
    });
  }

  const decoded = validateToken(token);
  if (!decoded) {
    return res.status(401).json({
      status  : 401,
      message : "Token inválido o expirado",
      isStatus: false,
    });
  }

  // Guardamos el payload en el request para usarlo en los controladores
  (req as any).decoded = decoded;
  next();
};

export const validateJwtZKTecoBioTimes = (req, res, next) => {
  // Lee el header estándar Authorization
  const authHeader = req.headers["authorization"]?.toString() || "";
  // Limpia "JWT " o "Bearer " del inicio
  const token = authHeader.replace(/^JWT\s+|^Bearer\s+/i, "");

  if (!token) {
    return res.status(401).json({
      status: 401,
      message: "Falta autorización",
      isStatus: false,
    });
  }

  const decoded = validateToken(token);
  if (!decoded) {
    return res.status(401).json({
      status: 401,
      message: "Token inválido o expirado",
      isStatus: false,
    });
  }

  (req as any).decoded = decoded;
  next();
};



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