"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../config/db"));
const general_1 = require("../utils/general");
/**
 * Clase de acceso SQL Server para ADMS
 * Soporta consultas dinámicas, inserts, updates y stored procedures
 */
class SqlAdmsGetRequest {
    constructor() {
        // private table: string;
        this.table = "[SSCA].[LOG_UNIVERSAL]";
    }
    /**
     * SELECT por ID
     */
    async getOne(id) {
        var _a;
        const query = `SELECT * FROM ${this.table} WHERE id = @id`;
        const tag = `sql getOne ${this.table} ${id}`;
        (0, general_1.timeLog)("start", tag);
        const result = await db_1.default.query(query, [{ name: "id", value: id }]);
        (0, general_1.timeLog)("end", tag);
        return (_a = result[0]) !== null && _a !== void 0 ? _a : null;
    }
    /**
     * SELECT con filtros dinámicos
     */
    async get(filters = {}) {
        const keys = Object.keys(filters);
        const where = keys.length > 0
            ? " WHERE " + keys.map((k) => `${k} = @${k}`).join(" AND ")
            : "";
        const query = `SELECT * FROM ${this.table}${where}`;
        const params = keys.map((k) => ({ name: k, value: filters[k] }));
        const tag = `sql get ${this.table}`;
        (0, general_1.timeLog)("start", tag);
        const result = await db_1.default.query(query, params);
        (0, general_1.timeLog)("end", tag);
        return result;
    }
    /**
     * INSERT dinámico
     */
    async insert(data) {
        var _a, _b;
        const keys = Object.keys(data);
        if (keys.length === 0)
            return 0;
        const fields = keys.join(",");
        const values = keys.map((k) => `@${k}`).join(",");
        const query = `
      INSERT INTO ${this.table} (${fields})
      VALUES (${values});
      SELECT SCOPE_IDENTITY() AS id;
    `;
        const params = keys.map((k) => ({ name: k, value: data[k] }));
        const tag = `sql insert ${this.table}`;
        (0, general_1.timeLog)("start", tag);
        const result = await db_1.default.query(query, params);
        (0, general_1.timeLog)("end", tag);
        return (_b = (_a = result[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : 0;
    }
    /**
     * UPDATE dinámico por ID
     */
    async update(id, data) {
        const keys = Object.keys(data);
        if (keys.length === 0)
            return 0;
        const sets = keys.map((k) => `${k} = @${k}`).join(",");
        const query = `
      UPDATE ${this.table}
      SET ${sets}
      WHERE id = @id
    `;
        const params = [...keys.map((k) => ({ name: k, value: data[k] })), { name: "id", value: id }];
        const tag = `sql update ${this.table}`;
        (0, general_1.timeLog)("start", tag);
        const result = await db_1.default.query(query, params);
        (0, general_1.timeLog)("end", tag);
        return result.length;
    }
    /**
     * DELETE por ID
     */
    async deleteById(id) {
        const query = `DELETE FROM ${this.table} WHERE id = @id`;
        const tag = `sql delete ${this.table}`;
        (0, general_1.timeLog)("start", tag);
        const result = await db_1.default.query(query, [{ name: "id", value: id }]);
        (0, general_1.timeLog)("end", tag);
        return result.length;
    }
    /**
     * EXEC: Ejecuta un stored procedure solo con input params
     */
    async exec(procName, params = []) {
        const tag = `sql exec ${procName}`;
        (0, general_1.timeLog)("start", tag);
        const result = await db_1.default.exec(params, procName);
        (0, general_1.timeLog)("end", tag);
        return result;
    }
    /**
     * EXECOUTPUT: Ejecuta un stored procedure con input + output params
     */
    async execOutput(procName, params = []) {
        const tag = `sql execOutput ${procName}`;
        (0, general_1.timeLog)("start", tag);
        const result = await db_1.default.execOutput(params, procName);
        (0, general_1.timeLog)("end", tag);
        return { rows: result.rows, output: result.output };
    }
}
exports.default = SqlAdmsGetRequest;
