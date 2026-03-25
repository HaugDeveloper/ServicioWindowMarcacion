"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.error_message = void 0;
const error_message = (error) => {
    switch (error === null || error === void 0 ? void 0 : error.code) {
        case "EREQUEST":
            return {
                status: false,
                message: error === null || error === void 0 ? void 0 : error.message,
            };
        default:
            return { status: false, message: error.message || error };
    }
};
exports.error_message = error_message;
