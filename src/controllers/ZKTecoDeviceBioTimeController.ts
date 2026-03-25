import { Request, Response }  from "express";
import { zkteco }             from "../api/index";
import DB                     from "../config/db";
import { STORE_PROCEDURE }    from "../config/conf";
import { error_message }      from "../config/error";
import { IResponse }          from "../interfaces/IZKTecoPersonnelBioTime";

const zktecoApi = new zkteco.zkteco_auth_biotime.ZKTeco_Auth_BioTime();

class ZKTecoDeviceBioTimeController {
  // ============================
  // TERMINAL
  // ============================


  // ============================
  // TRANSACTION
  // ============================
  public async GetTransactions (req: Request, res: Response) {
    const response: IResponse = {
      status : false,
      code   : 400,
      message: "",
    };

    try {
      const staticToken = await zktecoApi.getStaticToken();
      if (!staticToken) {
        response.code    = 401;
        response.message = "No se pudo obtener token estático";
        return res.status(401).json(response);
      }

      // Capturar query params del cliente (ej: ?page=1&page_size=10)
      const query = req.query;
      // console.log(query)

      const data = await zktecoApi.request({
        path  : "/iclock/api/transactions/",
        method: "GET",
        token : staticToken,
        params: query,   // enviar los parámetros dinámicamente
      });

      if (!data) {
        response.code    = 500;
        response.message = "Error obteniendo transactions del dispositivo biométrico.";
        return res.status(200).json(response);
      }

      response.metadata = data;
      response.code     = 200;
      response.status   = true;
      response.message  = "transactions obtenidos correctamente";

      return res.status(200).json(response);

    } catch (error: any) {
      console.error("Error en GetEmployees:", error);
      response.code    = 500;
      response.status  = false;
      response.message = error.message || "Error interno en GetTransactions";
      return res.status(200).json(error_message(error));
    }
  }

  public SincronizarTransactions = async (req: Request, res: Response) => {
    const response: IResponse = {
      status : false,
      code   : 400,
      message: "",
    };

    try {
      // 1. Traer gerencias desde SQLol
      const gerencias = await this.handlerGetGerenciaSQL();
      const sqlDepts = gerencias.map(g => ({
        id         : g.ID_GERENCIA,
        dept_code  : g.ID_GERENCIA.toString(),
        dept_name  : g.DESCRIPCION,
        parent_dept: null,
      }));

      // 2. Traer TODOS los departamentos actuales desde ZK
      const zktecoDepts = await this.handlerGetDepartamets();
      const zkDepts = zktecoDepts?.data || [];

      // 3. Eliminar TODOS en ZK
      await this.deleteAllZkDepartments(zkDepts);

      // 4. Crear TODOS desde SQL
      for (const dept of sqlDepts) {
        await this.handlerSaveDepartament(dept);
        console.log(`Creado en ZK: ${dept.dept_code} - ${dept.dept_name}`);
      }

      response.status   = true;
      response.code     = 200;
      response.message  = "Departamentos reiniciados correctamente";
      response.metadata = {
        eliminados: zkDepts.length,
        creados   : sqlDepts.length,
      };

      return res.status(200).json(response);

    } catch (error: any) {
      console.error("Error en SincronizarDepartaments:", error);
      response.code    = 500;
      response.message = error.message || "Error interno al sincronizar";
      return res.status(500).json(response);
    }
  };
  private handlerGetDepartamets = async () => {
    const staticToken = await zktecoApi.getStaticToken();
    return zktecoApi.request({
      path  : "/personnel/api/departments/",
      method: "GET",
      token : staticToken,
    });
  };
  private deleteAllZkDepartments = async (zkDepts: any[]) => {
    // Ordenar de mayor a menor ID -> elimina primero hijos
    const ordered = [...zkDepts].sort((a, b) => b.id - a.id);

    for (const dept of ordered) {
      try {
        await this.handlerDeleteDepartamentsById(dept.id);
        console.log(`Eliminado en ZK: ${dept.dept_code} - ${dept.dept_name}`);
      } catch (e: any) {
        console.warn(`Error eliminando ${dept.dept_code}:`, e.response?.data || e);
      }
    }
  };
  private handlerDeleteDepartamentsById = async (id: number) => {
    const staticToken = await zktecoApi.getStaticToken();
    return zktecoApi.request({
      path  : `/personnel/api/departments/${id}/`,
      method: "DELETE",
      token : staticToken,
    });
  };
  private handlerGetGerenciaSQL = async () => {
    const result: any[] = await DB.exec([], STORE_PROCEDURE.SSCA.SSCA_SP_GERENCIA_LIST);
    return result; // [{ ID_GERENCIA, DESCRIPCION }]
  };
  private handlerSaveDepartament = async (dept: any) => {
    const staticToken = await zktecoApi.getStaticToken();
    return zktecoApi.request({
      path  : "/personnel/api/departments/",
      method: "POST",
      body  : {
        dept_code  : dept.dept_code,
        dept_name  : dept.dept_name,
        parent_dept: dept.parent_dept,
      },
      token : staticToken,
    });
  };

  // ============================
  // ATTENDANCE REPORT API
  // ============================

}

const zKTecoDeviceBioTimeController = new ZKTecoDeviceBioTimeController();
export default zKTecoDeviceBioTimeController;
