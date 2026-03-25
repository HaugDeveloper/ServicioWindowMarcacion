import sql, { ConnectionPool } from "mssql";
import { config } from "./conf";



export type Param =
  | { name: string; type?: any; value?: any; output?: boolean } // formato largo
  | Record<string, any>; // formato corto {CAMPO: valor}

class DB {
  private appPool: ConnectionPool;
  private poolConnect: Promise<ConnectionPool>;

  constructor() {
    this.appPool = new sql.ConnectionPool(config);
    this.poolConnect = this.appPool.connect();
  }

  private async getConnection() {
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

  private detectSqlType(value: any) {

    if (value === null || value === undefined)
      return sql.NVarChar(sql.MAX);

    if (typeof value === "string")
      return sql.NVarChar(sql.MAX);

    if (typeof value === "number") {

      if (Number.isInteger(value))
        return sql.Int;

      return sql.Float;
    }

    if (typeof value === "boolean")
      return sql.Bit;

    if (value instanceof Date)
      return sql.DateTime;

    return sql.NVarChar(sql.MAX);

  }

  async exec<T = any>(
    params: Param[] = [],
    procedureName: string,
    setTVP: ((sql: typeof import("mssql"), request: import("mssql").Request) => void) | null = null
  ): Promise<T[]> {

    try {

      const pool = await this.getConnection();
      const request = pool.request();

      params.forEach((p, idx) => {

        if (typeof p === "object" && "name" in p) {

          request.input(
            p.name,
            p.type ?? this.detectSqlType(p.value),
            p.value
          );

        }
        else if (typeof p === "object") {

          const [key, val] = Object.entries(p)[0];

          request.input(
            key,
            this.detectSqlType(val),
            val
          );

        }
        else {

          request.input(
            `param${idx}`,
            this.detectSqlType(p),
            p
          );

        }

      });

      if (setTVP) setTVP(sql, request);

      const result = await request.execute<T>(procedureName);

      return result.recordset ?? [];

    }
    catch (err: any) {

      console.error(`Error ejecutando SP [${procedureName}]`, err.message || err);
      throw err.originalError?.info || err;

    }

  }



  /**
   * Ejecuta un Stored Procedure
   * Devuelve filas + outputs
   */
  async execOutput<T = any>(
    params: Param[] = [],
    procedureName: string,
    setTVP: ((sql: typeof import("mssql"), request: import("mssql").Request) => void) | null = null
  ): Promise<{ rows: T[]; output: Record<string, any> }> {
    try {
      const pool = await this.getConnection();
      const request = pool.request();

      params.forEach((p, idx) => {
        if (typeof p === "object" && "name" in p) {
          const { name, type, value, output } = p;
          if (output) {
            request.output(name, type ?? sql.VarChar);
          } else {
            request.input(name, type ?? sql.VarChar, value);
          }
        } else if (typeof p === "object") {
          const [key, val] = Object.entries(p)[0];
          request.input(key, sql.VarChar, val);
        } else {
          request.input(`param${idx}`, p);
        }
      });

      if (setTVP) setTVP(sql, request);

      const result = await request.execute<T>(procedureName);

      const rows: T[] = Array.isArray(result.recordsets) && result.recordsets.length > 1
        ? (result.recordsets.flat() as unknown as T[])
        : (result.recordset as unknown as T[] ?? []);

      return { rows, output: result.output };

    } catch (err: any) {
      console.error(`Error ejecutando SP [${procedureName}]`, err.message || err);
      throw err.originalError?.info || err;
    }
  }

  /**
   * Ejecuta un query libre (SELECT, INSERT, UPDATE, DELETE)
   */
  async query<T = any>(sqlQuery: string, params: Param[] = []): Promise<T[]> {
    try {
      const pool = await this.getConnection();
      const request = pool.request();

      params.forEach((p, idx) => {
        if (typeof p === "object" && "name" in p) {
          const { name, type, value } = p;
          request.input(name, type ?? sql.VarChar, value);
        } else if (typeof p === "object") {
          const [key, val] = Object.entries(p)[0];
          request.input(key, sql.VarChar, val);
        } else {
          request.input(`param${idx}`, p);
        }
      });

      const result = await request.query<T>(sqlQuery);
      return result.recordset ?? [];
    } catch (err: any) {
      console.error(`Error ejecutando Query [${sqlQuery}]`, err.message || err);
      throw err.originalError?.info || err;
    }
  }
}

const db = new DB();
export default db;
export { sql };


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