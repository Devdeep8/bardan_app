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
  req.logger.info('Incoming Request', { method: req.method, url: req.url, traceId, startTime, ip: clientIp });


  next();
};

export default requestMiddleware;
