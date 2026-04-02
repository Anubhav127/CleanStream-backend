import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { ApiError } from '../../shared/responses/apiError.js';
import env from '../../shared/config/env.js';
import { SALT_ROUNDS } from './auth.constants.js';
import { findUserByEmail, createUser, createSession, findSession, deleteSession, updateSessionToken, findUserById, deleteSessionByUserId, updatePassword, findSessionByUserId, setEmailVerificationToken, findEmailVerificationToken, verifyEmail, deleteEmailVerificationToken, setPasswordResetToken, findResetPasswordToken, resetForgotPassword } from './auth.repository.js';
import ms from 'ms';
import { generateToken } from '../../shared/utils/tokens.js';
import { emailQueue } from '../../shared/queue/email.queue.js';
import { verifyEmailTemplate, resetPasswordTemplate } from '../../modules/email/email.template.js';

const generateAccessAndRefreshToken = ({ user, sessionId }) => {
    const accessToken = jwt.sign({ userId: user.id, role: user.role, sessionId }, env.JWT_ACCESS_SECRET, {
        expiresIn: ms(env.JWT_ACCESS_TOKEN_EXPIRY),
    });

    const refreshToken = jwt.sign({ userId: user.id, sessionId }, env.JWT_REFRESH_SECRET, {
        expiresIn: ms(env.JWT_REFRESH_TOKEN_EXPIRY),
    });

    return { accessToken, refreshToken };
}

const register = async ({ username, email, password }) => {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
        throw new ApiError(409, "User already exists");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const user = await createUser(username, email, passwordHash);

    return { user };
};

const login = async ({ email, password, userAgent, ipAddress }) => {
    const user = await findUserByEmail(email);

    if (!user) {
        throw new ApiError(401, 'Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid credentials');
    }

    const sessionId = randomUUID();
    const { accessToken, refreshToken } = generateAccessAndRefreshToken({ user, sessionId });
    const refreshTokenHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    const expiresAt = new Date(Date.now() + ms(env.JWT_REFRESH_TOKEN_EXPIRY));

    await createSession({ id: sessionId, userId: user.id, refreshTokenHash, userAgent, ipAddress, expiresAt });

    return {
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
        },
        accessToken,
        refreshToken,
    };
};

const refresh = async ({ refreshToken }) => {
    let payload;

    try {
        payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    } catch {
        throw new ApiError(401, 'Invalid or expired refresh token');
    }

    const { sessionId, userId, role } = payload;

    const session = await findSession(sessionId);

    if (!session || session.user_id !== userId) {
        throw new ApiError(401, 'Session not found or expired');
    }

    const isValid = await bcrypt.compare(refreshToken, session.refresh_token_hash);

    if (!isValid) {
        throw new ApiError(401, 'Invalid refresh token');
    }

    const user = { id: userId, role: role };

    const { accessToken, refreshToken: newRefreshToken } = generateAccessAndRefreshToken({ user, sessionId });
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, SALT_ROUNDS);
    const newExpiresAt = new Date(Date.now() + ms(env.JWT_REFRESH_TOKEN_EXPIRY));

    const updated = await updateSessionToken(
        sessionId,
        newRefreshTokenHash,
        newExpiresAt
    );

    if (!updated) {
        throw new ApiError(500, 'Failed to update session');
    }

    return {
        accessToken,
        refreshToken: newRefreshToken,
    };
};

const logout = async ({ authenticatedUser, logoutAll, remSessionId }) => {
    let { sessionId, userId } = authenticatedUser;

    if (logoutAll) {
        return await deleteSessionByUserId(userId);
    }

    if (remSessionId !== null) {
        sessionId = remSessionId;
    }
    const session = await findSession(sessionId);


    if (!session || session.user_id !== userId) {
        throw new ApiError(401, 'Session not found or expired');
    }

    const deleted = await deleteSession(sessionId);

    if (!deleted) {
        throw new ApiError(404, 'Session not found');
    }

    return true;
};

