import { logger } from '../config/logger.js';

const SENSITIVE_KEYS = [
  'password',
  'token',
  'auth_token',
  'captcha_token',
  'cookie',
  'authorization',
  'captcha',
  'captchaOptionId'
];

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isSensitiveKey(key) {
  return SENSITIVE_KEYS.includes(String(key).toLowerCase());
}

function sanitizeMeta(meta = {}) {
  if (!isObject(meta)) {
    return meta;
  }

  const cleanMeta = {};

  for (const [key, value] of Object.entries(meta)) {
    if (isSensitiveKey(key)) {
      cleanMeta[key] = '[REDACTED]';
      continue;
    }

    if (isObject(value)) {
      cleanMeta[key] = sanitizeMeta(value);
      continue;
    }

    cleanMeta[key] = value;
  }

  return cleanMeta;
}

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

function getRequestContext(req) {
  return {
    requestId: req.requestId || null,
    method: req.method || null,
    url: req.originalUrl || req.url || null,
    ip: getClientIp(req),
    userAgent: req.get?.('user-agent') || null,
    userId: req.user?.id || null
  };
}

export function logInfo(req, event, meta = {}) {
  logger.info({
    message: event,
    ...getRequestContext(req),
    ...sanitizeMeta(meta)
  });
}

export function logWarn(req, event, meta = {}) {
  logger.warn({
    message: event,
    ...getRequestContext(req),
    ...sanitizeMeta(meta)
  });
}

export function logError(req, event, error, meta = {}) {
  logger.error({
    message: event,
    ...getRequestContext(req),
    ...sanitizeMeta(meta),
    errorName: error?.name || null,
    errorMessage: error?.message || null,
    stack: error?.stack || null
  });
}