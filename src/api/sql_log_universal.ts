import db               from "../config/db";
import { timeLog }      from "../utils/general";
import { sql, Param }   from "../config/db";

/**
 * Clase de acceso SQL Server para ADMS
 * Soporta consultas dinámicas, inserts, updates y stored procedures
 */
class SqlAdmsGetRequest<T = any> {
  // private table: string;
 private table: string = "[SSCA].[LOG_UNIVERSAL]";

  /**
   * SELECT por ID
   */
  async getOne(id: number | string): Promise<T | null> {
    const query = `SELECT * FROM ${this.table} WHERE id = @id`;
    const tag = `sql getOne ${this.table} ${id}`;
    timeLog("start", tag);

    const result = await db.query<T>(query, [{ name: "id", value: id }]);

    timeLog("end", tag);
    return result[0] ?? null;
  }

  /**
   * SELECT con filtros dinámicos
   */
  async get(filters: Record<string, any> = {}): Promise<T[]> {
    const keys = Object.keys(filters);
    const where =
      keys.length > 0
        ? " WHERE " + keys.map((k) => `${k} = @${k}`).join(" AND ")
        : "";

    const query = `SELECT * FROM ${this.table}${where}`;
    const params = keys.map((k) => ({ name: k, value: filters[k] }));

    const tag = `sql get ${this.table}`;
    timeLog("start", tag);

    const result = await db.query<T>(query, params);

    timeLog("end", tag);
    return result;
  }

  /**
   * INSERT dinámico
   */
  async insert(data: Record<string, any>): Promise<number> {
    const keys = Object.keys(data);
    if (keys.length === 0) return 0;

    const fields = keys.join(",");
    const values = keys.map((k) => `@${k}`).join(",");

    const query = `
      INSERT INTO ${this.table} (${fields})
      VALUES (${values});
      SELECT SCOPE_IDENTITY() AS id;
    `;

    const params = keys.map((k) => ({ name: k, value: data[k] }));

    const tag = `sql insert ${this.table}`;
    timeLog("start", tag);

    const result = await db.query<{ id: number }>(query, params);

    timeLog("end", tag);
    return result[0]?.id ?? 0;
  }

  /**
   * UPDATE dinámico por ID
   */
  async update(id: number | string, data: Record<string, any>): Promise<number> {
    const keys = Object.keys(data);
    if (keys.length === 0) return 0;

    const sets = keys.map((k) => `${k} = @${k}`).join(",");
    const query = `
      UPDATE ${this.table}
      SET ${sets}
      WHERE id = @id
    `;

    const params = [...keys.map((k) => ({ name: k, value: data[k] })), { name: "id", value: id }];

    const tag = `sql update ${this.table}`;
    timeLog("start", tag);

    const result = await db.query<any>(query, params);

    timeLog("end", tag);
    return result.length;
  }

  /**
   * DELETE por ID
   */
  async deleteById(id: number | string): Promise<number> {
    const query = `DELETE FROM ${this.table} WHERE id = @id`;

    const tag = `sql delete ${this.table}`;
    timeLog("start", tag);

    const result = await db.query<any>(query, [{ name: "id", value: id }]);

    timeLog("end", tag);
    return result.length;
  }

  /**
   * EXEC: Ejecuta un stored procedure solo con input params
   */
  async exec(procName: string, params: Param[] = []): Promise<T[]> {
    const tag = `sql exec ${procName}`;
    timeLog("start", tag);

    const result = await db.exec<T>(params, procName);

    timeLog("end", tag);
    return result;
  }

  /**
   * EXECOUTPUT: Ejecuta un stored procedure con input + output params
   */
  async execOutput(
    procName: string,
    params: Param[] = []
  ): Promise<{ rows: T[]; output: Record<string, any> }> {
    const tag = `sql execOutput ${procName}`;
    timeLog("start", tag);

    const result = await db.execOutput<T>(params, procName);

    timeLog("end", tag);

    return { rows: result.rows, output: result.output };
  }
}

export default SqlAdmsGetRequest;
