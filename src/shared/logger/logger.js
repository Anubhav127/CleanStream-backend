import winston from 'winston';
import 'winston-daily-rotate-file';
import env from '../config/env.js';

const isProduction = env.NODE_ENV === 'production';

const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Combined logs (info + warn + error + http)
const combinedTransport = new winston.transports.DailyRotateFile({
    filename: 'logs/app-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
});

// Error logs only
const errorTransport = new winston.transports.DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '30d',
});

// Logger instance
const logger = winston.createLogger({
    level: isProduction ? 'info' : 'debug',
    format: logFormat,
    transports: [combinedTransport, errorTransport],
});

// Console logging (only for dev)
if (!isProduction) {
    logger.add(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        })
    );
}

export default logger;