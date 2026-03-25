"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZKTeco_Auth_BioTime = void 0;
const axios_1 = __importDefault(require("axios"));
const conf_1 = require("../config/conf");
class ZKTeco_Auth_BioTime {
    constructor() {
        // cache interno
        this.staticToken = null;
        this.staticTokenExp = null;
        this.baseUrl = conf_1.ZKTECO_CONFIG.ZKTECO_BASE_URL;
        this.path = conf_1.ZKTECO_CONFIG.ZKTECO_BASE_URL_JWT_API_TOKEN_AUTH;
        this.username = conf_1.ZKTECO_CONFIG.ZKTECO_USERNAME;
        this.password = conf_1.ZKTECO_CONFIG.ZKTECO_PASSWORD;
    }
    async JwtApiTokenAuth(username, password) {
        var _a;
        const url = `${this.baseUrl}${this.path}`;
        const payload = {
            username: username,
            password: password,
        };
        try {
            const response = await axios_1.default.post(url, payload, {
                headers: { "Content-Type": "application/json" },
            });
            return response.data;
        }
        catch (err) {
            console.error("Error en login ZKTECO:", ((_a = err.response) === null || _a === void 0 ? void 0 : _a.data) || err.message);
            return null;
        }
    }
    // Método para obtener token estático de admin/admin123
    async getStaticToken() {
        const now = Math.floor(Date.now() / 1000);
        // si existe token en cache y no ha expirado
        if (this.staticToken && this.staticTokenExp && this.staticTokenExp > now) {
            return this.staticToken;
        }
        // login fijo
        const response = await this.JwtApiTokenAuth(conf_1.ZKTECO_CONFIG.ZKTECO_USERNAME, conf_1.ZKTECO_CONFIG.ZKTECO_PASSWORD);
        if (response === null || response === void 0 ? void 0 : response.token) {
            this.staticToken = response.token;
            this.staticTokenExp = now + 3600; // dura 1h (ajustar según ZK)
            return this.staticToken;
        }
        return null;
    }
    async request(options) {
        const { path, method = "GET", body, token, params } = options;
        const url = `${this.baseUrl}${path}`;
        // console.log('url:>>> ', url)
        try {
            const response = await axios_1.default.request({
                url,
                method,
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `JWT ${token}` } : {}),
                },
                data: body,
                params, // aquí lo pasas directo
            });
            return response.data;
        }
        catch (err) {
            if (err.response) {
                console.error(`Error en request ZKTECO zkteco_auth_biotime.ts: ${err.response.status} - ${err.response.statusText}`);
            }
            else {
                console.error("Error en request ZKTECO zkteco_auth_biotime.ts:", err.message);
            }
            return null;
        }
    }
}
exports.ZKTeco_Auth_BioTime = ZKTeco_Auth_BioTime;
