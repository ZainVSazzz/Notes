import crypto from 'crypto';

export function requestId(req, res, next) {
  const incomingRequestId = req.headers['x-request-id'];

  const currentRequestId = Array.isArray(incomingRequestId)
    ? incomingRequestId[0]
    : incomingRequestId || crypto.randomUUID();

  req.requestId = currentRequestId;

  res.setHeader('X-Request-Id', currentRequestId);

  next();
}