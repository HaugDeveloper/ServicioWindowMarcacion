"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientIP = getClientIP;
exports.isPrivateIP = isPrivateIP;
exports.getClientInfo = getClientInfo;
/**
 * Extracts the client IP address from the request object
 * @param req - Express request object
 * @returns Client IP address as string
 */
function getClientIP(req) {
    var _a, _b, _c, _d;
    // Check for forwarded IP addresses (when behind proxy/load balancer)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        // x-forwarded-for can contain multiple IPs separated by comma
        // The first one is the original client IP
        return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
    }
    // Check for real IP header (common in nginx)
    const realIP = req.headers['x-real-ip'];
    if (realIP) {
        return Array.isArray(realIP) ? realIP[0] : realIP;
    }
    // Fallback to connection remote address
    const remoteAddress = ((_a = req.connection) === null || _a === void 0 ? void 0 : _a.remoteAddress) ||
        ((_b = req.socket) === null || _b === void 0 ? void 0 : _b.remoteAddress) ||
        ((_d = (_c = req.connection) === null || _c === void 0 ? void 0 : _c.socket) === null || _d === void 0 ? void 0 : _d.remoteAddress);
    if (remoteAddress) {
        // Handle IPv6-mapped IPv4 addresses
        return remoteAddress.startsWith('::ffff:')
            ? remoteAddress.substring(7)
            : remoteAddress;
    }
    // Final fallback
    return 'unknown';
}
/**
 * Checks if an IP address is a private/internal IP
 * @param ip - IP address to check
 * @returns true if the IP is private
 */
function isPrivateIP(ip) {
    const privateRanges = [
        /^127\./, // 127.0.0.0/8
        /^10\./, // 10.0.0.0/8
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
        /^192\.168\./, // 192.168.0.0/16
        /^169\.254\./, // 169.254.0.0/16 (APIPA)
        /^::1$/, // IPv6 loopback
        /^fe80:/, // IPv6 link-local
        /^fc00:/, // IPv6 unique local
    ];
    return privateRanges.some(range => range.test(ip));
}
/**
 * Gets detailed client information from request
 * @param req - Express request object
 * @returns Object with client IP and additional info
 */
function getClientInfo(req) {
    const ip = getClientIP(req);
    return {
        ip,
        isPrivate: isPrivateIP(ip),
        userAgent: req.headers['user-agent'],
        referer: req.headers['referer'],
    };
}
