"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../api/index");
const db_1 = __importDefault(require("../config/db"));
const conf_1 = require("../config/conf");
const error_1 = require("../config/error");
const zktecoApi = new index_1.zkteco.zkteco_auth_biotime.ZKTeco_Auth_BioTime();
class ZKTecoDeviceBioTimeController {
    constructor() {
        // ============================
        // TERMINAL
        // ============================
        this.SincronizarTransactions = async (req, res) => {
            const response = {
                status: false,
                code: 400,
                message: "",
            };
            try {
                // 1. Traer gerencias desde SQLol
                const gerencias = await this.handlerGetGerenciaSQL();
                const sqlDepts = gerencias.map(g => ({
                    id: g.ID_GERENCIA,
                    dept_code: g.ID_GERENCIA.toString(),
                    dept_name: g.DESCRIPCION,
                    parent_dept: null,
                }));
                // 2. Traer TODOS los departamentos actuales desde ZK
                const zktecoDepts = await this.handlerGetDepartamets();
                const zkDepts = (zktecoDepts === null || zktecoDepts === void 0 ? void 0 : zktecoDepts.data) || [];
                // 3. Eliminar TODOS en ZK
                await this.deleteAllZkDepartments(zkDepts);
                // 4. Crear TODOS desde SQL
                for (const dept of sqlDepts) {
                    await this.handlerSaveDepartament(dept);
                    console.log(`Creado en ZK: ${dept.dept_code} - ${dept.dept_name}`);
                }
                response.status = true;
                response.code = 200;
                response.message = "Departamentos reiniciados correctamente";
                response.metadata = {
                    eliminados: zkDepts.length,
                    creados: sqlDepts.length,
                };
                return res.status(200).json(response);
            }
            catch (error) {
                console.error("Error en SincronizarDepartaments:", error);
                response.code = 500;
                response.message = error.message || "Error interno al sincronizar";
                return res.status(500).json(response);
            }
        };
        this.handlerGetDepartamets = async () => {
            const staticToken = await zktecoApi.getStaticToken();
            return zktecoApi.request({
                path: "/personnel/api/departments/",
                method: "GET",
                token: staticToken,
            });
        };
        this.deleteAllZkDepartments = async (zkDepts) => {
            var _a;
            // Ordenar de mayor a menor ID -> elimina primero hijos
            const ordered = [...zkDepts].sort((a, b) => b.id - a.id);
            for (const dept of ordered) {
                try {
                    await this.handlerDeleteDepartamentsById(dept.id);
                    console.log(`Eliminado en ZK: ${dept.dept_code} - ${dept.dept_name}`);
                }
                catch (e) {
                    console.warn(`Error eliminando ${dept.dept_code}:`, ((_a = e.response) === null || _a === void 0 ? void 0 : _a.data) || e);
                }
            }
        };
        this.handlerDeleteDepartamentsById = async (id) => {
            const staticToken = await zktecoApi.getStaticToken();
            return zktecoApi.request({
                path: `/personnel/api/departments/${id}/`,
                method: "DELETE",
                token: staticToken,
            });
        };
        this.handlerGetGerenciaSQL = async () => {
            const result = await db_1.default.exec([], conf_1.STORE_PROCEDURE.SSCA.SSCA_SP_GERENCIA_LIST);
            return result; // [{ ID_GERENCIA, DESCRIPCION }]
        };
        this.handlerSaveDepartament = async (dept) => {
            const staticToken = await zktecoApi.getStaticToken();
            return zktecoApi.request({
                path: "/personnel/api/departments/",
                method: "POST",
                body: {
                    dept_code: dept.dept_code,
                    dept_name: dept.dept_name,
                    parent_dept: dept.parent_dept,
                },
                token: staticToken,
            });
        };
        // ============================
        // ATTENDANCE REPORT API
        // ============================
    }
    // ============================
    // TRANSACTION
    // ============================
    async GetTransactions(req, res) {
        const response = {
            status: false,
            code: 400,
            message: "",
        };
        try {
            const staticToken = await zktecoApi.getStaticToken();
            if (!staticToken) {
                response.code = 401;
                response.message = "No se pudo obtener token estático";
                return res.status(401).json(response);
            }
            // Capturar query params del cliente (ej: ?page=1&page_size=10)
            const query = req.query;
            // console.log(query)
            const data = await zktecoApi.request({
                path: "/iclock/api/transactions/",
                method: "GET",
                token: staticToken,
                params: query, // enviar los parámetros dinámicamente
            });
            if (!data) {
                response.code = 500;
                response.message = "Error obteniendo transactions del dispositivo biométrico.";
                return res.status(200).json(response);
            }
            response.metadata = data;
            response.code = 200;
            response.status = true;
            response.message = "transactions obtenidos correctamente";
            return res.status(200).json(response);
        }
        catch (error) {
            console.error("Error en GetEmployees:", error);
            response.code = 500;
            response.status = false;
            response.message = error.message || "Error interno en GetTransactions";
            return res.status(200).json((0, error_1.error_message)(error));
        }
    }
}
const zKTecoDeviceBioTimeController = new ZKTecoDeviceBioTimeController();
exports.default = zKTecoDeviceBioTimeController;
