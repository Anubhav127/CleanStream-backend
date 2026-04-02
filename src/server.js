import app from './app.js';
import env from './shared/config/env.js';
import logger from './shared/logger/logger.js';
import { pool } from './shared/db/pool.js';
import { connection as redis } from './shared/config/redis.js';
import { emailQueue } from './shared/queue/email.queue.js';
import { moderationQueue } from './shared/queue/moderation.queue.js';

// Graceful Start
const start = async () => {
    try {
        // 1. Verify database connectivity
        const dbResult = await pool.query('SELECT NOW()');
        logger.info(`Database connected (server time: ${dbResult.rows[0].now})`);

        // 2. Verify Redis connectivity
        const redisPing = await redis.ping();
        logger.info(`Redis connected (ping: ${redisPing})`);

        // 3. Start HTTP server
        const server = app.listen(env.PORT, () => {
            logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
        });

        // Graceful Shutdown
        const shutdown = async (signal) => {
            logger.info(`${signal} received — starting graceful shutdown...`);

            // 1. Stop accepting new connections (give in-flight requests 10s to finish)
            server.close(() => {
                logger.info('HTTP server closed');
            });

            // Set a hard deadline — force exit after 15s
            const forceExit = setTimeout(() => {
                logger.error('Graceful shutdown timed out — forcing exit');
                process.exit(1);
            }, 15_000);
            forceExit.unref();

            try {
                // 2. Close BullMQ queues (stop enqueuing new jobs)
                await emailQueue.close();
                logger.info('Email queue closed');

                await moderationQueue.close();
                logger.info('Moderation queue closed');

                // 3. Close Redis
                await redis.quit();
                logger.info('Redis connection closed');

                // 4. Drain Postgres pool
                await pool.end();
                logger.info('Database pool drained');

                logger.info('Graceful shutdown complete');
                process.exit(0);
            } catch (err) {
                logger.error('Error during shutdown', { error: err.message });
                process.exit(1);
            }
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        // Catch unhandled errors so the process doesn't silently die
        process.on('unhandledRejection', (reason) => {
            logger.error('Unhandled Rejection', { error: reason?.message || reason });
        });

        process.on('uncaughtException', (err) => {
            logger.error('Uncaught Exception — shutting down', { error: err.message, stack: err.stack });
            shutdown('uncaughtException');
        });

    } catch (err) {
        logger.error('Failed to start server', { error: err.message, stack: err.stack });
        process.exit(1);
    }
};

start();