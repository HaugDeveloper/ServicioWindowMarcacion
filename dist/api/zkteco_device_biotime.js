"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const conf_1 = require("../config/conf");
class ZKTeco_Personnel_BioTime {
    constructor() {
        this.baseUrl = conf_1.ZKTECO_CONFIG.ZKTECO_BASE_URL;
        this.path = conf_1.ZKTECO_CONFIG.ZKTECO_BASE_URL_JWT_API_TOKEN_AUTH;
    }
    async request(options) {
        var _a;
        const { path, method = "GET", body, token } = options;
        const url = `${this.baseUrl}${path}`;
        try {
            const resp = await axios_1.default.request({
                url,
                method,
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `JWT ${token}` } : {}),
                },
                data: body,
            });
            return resp.data;
        }
        catch (err) {
            console.error("Error en request ZKTECO zkteco_device_biotime.ts:", ((_a = err.response) === null || _a === void 0 ? void 0 : _a.data) || err.message);
            return null;
        }
    }
}
exports.default = ZKTeco_Personnel_BioTime;
