// src/rest-resources/middlewares/request.middleware.js
import { randomUUID } from 'crypto';
import { Logger } from '@src/utils/logger.js';

export const requestMiddleware = (req, res, next) => {
  const startTime = Date.now();
  req.startTime = startTime;

  const traceId = req.headers['x-request-id'] || req.headers['x-trace-id'] || randomUUID();
  req.traceId = traceId;
  res.setHeader('x-request-id', traceId);

  const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  req.clientIp = clientIp;

  // Attach request-specific child logger
  req.logger = Logger.child({ traceId });


  next();
};

export default requestMiddleware;
