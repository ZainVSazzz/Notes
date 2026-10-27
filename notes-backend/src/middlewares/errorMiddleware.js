import { sendError } from '../utils/response.js';

export function errorMiddleware(error, req, res, next) {
  const statusCode = error.statusCode || 500;

  return sendError(req, res, error, {
    statusCode,
    message: statusCode === 500
      ? 'Terjadi kesalahan pada server'
      : error.message,
    event: 'app.error'
  });
}