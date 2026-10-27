import expressWinston from 'express-winston';
import { logger } from '../config/logger.js';

function normalizeIp(ip) {
  if (!ip) {
    return null;
  }

  if (ip === '::1') {
    return '127.0.0.1';
  }

  if (ip.startsWith('::ffff:')) {
    return ip.replace('::ffff:', '');
  }

  return ip;
}

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];

  if (forwardedFor) {
    const ip = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor.split(',')[0];

    return normalizeIp(ip.trim());
  }

  return normalizeIp(req.ip || req.socket?.remoteAddress);
}

function getUserAgent(req) {
  return req.get('user-agent') || null;
}

function getStatusLevel(req, res) {
  if (res.statusCode >= 500) {
    return 'error';
  }

  if (res.statusCode >= 400) {
    return 'warn';
  }

  return 'info';
}

export const httpLogger = expressWinston.logger({
  winstonInstance: logger,

  meta: true,
  metaField: null,
  requestField: null,
  responseField: null,

  msg: 'http.request',
  expressFormat: false,
  colorize: false,
  statusLevels: false,

  level: getStatusLevel,

  requestWhitelist: [],
  responseWhitelist: [],
  bodyWhitelist: [],

  headerBlacklist: [
    'authorization',
    'cookie',
    'set-cookie'
  ],

  dynamicMeta(req, res) {
    return {
      requestId: req.requestId || null,
      method: req.method,
      url: req.originalUrl || req.url,
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
      userId: req.user?.id || null,
      statusCode: res.statusCode,
      responseTimeMs: res.responseTime || null,
      contentLength: res.get('content-length') || null
    };
  },

  ignoreRoute(req) {
    return req.originalUrl === '/favicon.ico';
  }
});

export const httpErrorLogger = expressWinston.errorLogger({
  winstonInstance: logger,

  meta: true,
  metaField: null,
  requestField: null,
  responseField: null,

  msg: 'app.error',

  requestWhitelist: [],
  responseWhitelist: [],
  bodyWhitelist: [],

  headerBlacklist: [
    'authorization',
    'cookie',
    'set-cookie'
  ],

  dynamicMeta(req, res, error) {
    return {
      requestId: req.requestId || null,
      method: req.method,
      url: req.originalUrl || req.url,
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
      userId: req.user?.id || null,
      statusCode: res.statusCode,
      errorName: error?.name || null,
      errorMessage: error?.message || null,
      stack: error?.stack || null
    };
  }
});