import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production']),
    PORT: z.string(),
    DB_HOST: z.string(),
    DB_PORT: z.string(),
    DB_USER: z.string(),
    DB_PASSWORD: z.string(),
    DB_NAME: z.string(),
    JWT_ACCESS_SECRET: z.string().min(10),
    JWT_ACCESS_TOKEN_EXPIRY: z.string(),
    JWT_REFRESH_SECRET: z.string().min(10),
    JWT_REFRESH_TOKEN_EXPIRY: z.string(),
    CLOUDINARY_NAME: z.string(),
    CLOUDINARY_API_KEY: z.string(),
    CLOUDINARY_API_SECRET: z.string(),
    OPENROUTER_API_KEY: z.string(),
    MODERATION_PROVIDER: z.enum(['openai', 'mock']),
    IMAGE_PROVIDER: z.enum(['sightengine', 'mock']),
    SIGHTENGINE_USER: z.string(),
    SIGHTENGINE_SECRET: z.string(),
    DATABASE_URL: z.string(),
    REDIS_URL: z.string(),
    SMTP_HOST: z.string(),
    SMTP_PORT: z.string(),
    SMTP_USER: z.string(),
    SMTP_PASS: z.string(),
    FRONTEND_URL: z.string(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('Invalid environment variables');
    console.error(parsed.error.format());
    process.exit(1);
}

export default parsed.data;