const getCurrentUser = async ({ authenticatedUser, fullInfo }) => {
    if (!fullInfo)
        return {
            userId: authenticatedUser.userId,
            role: authenticatedUser.role,
            sessionId: authenticatedUser.sessionId,
        }

    const user = await findUserById(authenticatedUser.userId);

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    return user;
};

const changePassword = async ({ authenticatedUser, oldPassword, newPassword }) => {
    const user = await findUserById(authenticatedUser.userId);

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);

    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid credentials');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const updated = await updatePassword(user.id, newPasswordHash);

    if (!updated) {
        throw new ApiError(500, 'Failed to update password');
    }

    return true;
};

const getActiveSessions = async ({ userId }) => {
    const sessions = await findSessionByUserId(userId);

    return sessions;
};

const resendEmailVerificationService = async ({ authenticatedUser }) => {
    const user = await findUserById(authenticatedUser.userId);

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    if (user.is_verified) {
        throw new ApiError(400, 'Email already verified');
    }

    const verificationToken = generateToken();
    const verificationTokenExpiresAt = new Date(Date.now() + ms('10m'));

    console.log(verificationToken, verificationTokenExpiresAt);
    const updated = await setEmailVerificationToken(user.id, verificationToken, verificationTokenExpiresAt);

    if (!updated) {
        throw new ApiError(500, 'Failed to update email verification token');
    }

    const verificationLink = `${env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    await emailQueue.add('sendEmail', {
        to: user.email,
        subject: 'Verify Email',
        html: verifyEmailTemplate(verificationLink),
    });

    return true;
};

const verifyEmailService = async ({ userId, verificationToken }) => {
    if (!userId || !verificationToken) {
        throw new ApiError(400, 'User ID and verification token are required');
    }

    const emailToken = await findEmailVerificationToken(userId);

    if (!emailToken) {
        throw new ApiError(404, 'Email verification token not found or Expired');
    }

    console.log(emailToken.email_verification_token, verificationToken);

    if (emailToken.email_verification_token !== verificationToken) {
        throw new ApiError(401, 'Invalid email verification token');
    }

    const updated = await verifyEmail(userId);

    if (!updated) {
        throw new ApiError(500, 'Failed to verify email');
    }

    // const deleted = await deleteEmailVerificationToken(userId);

    // if (!deleted) {
    //     throw new ApiError(500, 'Failed to delete email verification token');
    // }

    return true;
};

const forgotPasswordService = async ({ email }) => {
    const user = await findUserByEmail(email);

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    const resetToken = generateToken();
    const resetTokenExpiresAt = new Date(Date.now() + ms('10m'));

    const updated = await setPasswordResetToken(user.id, resetToken, resetTokenExpiresAt);

    if (!updated) {
        throw new ApiError(500, 'Failed to update password reset token');
    }

    const resetLink = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await emailQueue.add('sendEmail', {
        to: user.email,
        subject: 'Reset Password',
        html: resetPasswordTemplate(resetLink),
    });

    return true;
};

const resetPasswordService = async ({ resetToken, newPassword }) => {
    const resetPasswordToken = await findResetPasswordToken(resetToken);

    if (!resetPasswordToken) {
        throw new ApiError(404, 'Reset password token not found or Expired');
    }

    if (resetPasswordToken.password_reset_token !== resetToken) {
        throw new ApiError(401, 'Invalid reset password token');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const updated = await resetForgotPassword(resetPasswordToken.user_id, newPasswordHash);

    if (!updated) {
        throw new ApiError(500, 'Failed to reset password');
    }

    // const deleted = await deleteResetPasswordToken(userId);

    // if (!deleted) {
    //     throw new ApiError(500, 'Failed to delete reset password token');
    // }

    return true;
};

export {
    register,
    login,
    refresh,
    logout,
    getCurrentUser,
    changePassword,
    getActiveSessions,
    resendEmailVerificationService,
    verifyEmailService,
    forgotPasswordService,
    resetPasswordService,
};