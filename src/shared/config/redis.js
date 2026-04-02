import IORedis from 'ioredis';
import env from './env.js';

// export const connection = new IORedis(env.REDIS_URL, {
//     maxRetriesPerRequest: null,
//     enableReadyCheck: false
// });

const connection = new IORedis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    maxRetriesPerRequest: null,
});

export { connection };