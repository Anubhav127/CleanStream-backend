import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { ApiResponse } from '../../shared/responses/apiResponse.js';
import { register, login, refresh, logout, getCurrentUser, changePassword, getActiveSessions, resendEmailVerificationService, verifyEmailService, forgotPasswordService, resetPasswordService } from './auth.service.js';

const registerController = asyncHandler(async (req, res) => {
    const { username, email, password } = req.validatedBody;

    const result = await register({ username, email, password });

    return res.status(201).json(new ApiResponse(201, result, 'User registered successfully'));
});

const loginController = asyncHandler(async (req, res) => {
    const { email, password } = req.validatedBody;

    const result = await login({
        email,
        password,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
    });

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "none",
    }

    return res
        .status(200)
        .cookie('accessToken', result.accessToken, options)
        .cookie('refreshToken', result.refreshToken, options)
        .json(new ApiResponse(200, result.user, 'Login successful'));
});

const refreshController = asyncHandler(async (req, res) => {
    const { refreshToken } = req.cookies;

    const result = await refresh({ refreshToken });

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "none",
    }

    return res
        .status(200)
        .cookie('accessToken', result.accessToken, options)
        .cookie('refreshToken', result.refreshToken, options)
        .json(new ApiResponse(200, {}, 'Token refreshed successfully'));
});

const logoutController = asyncHandler(async (req, res) => {
    const authenticatedUser = req.user;
    const logoutAll = req.query.logoutAll || false;
    const remSessionId = req.query.sessionId || null;

    await logout({ authenticatedUser, logoutAll, remSessionId });

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "none",
    }

    if (remSessionId !== null) {
        return res
            .status(200)
            .json(new ApiResponse(200, {}, 'Logged out successfully'));
    }

    return res
        .status(200)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json(new ApiResponse(200, {}, 'Logged out successfully'));
});

const getCurrentUserController = asyncHandler(async (req, res) => {
    const authenticatedUser = req.user;
    const fullInfo = req.query.fullInfo || false;

    const user = await getCurrentUser({ authenticatedUser, fullInfo });

    return res.status(200).json(new ApiResponse(200, user, 'User fetched successfully'));
});

const changePasswordController = asyncHandler(async (req, res) => {
    const authenticatedUser = req.user;
    const { oldPassword, newPassword } = req.validatedBody;

    const result = await changePassword({ authenticatedUser, oldPassword, newPassword });

    return res.status(200).json(new ApiResponse(200, result, 'Password changed successfully'));
});

const getActiveSessionsController = asyncHandler(async (req, res) => {
    const { userId, sessionId } = req.user;

    const sessions = await getActiveSessions({ userId });

    return res.status(200).json(new ApiResponse(200, {
        sessions,
        currentSessionId: sessionId,
    }, 'Active sessions fetched successfully'));
});

const resendEmailVerificationController = asyncHandler(async (req, res) => {
    const authenticatedUser = req.user;

    const result = await resendEmailVerificationService({ authenticatedUser });

    return res.status(200).json(new ApiResponse(200, result, 'Email verification sent successfully'));
});

const verifyEmailController = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { verificationToken } = req.params;

    const result = await verifyEmailService({ userId, verificationToken });

    return res.status(200).json(new ApiResponse(200, result, 'Email verified successfully'));
});

const forgotPasswordController = asyncHandler(async (req, res) => {
    const { email } = req.validatedBody;

    const result = await forgotPasswordService({ email });

    return res.status(200).json(new ApiResponse(200, result, 'Forgot password email sent successfully'));
});

const resetPasswordController = asyncHandler(async (req, res) => {
    const { resetToken, newPassword } = req.validatedBody;

    const result = await resetPasswordService({ resetToken, newPassword });

    return res.status(200).json(new ApiResponse(200, result, 'Password reset successfully'));
});

export {
    registerController,
    loginController,
    refreshController,
    logoutController,
    getCurrentUserController,
    changePasswordController,
    getActiveSessionsController,
    resendEmailVerificationController,
    verifyEmailController,
    forgotPasswordController,
    resetPasswordController,
};
