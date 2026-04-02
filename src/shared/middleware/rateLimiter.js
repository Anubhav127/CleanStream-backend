import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,

    standardHeaders: true,
    legacyHeaders: false,

    handler: (req, res) => {
        req.logger?.warn({
            message: 'Rate limit exceeded',
            requestId: req.requestId,
            ip: req.ip,
            route: req.originalUrl,
        });

        res.status(429).json({
            success: false,
            message: 'Too many requests, please try again later',
        });
    },
});

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000,

    standardHeaders: true,
    legacyHeaders: false,

    handler: (req, res) => {
        req.logger?.warn({
            message: 'Rate limit exceeded',
            requestId: req.requestId,
            ip: req.ip,
            route: req.originalUrl,
        });

        res.status(429).json({
            success: false,
            message: 'Too many requests',
        });
    },
});
