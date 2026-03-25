"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../api/index");
const conf_1 = require("../config/conf");
const jwt_1 = require("../middleware/jwt");
const zktecoApi = new index_1.zkteco.zkteco_auth_biotime.ZKTeco_Auth_BioTime();
const JwtApiTokenAuthController = {
    async JwtApiTokenAuth(req, res) {
        // console.log('req.body:>>> ', req.body)
        // const { USUARIO, CLAVE, CODIGO_SISTEMA } = req.body._usr;
        const { USUARIO, CLAVE, CODIGO_SISTEMA } = req.body._usr;
        const response = {
            status: false,
            code: 400,
            message: "",
        };
        try {
            if (!USUARIO || !CLAVE) {
                response.message = "Faltan credenciales";
                response.code = 400;
                response.status = false;
                return res.send(response);
            }
            if (USUARIO !== conf_1.ZKTECO_CONFIG.ZKTECO_USERNAME ||
                CLAVE !== conf_1.ZKTECO_CONFIG.ZKTECO_PASSWORD) {
                response.status = false;
                response.code = 401;
                response.message = "Credenciales inválidas";
                return res.send(response);
            }
            const auth = await zktecoApi.JwtApiTokenAuth(USUARIO, CLAVE);
            if (!(auth === null || auth === void 0 ? void 0 : auth.token)) {
                response.status = false;
                response.code = 401;
                response.message = "No se pudo autenticar en ZKTECO BioTime";
                return res.send(response);
            }
            const token = (0, jwt_1.generatedJwt)({
                idUsuario: "1193",
                idPerfil: "1",
                codSistema: CODIGO_SISTEMA
            });
            console.log('auth:>>> ', auth);
            return res.json({
                status: true,
                authorization: token,
                zkteco_token: auth.token,
                metadata: {
                    CODIGO_SISTEMA,
                    USUARIO: USUARIO,
                    ID_USUARIO: "",
                    ID_PERFIL_USUARIO: "",
                    ALIAS: USUARIO,
                    CENTRO_COSTO: "",
                    ROUTE: "home"
                },
            });
        }
        catch (ex) {
            console.error("Error en JwtApiTokenAuth:", ex);
            response.status = false;
            response.code = 500;
            response.message = "Error interno del servidor";
            response.data = { error: ex.message };
            return res.send(response);
        }
    },
};
exports.default = JwtApiTokenAuthController;
