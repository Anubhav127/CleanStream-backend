import { Queue } from 'bullmq';
import { connection } from '../config/redis.js';

export const emailQueue = new Queue('email', {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 30_000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});