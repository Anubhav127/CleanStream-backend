import { Queue } from 'bullmq';
import { connection } from '../config/redis.js';

export const moderationQueue = new Queue('moderation', {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 30_000, // 30s → 60s → 120s
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});