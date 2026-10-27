import {
  logInfo,
  logWarn,
  logError
} from './log.js';

function buildResponse(status, message, data, requestId) {
  return {
    status,
    message,
    data: {
      ...(data || {}),
      requestId
    }
  };
}

export function sendSuccess(req, res, options = {}) {
  const {
    statusCode = 200,
    message = 'Berhasil',
    data = null,
    event = null,
    meta = {}
  } = options;

  if (event) {
    logInfo(req, event, meta);
  }

  return res.status(statusCode).json(
    buildResponse(true, message, data, req.requestId)
  );
}

export function sendFail(req, res, options = {}) {
  const {
    statusCode = 400,
    message = 'Request tidak valid',
    data = null,
    event = null,
    meta = {}
  } = options;

  if (event) {
    logWarn(req, event, {
      statusCode,
      ...meta
    });
  }

  return res.status(statusCode).json(
    buildResponse(false, message, data, req.requestId)
  );
}

export function sendError(req, res, error, options = {}) {
  const {
    statusCode = 500,
    message = 'Terjadi kesalahan pada server'
  } = options;

  return res.status(statusCode).json(
    buildResponse(false, message, null, req.requestId)
  );
}