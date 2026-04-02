import logger from './logger.js';
import { randomUUID } from 'crypto';

const requestLogger = (req, res, next) => {
    const requestId = randomUUID();

    req.requestId = requestId;

    req.logger = logger.child({ requestId });

    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;

        logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, {
            requestId,
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
    });

    next();
};

export default requestLogger;