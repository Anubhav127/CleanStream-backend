import { z } from 'zod';

export const registerSchema = z.object({
    username: z.string().min(3).max(100),
    email: z.string().email().transform((val) => val.toLowerCase().trim()),
    password: z.string().min(6).max(100),
});

export const loginSchema = z.object({
    email: z.string().email().transform((val) => val.toLowerCase().trim()),
    password: z.string().min(6),
});

export const changePasswordSchema = z.object({
    oldPassword: z.string().min(6).max(100),
    newPassword: z.string().min(6).max(100),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email().transform((val) => val.toLowerCase().trim()),
});

export const resetPasswordSchema = z.object({
    resetToken: z.string(),
    newPassword: z.string().min(6).max(100),
});
