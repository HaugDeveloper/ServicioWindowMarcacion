"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sql = void 0;
const mssql_1 = __importDefault(require("mssql"));
exports.sql = mssql_1.default;
const conf_1 = require("./conf");
class DB {
    constructor() {
        this.appPool = new mssql_1.default.ConnectionPool(conf_1.config);
        this.poolConnect = this.appPool.connect();
    }
    async getConnection() {
        if (!this.appPool.connected) {
            await this.poolConnect;
        }
        return this.appPool;
    }
    /**
     * Ejecuta un Stored Procedure
     * Devuelve SOLO filas (array plano)
     */
    // async exec<T = any>(
    //   params: Param[] = [],
    //   procedureName: string,
    //   setTVP: ((sql: typeof import("mssql"), request: import("mssql").Request) => void) | null = null
    // ): Promise<T[]> {
    //   try {
    //     const pool = await this.getConnection();
    //     const request = pool.request();
    //     // params.forEach((p, idx) => {
    //     //   if (typeof p === "object" && "name" in p) {
    //     //     const { name, type, value } = p;
    //     //     request.input(name, type ?? sql.VarChar, value);
    //     //   } else if (typeof p === "object") {
    //     //     const [key, val] = Object.entries(p)[0];
    //     //     request.input(key, sql.VarChar, val);
    //     //   } else {
    //     //     request.input(`param${idx}`, p);
    //     //   }
    //     // });
    //     params.forEach((p, idx) => {
    //     let key: string;
    //     let value: any;
    //     let type: any;
    //     if (typeof p === "object" && "name" in p) {
    //       key   = p.name;
    //       value = p.value;
    //       type  = p.type;
    //     }
    //     else if (typeof p === "object") {
    //       [key, value] = Object.entries(p)[0];
    //     }
    //     else {
    //       key   = `param${idx}`;
    //       value = p;
    //     }
    //     // AUTO TYPE DETECTION
    //     if (!type) {
    //       if (typeof value === "string") {
    //         if (value.length > 4000)
    //           type = sql.NVarChar(sql.MAX);
    //         else
    //           type = sql.NVarChar(value.length);
    //       }
    //       else if (typeof value === "number")
    //         type = sql.Int;
    //       else if (value instanceof Date)
    //         type = sql.DateTime;
    //       else if (typeof value === "boolean")
    //         type = sql.Bit;
    //       else
    //         type = sql.NVarChar(sql.MAX);
    //     }
    //     request.input(key, type, value);
    //   });
    //     if (setTVP) setTVP(sql, request);
    //     const result = await request.execute<T>(procedureName);
    //     // Cast seguro
    //     const rows: T[] = Array.isArray(result.recordsets) && result.recordsets.length > 1
    //       ? (result.recordsets.flat() as unknown as T[])
    //       : (result.recordset as unknown as T[] ?? []);
    //     return rows;
    //   } catch (err: any) {
    //     console.error(`Error ejecutando SP [${procedureName}]`, err.message || err);
    //     throw err.originalError?.info || err;
    //   }
    // }
    // async exec<T = any>(
    //   params: Param[] = [],
    //   procedureName: string,
    //   setTVP: ((sql: typeof import("mssql"), request: import("mssql").Request) => void) | null = null
    // ): Promise<T[]> {
    //   try {
    //     const pool = await this.getConnection();
    //     const request = pool.request();
    //     params.forEach((p, idx) => {
    //       let key: string;
    //       let value: any;
    //       let type: any;
    //       if (typeof p === "object" && "name" in p) {
    //         key   = p.name;
    //         value = p.value;
    //         type  = p.type;
    //       }
    //       else if (typeof p === "object") {
    //         [key, value] = Object.entries(p)[0];
    //       }
    //       else {
    //         key   = `param${idx}`;
    //         value = p;
    //       }
    //       if (!type) {
    //         if (typeof value === "string") {
    //           if (value.length > 4000)
    //             type = sql.NVarChar(sql.MAX);
    //           else
    //             type = sql.NVarChar(value.length);
    //         }
    //         else if (typeof value === "number")
    //           type = sql.Int;
    //         else if (value instanceof Date)
    //           type = sql.DateTime;
    //         else if (typeof value === "boolean")
    //           type = sql.Bit;
    //         else
    //           type = sql.NVarChar(sql.MAX);
    //       }
    //       request.input(key, type, value);
    //     });
    //     if (setTVP) setTVP(sql, request);
    //     const result = await request.execute<T>(procedureName);
    //     const rows: T[] =
    //       Array.isArray(result.recordsets) && result.recordsets.length > 1
    //         ? result.recordsets.flat() as T[]
    //         : result.recordset ?? [];
    //     return rows;
    //   }
    //   catch (err: any) {
    //     console.error(`Error ejecutando SP [${procedureName}]`, err.message || err);
    //     throw err.originalError?.info || err;
    //   }
    // }
    detectSqlType(value) {
        if (value === null || value === undefined)
            return mssql_1.default.NVarChar(mssql_1.default.MAX);
        if (typeof value === "string")
            return mssql_1.default.NVarChar(mssql_1.default.MAX);
        if (typeof value === "number") {
            if (Number.isInteger(value))
                return mssql_1.default.Int;
            return mssql_1.default.Float;
        }
        if (typeof value === "boolean")
            return mssql_1.default.Bit;
        if (value instanceof Date)
            return mssql_1.default.DateTime;
        return mssql_1.default.NVarChar(mssql_1.default.MAX);
    }
    async exec(params = [], procedureName, setTVP = null) {
        var _a, _b;
        try {
            const pool = await this.getConnection();
            const request = pool.request();
            params.forEach((p, idx) => {
                var _a;
                if (typeof p === "object" && "name" in p) {
                    request.input(p.name, (_a = p.type) !== null && _a !== void 0 ? _a : this.detectSqlType(p.value), p.value);
                }
                else if (typeof p === "object") {
                    const [key, val] = Object.entries(p)[0];
                    request.input(key, this.detectSqlType(val), val);
                }
                else {
                    request.input(`param${idx}`, this.detectSqlType(p), p);
                }
            });
            if (setTVP)
                setTVP(mssql_1.default, request);
            const result = await request.execute(procedureName);
            return (_a = result.recordset) !== null && _a !== void 0 ? _a : [];
        }
        catch (err) {
            console.error(`Error ejecutando SP [${procedureName}]`, err.message || err);
            throw ((_b = err.originalError) === null || _b === void 0 ? void 0 : _b.info) || err;
        }
    }
    /**
     * Ejecuta un Stored Procedure
     * Devuelve filas + outputs
     */
    async execOutput(params = [], procedureName, setTVP = null) {
        var _a, _b;
        try {
            const pool = await this.getConnection();
            const request = pool.request();
            params.forEach((p, idx) => {
                if (typeof p === "object" && "name" in p) {
                    const { name, type, value, output } = p;
                    if (output) {
                        request.output(name, type !== null && type !== void 0 ? type : mssql_1.default.VarChar);
                    }
                    else {
                        request.input(name, type !== null && type !== void 0 ? type : mssql_1.default.VarChar, value);
                    }
                }
                else if (typeof p === "object") {
                    const [key, val] = Object.entries(p)[0];
                    request.input(key, mssql_1.default.VarChar, val);
                }
                else {
                    request.input(`param${idx}`, p);
                }
            });
            if (setTVP)
                setTVP(mssql_1.default, request);
            const result = await request.execute(procedureName);
            const rows = Array.isArray(result.recordsets) && result.recordsets.length > 1
                ? result.recordsets.flat()
                : ((_a = result.recordset) !== null && _a !== void 0 ? _a : []);
            return { rows, output: result.output };
        }
        catch (err) {
            console.error(`Error ejecutando SP [${procedureName}]`, err.message || err);
            throw ((_b = err.originalError) === null || _b === void 0 ? void 0 : _b.info) || err;
        }
    }
    /**
     * Ejecuta un query libre (SELECT, INSERT, UPDATE, DELETE)
     */
    async query(sqlQuery, params = []) {
        var _a, _b;
        try {
            const pool = await this.getConnection();
            const request = pool.request();
            params.forEach((p, idx) => {
                if (typeof p === "object" && "name" in p) {
                    const { name, type, value } = p;
                    request.input(name, type !== null && type !== void 0 ? type : mssql_1.default.VarChar, value);
                }
                else if (typeof p === "object") {
                    const [key, val] = Object.entries(p)[0];
                    request.input(key, mssql_1.default.VarChar, val);
                }
                else {
                    request.input(`param${idx}`, p);
                }
            });
            const result = await request.query(sqlQuery);
            return (_a = result.recordset) !== null && _a !== void 0 ? _a : [];
        }
        catch (err) {
            console.error(`Error ejecutando Query [${sqlQuery}]`, err.message || err);
            throw ((_b = err.originalError) === null || _b === void 0 ? void 0 : _b.info) || err;
        }
    }
}
const db = new DB();
exports.default = db;
// import sql, { ConnectionPool } from "mssql";
// import { config } from "./conf";
// class DB {
//   public appPool: ConnectionPool;
//   public poolConnect: Promise<ConnectionPool>;
//   constructor() {
//     this.appPool = new sql.ConnectionPool(config);
//     this.poolConnect = this.appPool.connect();
//   }
//   exec(
//     arrayParams: Array<any>,
//     nameProcedure: string,
//     authorization = null,
//     paramsDecode = null,
//     setTVP: any = null
//   ) {
//     return new Promise((resolve, reject) => {
//       this.poolConnect
//         .then((pool) => {
//           const request = new sql.Request(this.appPool);
//           for (var i = 0; i < arrayParams.length; i++) {
//             for (var key in arrayParams[i]) {
//               request.input(key, arrayParams[i][key]);
//             }
//           }
//           if (setTVP != null) setTVP(sql, request);
//           request.execute(nameProcedure, (err, result) => {
//             if (!err) {
//               if ((result?.recordsets.length || 0) > 1) {
//                 resolve(result?.recordsets);
//               } else {
//                 resolve(result?.recordset);
//               }
//             } else reject(err.originalError.info);
//           });
//         })
//         .catch((err) => {
//           reject(err);
//         });
//     });
//   }
// }
// const db = new DB();
// export default db;
