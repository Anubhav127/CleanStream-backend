import { ApiError } from '../responses/apiError.js';
import logger from '../logger/logger.js';

const errorHandler = (err, req, res, next) => {
    const isOperational = err instanceof ApiError;

    const statusCode = err.statusCode || 500;
    const message = isOperational
        ? err.message
        : 'Something went wrong';

    // Log everything (with request context if available)
    const logPayload = {
        requestId: req.requestId,
        message: err.message,
        stack: err.stack,
        statusCode,
    };

    if (statusCode >= 500) {
        logger.error(logPayload);
    } else {
        logger.warn(logPayload);
    }

    return res.status(statusCode).json({
        success: false,
        message,
        ...(isOperational && err.errors?.length && { errors: err.errors }),
    });
};

export default errorHandler;