import { Request, Response }  from "express";
import { zkteco }             from "../api/index";
import { ZKTECO_CONFIG }      from "../config/conf";
import { IApiResponse }       from "../interfaces/IZKTecoAuthBioTime";
import { generatedJwt }       from '../middleware/jwt';

const zktecoApi = new zkteco.zkteco_auth_biotime.ZKTeco_Auth_BioTime();

const JwtApiTokenAuthController = {

  async JwtApiTokenAuth(req: Request, res: Response) {
    // console.log('req.body:>>> ', req.body)
    // const { USUARIO, CLAVE, CODIGO_SISTEMA } = req.body._usr;
    const { USUARIO, CLAVE, CODIGO_SISTEMA } = req.body._usr;

    const response: IApiResponse = {
      status : false,
      code   : 400,
      message: "",
    };

    try {
      if (!USUARIO || !CLAVE) {
        response.message = "Faltan credenciales";
        response.code    = 400;
        response.status  = false;
        return res.send(response);
      }

      if (
        USUARIO !== ZKTECO_CONFIG.ZKTECO_USERNAME ||
        CLAVE   !== ZKTECO_CONFIG.ZKTECO_PASSWORD
      ) {
        response.status  = false;
        response.code    = 401;
        response.message = "Credenciales inválidas";
        return res.send(response);
      }

      const auth = await zktecoApi.JwtApiTokenAuth(USUARIO, CLAVE);
      if (!auth?.token) {
        response.status  = false;
        response.code    = 401;
        response.message = "No se pudo autenticar en ZKTECO BioTime";
        return res.send(response);
      }

      const token = generatedJwt({
          idUsuario : "1193",
          idPerfil  : "1",
          codSistema: CODIGO_SISTEMA
      });

      console.log('auth:>>> ', auth)

      return res.json({
        status       : true,
        authorization: token,
        zkteco_token : auth.token,
        metadata     : {
          CODIGO_SISTEMA,
          USUARIO          : USUARIO,
          ID_USUARIO       : "",
          ID_PERFIL_USUARIO: "",
          ALIAS            : USUARIO,
          CENTRO_COSTO     : "",
          ROUTE            : "home"
        },
      });
    } catch (ex: any) {
      console.error("Error en JwtApiTokenAuth:", ex);
      response.status  = false;
      response.code    = 500;
      response.message = "Error interno del servidor";
      response.data    = { error: ex.message };
      return res.send(response);
    }
  },
  
};

export default JwtApiTokenAuthController;
