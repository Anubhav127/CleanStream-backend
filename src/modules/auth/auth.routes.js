import express from 'express';
import validate from '../../shared/middleware/validate.js';
import { registerController, loginController, refreshController, logoutController, getCurrentUserController, changePasswordController, getActiveSessionsController, resendEmailVerificationController, verifyEmailController, forgotPasswordController, resetPasswordController } from './auth.controller.js';
import { registerSchema, loginSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.validation.js';
import authMiddleware from '../../shared/middleware/authMiddleware.js';
import { authLimiter } from '../../shared/middleware/rateLimiter.js';

const router = express.Router();

//public 
router.route('/register').post(authLimiter, validate(registerSchema), registerController);
router.route('/login').post(authLimiter, validate(loginSchema), loginController);
router.route('/refresh').get(authLimiter, refreshController);
router.route('/forgot-password').post(authLimiter, validate(forgotPasswordSchema), forgotPasswordController);
router.route('/reset-password').patch(authLimiter, validate(resetPasswordSchema), resetPasswordController);

// protected
router.route('/logout').delete(authMiddleware, logoutController);
router.route('/me').get(authMiddleware, getCurrentUserController);
router.route('/change-password').patch(authMiddleware, validate(changePasswordSchema), changePasswordController)
router.route('/active-sessions').get(authMiddleware, getActiveSessionsController);
router.route('/resend-email-verification').post(authMiddleware, resendEmailVerificationController);
router.route('/verify-email/:verificationToken').patch(authMiddleware, verifyEmailController);

export default router;