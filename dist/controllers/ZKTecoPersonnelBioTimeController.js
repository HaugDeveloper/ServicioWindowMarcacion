"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../api/index");
const db_1 = __importDefault(require("../config/db"));
const conf_1 = require("../config/conf");
const error_1 = require("../config/error");
const mssql_1 = __importDefault(require("mssql"));
const logger_1 = __importDefault(require("../utils/logger"));
const zktecoApi = new index_1.zkteco.zkteco_auth_biotime.ZKTeco_Auth_BioTime();
class ZKTecoPersonnelBioTimeController {
    constructor() {
        this.SincronizarAreas = async (req, res) => {
            const response = {
                status: false,
                code: 400,
                message: "",
            };
            try {
                console.log("Iniciando sincronización de Áreas...");
                // 1 Traer centro_costo desde SQL
                const centro_costo = await this.handlerGetCentroCostoSQL();
                const sqlDepts = centro_costo.map(g => ({
                    id: g.ID_CENTRO_COSTO,
                    area_code: g.ID_CENTRO_COSTO.toString(),
                    area_name: this.sanitizeAreaName(g.COLOQUIAL || g.DESCRIPCION),
                    parent_area: null,
                }));
                console.log(`Áreas SQL obtenidas: ${sqlDepts.length}`);
                // 2 Traer áreas actuales desde ZK
                const zktecoAreas = await this.handlerGetAreas();
                console.log(`Áreas ZKTexo obtenidas: ${zktecoAreas.data.length}`);
                // for (const area of zktecoAreas.data) {
                //   if (area.area_code === "1") {
                //     console.log("Área base (1) preservada");
                //     continue;
                //   }
                // }
                // Normaliza datos
                const sqlAreas = sqlDepts.map(a => ({
                    area_code: a.area_code.toString().trim(),
                    area_name: a.area_name.trim(),
                    parent_area: a.parent_area,
                }));
                // No excluyas el área 1, solo márcala como reservada
                const zkAreas = zktecoAreas.data.map(a => ({
                    id: a.id,
                    area_code: a.area_code.toString().trim(),
                    area_name: a.area_name.trim(),
                    parent_area: a.parent_area,
                    is_default: a.area_code === "1" ? 1 : 0, // marcar como reservada
                }));
                // Sets para comparación
                const sqlCodes = new Set(sqlAreas.map(a => a.area_code));
                const zkCodes = new Set(zkAreas.map(a => a.area_code));
                // Faltan en ZKTeco
                const faltanEnZK = sqlAreas.filter(a => !zkCodes.has(a.area_code));
                // Sobran en ZKTeco (pero excluye el área 1)
                const sobranEnZK = zkAreas.filter(a => !sqlCodes.has(a.area_code) && a.area_code !== "1");
                // Coinciden
                const coinciden = sqlAreas.filter(a => zkCodes.has(a.area_code));
                console.log('Coinciden:', coinciden.length);
                console.log('Faltan en ZKTeco:', faltanEnZK.length);
                console.log('Sobran (no reservadas):', sobranEnZK.length);
                // Crear las faltantes en ZKTeco
                const creadas = [];
                for (const area of faltanEnZK) {
                    try {
                        const res = await this.handlerSaveArea(area);
                        console.log('🆕 Creada en ZKTeco:', res);
                        creadas.push({
                            ...area,
                            is_default: 0,
                            payload: JSON.stringify(res)
                        });
                    }
                    catch (err) {
                        console.error('Error al crear área:', area.area_code, err.message);
                    }
                }
                // Actualizar las que coinciden (por nombre)
                const actualizadas = [];
                for (const area of coinciden) {
                    const zkArea = zkAreas.find(z => z.area_code === area.area_code);
                    if (zkArea && zkArea.area_name !== area.area_name) {
                        try {
                            const res = await this.handlerUpdateArea(zkArea.id, area);
                            console.log('Actualizada en ZKTeco:', res);
                            actualizadas.push({
                                ...area,
                                is_default: 0,
                                payload: JSON.stringify(res)
                            });
                        }
                        catch (err) {
                            console.error('Error al actualizar área:', area.area_code, err.message);
                        }
                    }
                }
                // Consolidar resultados (creadas + actualizadas)
                const areasProcesadas = [...creadas, ...actualizadas];
                console.log('Total áreas procesadas:', areasProcesadas.length);
                // Guardar en SQL mediante SP JSON
                // if (areasProcesadas.length > 0) {
                //   const result = await this.handlerBiotimeAreaUpsertPersonalSQL(areasProcesadas);
                //   console.log('Guardadas en SQL:', result);
                // } else {
                //   console.log('No hay cambios que guardar.');
                // }
                // Siempre sincroniza todo a BIOTIME_AREA, no solo los modificados
                // Siempre sincroniza todo a BIOTIME_AREA, incluyendo la base (1)
                const todasLasAreas = zkAreas.map(a => ({
                    id_biotime: a.id, // este es el ID del ZKTeco
                    area_code: a.area_code,
                    area_name: a.area_name,
                    parent_area: a.parent_area,
                    is_default: a.is_default,
                    payload: JSON.stringify(a),
                }));
                // Guardar en SQL mediante SP JSON
                const result = await this.handlerBiotimeAreaUpsertPersonalSQL(todasLasAreas);
                console.log(`Sincronizadas en SQL: ${(result === null || result === void 0 ? void 0 : result.length) || 0} áreas`);
                console.log('Primeros códigos de áreas que van al SP:', todasLasAreas.map(a => a.area_code).slice(0, 10));
                console.log('¿Incluye el área 1?', todasLasAreas.some(a => a.area_code === "1"));
                // Construir respuesta final
                const response = {
                    status: true,
                    code: 200,
                    message: "Sincronización completada correctamente",
                    metadata: {
                        total_sql: sqlDepts.length,
                        total_zkteco: zkAreas.length,
                        coinciden: coinciden.length,
                        creadas: creadas.length,
                        actualizadas: actualizadas.length,
                        faltan_en_zkteco: faltanEnZK.length,
                        sobran_en_zkteco: sobranEnZK.length,
                        preservada: "Área base (area_code = 1)",
                        detalles: {
                            creadas,
                            actualizadas,
                            sobranEnZK,
                        },
                    },
                };
                // Log final de resumen
                console.log("Sincronización completada correctamente:");
                console.log(JSON.stringify(response.metadata, null, 2));
                // Responder al cliente
                return res.status(200).json(response);
            }
            catch (error) {
                console.error("Error en SincronizarAreas:", error);
                response.code = 500;
                response.message = error.message || "Error interno al sincronizar";
                return res.status(500).json(response);
            }
        };
        this.handlerGetAreas = async () => {
            const staticToken = await zktecoApi.getStaticToken();
            return zktecoApi.request({
                path: "/personnel/api/areas/?page_size=1000",
                method: "GET",
                token: staticToken,
            });
        };
        this.handlerGetCentroCostoSQL = async () => {
            const result = await db_1.default.exec([], conf_1.STORE_PROCEDURE.SSCA.SSCA_SP_CENTRO_COSTO_LIST);
            return result; // [{ ID_CENTRO_COSTO, DESCRIPCION, COLOQUIAL }]
        };
        this.handlerSaveArea = async (area) => {
            const staticToken = await zktecoApi.getStaticToken();
            return zktecoApi.request({
                path: "/personnel/api/areas/",
                method: "POST",
                body: {
                    area_code: area.area_code,
                    area_name: area.area_name,
                    parent_area: area.parent_area,
                },
                token: staticToken,
            });
        };
        this.handlerUpdateArea = async (id, area) => {
            const staticToken = await zktecoApi.getStaticToken();
            return zktecoApi.request({
                path: "/personnel/api/areas/" + id + "/",
                method: "PUT",
                body: {
                    area_code: area.area_code,
                    area_name: area.area_name,
                    parent_area: area.parent_area,
                },
                token: staticToken,
            });
        };
        this.handlerBiotimeAreaUpsertPersonalSQL = async (areas) => {
            if (!areas || areas.length === 0)
                return [];
            const jsonData = JSON.stringify(areas);
            const result = await db_1.default.exec([
                {
                    json: jsonData
                }
            ], conf_1.STORE_PROCEDURE.SSCA.SSCA_SP_BIOTIME_AREA_INSERT_JSON);
            return result;
        };
        this.SincronizarDepartaments = async (req, res) => {
            const response = {
                status: false,
                code: 400,
                message: "",
            };
            try {
                // 1. Traer gerencias desde SQL
                const gerencias = await this.handlerGetGerenciaSQL();
                const sqlDepts = gerencias.map(g => ({
                    id: g.ID_GERENCIA,
                    dept_code: g.ID_GERENCIA.toString(),
                    dept_name: this.sanitizeDepartamentName(g.DESCRIPCION),
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
        // ================================================================
        // BIOTIME 8.0.8
        // ================================================================
        this.SincronizarEmployees = async (req, res) => {
            // handlerEmployeeGetPersonalSQL
            var CodSucursal = req.body.CodSucursal || '001'; // Haug S. A.
            var CodProyectoNoProd = req.body.CodProyectoNoProd || '16386';
            var IdTareador = req.body.IdTareador || ''; // '00000173'
            var CodigoTrabajador = req.body.CodigoTrabajador || '';
            var usuario = req.body.usuario || 'administrador';
            // '001', '02872' o '16386'
            const response = {
                status: false,
                code: 400,
                message: "",
            };
            try {
                // 1. Traer employees desde SQL
                const employeesS10 = await this.handlerEmployeeGetPersonalS10SQL(CodSucursal, CodProyectoNoProd, IdTareador, CodigoTrabajador);
                console.log(`Empleados SQL obtenidos: ${employeesS10.length}`);
                // Si no hay empleados del S10, detenemos
                if (!employeesS10.length) {
                    response.code = 404;
                    response.message = "No hay empleados en SQL para sincronizar";
                    return res.status(404).json(response);
                }
                // Siempre guarda si hay empleados S10
                try {
                    const employeesPostBiotime = await this.handlerEmployeePostPersonalSQL(employeesS10, usuario);
                    console.log(`Empleados guardados/actualizados en BIOTIME_PERSONAL: ${employeesPostBiotime.length}`);
                }
                catch (err) {
                    console.error("Error al guardar empleados en BIOTIME_PERSONAL:", err);
                    // no detenemos la ejecución, solo registramos el error
                }
                // Luego continúa con la siguiente parte
                const employeesBiotime = await this.handlerEmployeeGetPersonalBiotimeSQL(CodSucursal, CodProyectoNoProd, IdTareador, CodigoTrabajador);
                console.log(`Empleados Biotime SQL obtenidos: ${employeesBiotime.length}`);
                if (!employeesBiotime.length) {
                    response.code = 404;
                    response.message = "No hay empleados en biotime personal SQL";
                    return res.status(404).json(response);
                }
                const allDepartments = await this.handlerGetAllDepartmentsBiotime();
                console.log("allDepartments:", allDepartments);
                const allAreas = await this.handlerGetAllAreasBiotime();
                console.log("allAreas:", allAreas);
                // return
                const sqlEmployees = await Promise.all(employeesBiotime.map(async (g) => {
                    var _a, _b, _c, _d, _e;
                    const deptCode = String(126);
                    const areaCode = String(g.ID_CENTRO_COSTO);
                    // --------------------------------------------------------------------
                    // 1) Buscar ÁREAS según company_code (CodSucursal)
                    // --------------------------------------------------------------------
                    const areasBySucursal = allAreas.filter(a => a.company.company_code === CodSucursal);
                    // Primer intento → área con ese ID_CENTRO_COSTO dentro de la sucursal
                    let areaMatches = areasBySucursal.filter(a => a.area_code === areaCode);
                    // Segundo intento → cualquier área de esa sucursal
                    let areaSelected = areaMatches[areaMatches.length - 1] ||
                        areasBySucursal[areasBySucursal.length - 1];
                    // Último intento → fallback absoluta company.id = 1
                    if (!areaSelected) {
                        areaSelected = allAreas.find(a => a.company.id === 1);
                    }
                    // --------------------------------------------------------------------
                    // 2) Buscar DEPARTAMENTOS según company_code (CodSucursal)
                    // --------------------------------------------------------------------
                    const departmentsBySucursal = allDepartments.filter(d => d.company.company_code === CodSucursal);
                    // Primer intento → dept_code dentro de la sucursal
                    let deptMatches = departmentsBySucursal.filter(d => d.dept_code === deptCode);
                    // Segundo intento → cualquier dept de la misma sucursal
                    let deptSelected = deptMatches[deptMatches.length - 1] ||
                        departmentsBySucursal[departmentsBySucursal.length - 1];
                    // Último intento → fallback absoluta company.id = 1
                    if (!deptSelected) {
                        deptSelected = allDepartments.find(d => d.company.id === 1);
                    }
                    // --------------------------------------------------------------------
                    // 3) IDs finales
                    // --------------------------------------------------------------------
                    const areaId = (_a = areaSelected === null || areaSelected === void 0 ? void 0 : areaSelected.id) !== null && _a !== void 0 ? _a : 1;
                    const deptId = (_b = deptSelected === null || deptSelected === void 0 ? void 0 : deptSelected.id) !== null && _b !== void 0 ? _b : 1;
                    const companyId = (_d = (_c = areaSelected === null || areaSelected === void 0 ? void 0 : areaSelected.company) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : 1;
                    // console.log("companyId:", companyId);
                    // console.log("deptId:", deptId);
                    // console.log("areaId:", areaId);
                    // return
                    let first_name = '';
                    let last_name = '';
                    if ((_e = g.nombre) === null || _e === void 0 ? void 0 : _e.includes(',')) {
                        // Caso con coma → "APELLIDOS, NOMBRES"
                        const [apellidos, nombres] = g.nombre.split(',').map(s => s.trim());
                        first_name = nombres;
                        last_name = apellidos;
                    }
                    else {
                        // Caso sin coma → "APELLIDO1 APELLIDO2 NOMBRES..."
                        const parts = g.nombre.trim().split(/\s+/);
                        if (parts.length >= 3) {
                            last_name = parts.slice(0, 2).join(' ');
                            first_name = parts.slice(2).join(' ');
                        }
                        else {
                            // Por si acaso solo hay uno o dos
                            last_name = parts[0] || '';
                            first_name = parts[1] || '';
                        }
                    }
                    return {
                        id: g.id_biotime || null,
                        emp_code: g.dni.toString(),
                        company: companyId,
                        department: deptId,
                        area: [areaId],
                        first_name: first_name.substring(0, 20),
                        last_name: last_name.substring(0, 20)
                    };
                }));
                // 3. Traer todos los empleados desde ZKTeco
                const employeesZK = await this.handlerGetAllEmployeesZKTeco();
                // console.log(`Empleados ZKTeco obtenidos: ${employeesZK.length}`);
                // console.log(`Empleados ZKTeco obtenidos: ${employeesZK}`);
                // return
                // Convertimos los códigos existentes a un Set para búsqueda rápida
                const existingCodes = new Set(employeesZK.map(e => { var _a; return (_a = e.emp_code) === null || _a === void 0 ? void 0 : _a.trim(); }));
                // console.log('existingCodes:>>> ', existingCodes)
                // 4. Crear o actualizar según corresponda
                for (const employee of sqlEmployees) {
                    if (existingCodes.has(employee.emp_code.trim())) {
                        // console.log('employee.emp_code', employee.emp_code)
                        // Buscar el ID real del empleado ZKTeco para actualizar
                        const existing = employeesZK.find(e => e.emp_code.trim() === employee.emp_code.trim());
                        employee.id = existing === null || existing === void 0 ? void 0 : existing.id;
                        // console.log('employee.id', employee.id)
                        console.log(`Actualizando ${employee.emp_code} (ID ${employee.id})`);
                    }
                    else {
                        employee.id = 0;
                        console.log(`Creando ${employee.emp_code} (nuevo en ZKTeco)`);
                    }
                    await this.handlerSaveEmployee(employee, usuario);
                }
                response.status = true;
                response.code = 200;
                response.message = "Empleados reiniciados correctamente";
                response.metadata = {};
                return res.status(200).json(response);
            }
            catch (error) {
                console.error("Error en SincronizarEmployees:", error);
                response.code = 500;
                response.message = error.message || "Error interno al sincronizar";
                return res.status(500).json(response);
            }
        };
        // HANDLERS
        this.handlerEmployeeGetPersonalS10SQL = async (CodSucursal, CodProyectoNoProd, IdTareador, CodigoTrabajador) => {
            // console.log('Parametros SQL:', { CodSucursal, CodProyectoNoProd, IdTareador, CodigoTrabajador });
            const result = await db_1.default.exec([
                { name: 'CodSucursal', value: CodSucursal, type: mssql_1.default.VarChar },
                { name: 'CodProyectoNoProd', value: CodProyectoNoProd, type: mssql_1.default.VarChar },
                { name: 'IdTareador', value: IdTareador, type: mssql_1.default.VarChar },
                { name: 'CodigoTrabajador', value: CodigoTrabajador, type: mssql_1.default.VarChar },
            ], conf_1.STORE_PROCEDURE.SSCA.SSCA_SP_PERSONAL_S10_LIST);
            return result;
        };
        this.handlerEmployeePostPersonalSQL = async (employees, usuario) => {
            if (!employees || employees.length === 0)
                return [];
            const jsonData = JSON.stringify(employees);
            const result = await db_1.default.exec([
                { name: 'json', value: jsonData, type: mssql_1.default.NVarChar },
                { name: 'usuario', value: usuario !== null && usuario !== void 0 ? usuario : 'administrador', type: mssql_1.default.NVarChar },
            ], conf_1.STORE_PROCEDURE.SSCA.SSCA_SP_BIOTIME_PERSONAL_JSON_SYNC);
            return result;
        };
        this.handlerEmployeeGetPersonalBiotimeSQL = async (CodSucursal, CodProyectoNoProd, IdTareador, CodigoTrabajador) => {
            // console.log('Parametros SQL:', { CodSucursal, CodProyectoNoProd, IdTareador, CodigoTrabajador });
            const result = await db_1.default.exec([
                { name: 'CodSucursal', value: CodSucursal, type: mssql_1.default.VarChar },
                { name: 'CodProyectoNoProd', value: CodProyectoNoProd, type: mssql_1.default.VarChar },
                { name: 'IdTareador', value: IdTareador, type: mssql_1.default.VarChar },
                { name: 'CodigoTrabajador', value: CodigoTrabajador, type: mssql_1.default.VarChar },
            ], conf_1.STORE_PROCEDURE.SSCA.SSCA_SP_BIOTIME_PERSONAL_LIST);
            return result;
        };
        this.handlerGetAllDepartmentsBiotime = async () => {
            try {
                const token = await zktecoApi.getStaticToken();
                const resp = await zktecoApi.request({
                    path: "/personnel/api/departments/",
                    method: "GET",
                    token
                });
                return (resp === null || resp === void 0 ? void 0 : resp.data) || [];
            }
            catch (err) {
                console.error("Error al obtener departamentos:", err);
                return [];
            }
        };
        this.handlerGetAllAreasBiotime = async () => {
            try {
                const token = await zktecoApi.getStaticToken();
                const resp = await zktecoApi.request({
                    path: "/personnel/api/areas/",
                    method: "GET",
                    token
                });
                return (resp === null || resp === void 0 ? void 0 : resp.data) || [];
            }
            catch (err) {
                console.error("Error al obtener áreas:", err);
                return [];
            }
        };
        this.handlerGetAllEmployeesZKTeco = async () => {
            var _a;
            const staticToken = await zktecoApi.getStaticToken();
            let allEmployees = [];
            let page = 1;
            let hasNext = true;
            while (hasNext) {
                const data = await zktecoApi.request({
                    path: "/personnel/api/employees/",
                    method: "GET",
                    token: staticToken,
                    params: { page, page_size: 1000 },
                });
                if ((_a = data === null || data === void 0 ? void 0 : data.data) === null || _a === void 0 ? void 0 : _a.length) {
                    allEmployees = allEmployees.concat(data.data);
                }
                hasNext = !!data.next;
                page++;
            }
            return allEmployees;
        };
        this.handlerSaveEmployee = async (emp, usuario) => {
            var _a, _b, _c, _d;
            const staticToken = await zktecoApi.getStaticToken();
            const empCode = (emp.emp_code || "").toString().trim();
            // console.log('Sincronizando empleado:', emp);
            // return
            // Normalizar datos antes de enviar
            const body = {
                emp_code: (emp.emp_code || "").toString().trim(),
                company: emp.company,
                department: emp.department,
                area: emp.area && Array.isArray(emp.area) ? emp.area : [],
                first_name: (emp.first_name || "N/A").substring(0, 25).trim(),
                last_name: (emp.last_name || "N/A").substring(0, 25).trim(),
                app_status: 0,
            };
            // console.log('Preparando empleado para ZKTeco:', body);
            // Validaciones extra
            if (!body.emp_code) {
                throw new Error("emp_code vacío -> no se puede enviar al Dispositivo ZKTeco");
            }
            if (!body.department) {
                throw new Error(`Empleado ${body.emp_code} no tiene department válido`);
            }
            // console.log('emp.id:', emp.id);
            // console.log('body:', body);
            // return
            let zkResponse = null;
            try {
                logger_1.default.writeLog(`Iniciando sincronización de empleado ${empCode} por ${usuario}`);
                if (!emp.id || emp.id === 0) {
                    zkResponse = await zktecoApi.request({
                        path: "/personnel/api/employees/",
                        method: "POST",
                        token: staticToken,
                        body
                    });
                    console.log(`Creado en ZKTeco: ${emp.emp_code} -> ID ${(zkResponse === null || zkResponse === void 0 ? void 0 : zkResponse.id) || 0}`);
                    logger_1.default.writeLog(`Creado en ZKTeco: ${empCode} -> ID ${(zkResponse === null || zkResponse === void 0 ? void 0 : zkResponse.id) || 0}`);
                }
                else {
                    try {
                        zkResponse = await zktecoApi.request({
                            path: `/personnel/api/employees/${emp.id}/`,
                            method: "PUT",
                            body,
                            token: staticToken,
                        });
                        console.log(`Actualizado en ZKTeco: ${emp.emp_code} -> ID ${(_a = emp.id) !== null && _a !== void 0 ? _a : "SIN-ID"}`);
                        logger_1.default.writeLog(`Actualizado en ZKTeco: ${empCode} -> ID ${(_b = emp.id) !== null && _b !== void 0 ? _b : "SIN-ID"}`);
                    }
                    catch (err) {
                        // Si el error es 404 → crear el empleado
                        if (((_c = err.response) === null || _c === void 0 ? void 0 : _c.status) === 404) {
                            zkResponse = await zktecoApi.request({
                                path: "/personnel/api/employees/",
                                method: "POST",
                                body,
                                token: staticToken,
                            });
                            console.log(`Empleado no encontrado, creado en ZKTeco: ${emp.emp_code} -> ID ${(zkResponse === null || zkResponse === void 0 ? void 0 : zkResponse.id) || 0}`);
                            logger_1.default.writeLog(`Creado en ZKTeco: ${empCode} -> ID ${(zkResponse === null || zkResponse === void 0 ? void 0 : zkResponse.id) || 0}`);
                        }
                        else {
                            throw err;
                        }
                    }
                }
                let realId = emp.id;
                // Si es creación (POST)
                if (!emp.id || emp.id === 0) {
                    realId = (zkResponse === null || zkResponse === void 0 ? void 0 : zkResponse.id) || 0; // usar ID devuelto por ZKTeco
                }
                // Si es actualización (PUT)
                // usar emp.id que ya está correcto
                const payloadToSave = {
                    ...zkResponse,
                    id: realId
                };
                // Guardar siempre algo en SQL, aunque zkResponse sea null
                await db_1.default.exec([
                    { name: 'emp_code', value: emp.emp_code, type: mssql_1.default.VarChar },
                    { name: 'json_payload', value: JSON.stringify(payloadToSave), type: mssql_1.default.NVarChar },
                    { name: 'usuario', value: usuario, type: mssql_1.default.VarChar },
                ], conf_1.STORE_PROCEDURE.SSCA.SSCA_SP_BIOTIME_PERSONAL_UPDATE_FROM_ZK);
                logger_1.default.writeLog(`Sincronización finalizada correctamente para ${empCode}`);
            }
            catch (error) {
                logger_1.default.writeLog(`Error sincronizando ${empCode}: ${error}`);
                console.error(`Error sincronizando empleado ${emp.emp_code || emp.codigo}:`, ((_d = error.response) === null || _d === void 0 ? void 0 : _d.data) || error.message);
            }
        };
        // private handlerAreaBiotime = async (area_code) => {
        //   try {
        //     const staticToken = await zktecoApi.getStaticToken();
        //     const query       = { area_code };
        //     const data = await zktecoApi.request({
        //       path  : "/personnel/api/areas/",
        //       method: "GET",
        //       token : staticToken,
        //       params: query
        //     });
        //     return data ?? { data: [] };
        //   } catch (err) {
        //     console.error("Error handlerAreaBiotime:", err);
        //     return { data: [] };
        //   }
        // };
        // private handlerDepartmentBiotime = async (dept_code) => {
        //   try {
        //     const staticToken = await zktecoApi.getStaticToken();
        //     const query       = { dept_code };
        //     const data = await zktecoApi.request({
        //       path  : "/personnel/api/departments/",
        //       method: "GET",
        //       token : staticToken,
        //       params: query
        //     });
        //     return data ?? { data: [] };
        //   } catch (err) {
        //     console.error("Error handlerDepartmentBiotime:", err);
        //     return { data: [] };
        //   }
        // };
        // private handlerGetEmployeeBiotime = async (emp_code) => {
        //   const staticToken = await zktecoApi.getStaticToken();
        //   const query       = { emp_code: emp_code };
        //   const data = await zktecoApi.request({
        //       path  : "/personnel/api/employees/",
        //       method: "GET",
        //       token : staticToken,
        //       params: query,   // enviar los parámetros dinámicamente
        //     });
        //   return data;
        // }
    }
    // ============================
    // PERSONNEL AREA
    // ============================
    async GetAreas(req, res) {
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
                path: "/personnel/api/areas/",
                method: "GET",
                token: staticToken,
                params: query, // enviar los parámetros dinámicamente
            });
            if (!data) {
                response.code = 500;
                response.message = "Error obteniendo departamentos del dispositivo biométrico.";
                return res.status(200).json(response);
            }
            response.metadata = data;
            response.code = 200;
            response.status = true;
            response.message = "Departamentos obtenidos correctamente";
            return res.status(200).json(response);
        }
        catch (error) {
            console.error("Error en GetDepartaments:", error);
            response.code = 500;
            response.status = false;
            response.message = error.message || "Error interno en GetDepartaments";
            return res.status(200).json((0, error_1.error_message)(error));
        }
    }
    async GetAreasById(req, res) {
        console.log('req.query:>>> ', req.query);
    }
    async PostAreas(req, res) {
        console.log('req.query:>>> ', req.query);
        console.log('req.query:>>> ', req.body);
    }
    async UpdateAreas(req, res) {
        console.log('req.query:>>> ', req.query);
        console.log('req.query:>>> ', req.body);
    }
    async DeleteAreas(req, res) {
        console.log('req.query:>>> ', req.query);
        console.log('req.query:>>> ', req.body);
    }
    sanitizeAreaName(nombre) {
        if (!nombre)
            return "SinNombre";
        return nombre
            .normalize("NFD") // elimina tildes
            .replace(/[\u0300-\u036f]/g, "") // elimina diacríticos
            .replace(/[^A-Za-z0-9\s\-\_\.]/g, " ") // caracteres válidos
            .replace(/\s+/g, " ") // espacios múltiples → uno solo
            .trim()
            .slice(0, 30); // 🔹 límite 30 chars
    }
    // ============================
    // PERSONNEL DEPARTAMENT
    // ============================
    async GetDepartaments(req, res) {
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
                path: "/personnel/api/departments/",
                method: "GET",
                token: staticToken,
                params: query, // enviar los parámetros dinámicamente
            });
            if (!data) {
                response.code = 500;
                response.message = "Error obteniendo departamentos del dispositivo biométrico.";
                return res.status(200).json(response);
            }
            response.metadata = data;
            response.code = 200;
            response.status = true;
            response.message = "Departamentos obtenidos correctamente";
            return res.status(200).json(response);
        }
        catch (error) {
            console.error("Error en GetDepartaments:", error);
            response.code = 500;
            response.status = false;
            response.message = error.message || "Error interno en GetDepartaments";
            return res.status(200).json((0, error_1.error_message)(error));
        }
    }
    async GetDepartamentsById(req, res) {
        console.log('req.query:>>> ', req.query);
    }
    async PostDepartaments(req, res) {
        console.log('req.query:>>> ', req.query);
        console.log('req.query:>>> ', req.body);
    }
    async UpdateDepartaments(req, res) {
        console.log('req.query:>>> ', req.query);
        console.log('req.query:>>> ', req.body);
    }
    async DeleteDepartaments(req, res) {
        console.log('req.query:>>> ', req.query);
        console.log('req.query:>>> ', req.body);
    }
    sanitizeDepartamentName(nombre) {
        if (!nombre)
            return "SinNombre";
        return nombre
            .normalize("NFD") // elimina tildes
            .replace(/[\u0300-\u036f]/g, "") // elimina diacríticos
            .replace(/[^A-Za-z0-9\s\-\_\.]/g, " ") // caracteres válidos
            .replace(/\s+/g, " ") // espacios múltiples → uno solo
            .trim()
            .slice(0, 30); // 🔹 límite 30 chars
    }
    // ============================
    // PERSONNEL EMPLOYEE
    // ============================
    async GetEmployees(req, res) {
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
                path: "/personnel/api/employees/",
                method: "GET",
                token: staticToken,
                params: query, // enviar los parámetros dinámicamente
            });
            if (!data) {
                response.code = 500;
                response.message = "Error obteniendo employees del dispositivo biométrico.";
                return res.status(200).json(response);
            }
            response.metadata = data;
            response.code = 200;
            response.status = true;
            response.message = "employees obtenidos correctamente";
            return res.status(200).json(response);
        }
        catch (error) {
            console.error("Error en GetEmployees:", error);
            response.code = 500;
            response.status = false;
            response.message = error.message || "Error interno en GetDepartaments";
            return res.status(200).json((0, error_1.error_message)(error));
        }
    }
}
;
const zKTecoPersonnelBioTimeController = new ZKTecoPersonnelBioTimeController();
exports.default = zKTecoPersonnelBioTimeController;
