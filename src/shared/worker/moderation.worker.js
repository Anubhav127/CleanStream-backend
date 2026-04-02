import { Worker } from 'bullmq';
import { connection } from '../config/redis.js';
import { runModeration } from '../../modules/moderation/moderation.service.js';
import logger from '../logger/logger.js';

const WORKER_NAME = 'ModerationWorker';

const worker = new Worker(
    'moderation',
    async (job) => {
        const { post } = job.data;

        logger.info(`${WORKER_NAME}: Processing job ${job.id} → post ${post.id}`);

        await runModeration({
            postId: post.id,
            text: post.text,
            mediaUrl: post.media_url,
            userId: post.user_id,
        });
    },
    {
        connection,
        concurrency: 1,
        limiter: {
            max: 5,
            duration: 60_000,
        },
    }
);

worker.on('completed', (job) => {
    logger.info(`${WORKER_NAME}: Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
    const remaining = (job.opts?.attempts || 0) - job.attemptsMade;
    logger.error(`${WORKER_NAME}: Job ${job.id} failed (${remaining} retries left)`, { error: err.message });
});

worker.on('ready', () => {
    logger.info(`${WORKER_NAME}: Ready and listening for jobs`);
});

// Graceful Shutdown
const shutdown = async (signal) => {
    logger.info(`${WORKER_NAME}: ${signal} received — shutting down gracefully...`);

    const forceExit = setTimeout(() => {
        logger.error(`${WORKER_NAME}: Graceful shutdown timed out — forcing exit`);
        process.exit(1);
    }, 10_000);
    forceExit.unref();

    try {
        await worker.close();
        logger.info(`${WORKER_NAME}: Worker closed (in-flight jobs finished)`);

        await connection.quit();
        logger.info(`${WORKER_NAME}: Redis connection closed`);

        process.exit(0);
    } catch (err) {
        logger.error(`${WORKER_NAME}: Error during shutdown`, { error: err.message });
        process.exit(1);
    }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
    logger.error(`${WORKER_NAME}: Unhandled Rejection`, { error: reason?.message || reason });
});

process.on('uncaughtException', (err) => {
    logger.error(`${WORKER_NAME}: Uncaught Exception`, { error: err.message, stack: err.stack });
    shutdown('uncaughtException');
});