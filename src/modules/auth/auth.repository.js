import { query } from '../../shared/db/query.js';
import { handleDbError } from '../../shared/db/dbErrorMapper.js';

const findUserByEmail = async (email) => {
    const { rows } = await query(
        `SELECT id, username, email, password_hash, role, created_at
     FROM users
     WHERE email = $1
     LIMIT 1`,
        [email]
    );

    return rows[0] || null;
};

const createUser = async (username, email, passwordHash) => {
    try {
        const { rows } = await query(
            `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, role, created_at`,
            [username, email, passwordHash]
        );

        return rows[0];
    } catch (err) {
        handleDbError(err);
    }
};

const createSession = async ({ id, userId, refreshTokenHash, userAgent, ipAddress, expiresAt }) => {
    try {
        const { rows } = await query(
            `INSERT INTO sessions 
       (id, user_id, refresh_token_hash, user_agent, ip_address, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, expires_at, created_at`,
            [id, userId, refreshTokenHash, userAgent, ipAddress, expiresAt]
        );

        return rows[0];
    } catch (err) {
        handleDbError(err);
    }
};

const findSession = async (sessionId) => {
    const { rows } = await query(
        `SELECT s.id, s.user_id, s.refresh_token_hash, s.expires_at, s.created_at,
            u.email, u.role
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = $1
       AND s.expires_at > NOW()
     LIMIT 1`,
        [sessionId]
    );

    return rows[0] || null;
};

const deleteSession = async (sessionId) => {
    const { rowCount } = await query(
        `DELETE FROM sessions WHERE id = $1`,
        [sessionId]
    );

    return rowCount > 0;
};

const createUserWithClient = async (client, email, passwordHash) => {
    try {
        const { rows } = await client.query(
            `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, role, created_at`,
            [email, passwordHash]
        );

        return rows[0];
    } catch (err) {
        handleDbError(err);
    }
};

const createSessionWithClient = async (
    client,
    { userId, refreshTokenHash, userAgent, ipAddress, expiresAt }
) => {
    try {
        const { rows } = await client.query(
            `INSERT INTO sessions 
       (user_id, refresh_token_hash, user_agent, ip_address, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, expires_at, created_at`,
            [userId, refreshTokenHash, userAgent, ipAddress, expiresAt]
        );

        return rows[0];
    } catch (err) {
        handleDbError(err);
    }
};

const updateSessionToken = async (sessionId, refreshTokenHash, expiresAt) => {
    try {
        const { rowCount } = await query(
            `UPDATE sessions
         SET refresh_token_hash = $1,
             expires_at = $2
         WHERE id = $3`,
            [refreshTokenHash, expiresAt, sessionId]
        );

        return rowCount > 0;
    } catch (err) {
        handleDbError(err);
    }
};

const findUserById = async (userId) => {
    const { rows } = await query(
        `SELECT id, username, email, password_hash, role FROM users WHERE id = $1 LIMIT 1`,
        [userId]
    );

    return rows[0] || null;
};

const findSessionByUserId = async (userId) => {
    const { rows } = await query(
        `SELECT id, user_agent, ip_address FROM sessions WHERE user_id = $1 AND expires_at > NOW()`,
        [userId]
    );

    return rows;
};

const deleteSessionByUserId = async (userId) => {
    const { rowCount } = await query(
        `DELETE FROM sessions WHERE user_id = $1`,
        [userId]
    );

    return rowCount > 0;
};

const updatePassword = async (userId, passwordHash) => {
    try {
        const { rows } = await query(
            `UPDATE users
         SET password_hash = $1
         WHERE id = $2
         RETURNING id, email, role, updated_at`,
            [passwordHash, userId]
        );

        return rows[0] || null;
    } catch (err) {
        handleDbError(err);
    }
};

const setEmailVerificationToken = async (userId, verificationToken, verificationTokenExpiresAt) => {
    try {
        const { rows } = await query(
            `INSERT INTO email_token (user_id, email_verification_token, email_verification_expiry)
            VALUES ($1, $2, $3)
            RETURNING id, user_id, email_verification_token, email_verification_expiry`,
            [userId, verificationToken, verificationTokenExpiresAt]
        );
        return rows[0] || null;
    } catch (err) {
        handleDbError(err);
    }
};

const findEmailVerificationToken = async (userId) => {
    const { rows } = await query(
        `SELECT email_verification_token FROM email_token WHERE user_id = $1 AND email_verification_expiry > NOW() ORDER BY created_at DESC LIMIT 1`,
        [userId]
    );
    return rows[0] || null;
};

const deleteEmailVerificationToken = async (userId) => {
    const { rowCount } = await query(
        `DELETE FROM email_token WHERE user_id = $1`,
        [userId]
    );
    return rowCount > 0;
};

const verifyEmail = async (userId) => {
    try {
        const { rows } = await query(
            `UPDATE users
         SET is_verified = true
         WHERE id = $1
         RETURNING id, email, role, updated_at`,
            [userId]
        );
        return rows[0] || null;
    } catch (err) {
        handleDbError(err);
    }
};

const setPasswordResetToken = async (userId, resetToken, resetTokenExpiresAt) => {
    try {
        const { rows } = await query(
            `INSERT INTO email_token (user_id, password_reset_token, password_reset_expiry)
            VALUES ($1, $2, $3)
            RETURNING id, user_id, password_reset_token, password_reset_expiry`,
            [userId, resetToken, resetTokenExpiresAt]
        );
        return rows[0] || null;
    } catch (err) {
        handleDbError(err);
    }
};

const findResetPasswordToken = async (resetToken) => {
    const { rows } = await query(
        `SELECT password_reset_token, user_id FROM email_token WHERE password_reset_token = $1 AND password_reset_expiry > NOW() ORDER BY created_at DESC LIMIT 1`,
        [resetToken]
    );
    return rows[0] || null;
};

const resetForgotPassword = async (userId, newPasswordHash) => {
    try {
        const { rows } = await query(
            `UPDATE users
         SET password_hash = $1
         WHERE id = $2
         RETURNING id, email, role, updated_at`,
            [newPasswordHash, userId]
        );
        return rows[0] || null;
    } catch (err) {
        handleDbError(err);
    }
};

export {
    findUserByEmail,
    createUser,
    createSession,
    findSession,
    deleteSession,
    createUserWithClient,
    createSessionWithClient,
    updateSessionToken,
    findUserById,
    findSessionByUserId,
    deleteSessionByUserId,
    updatePassword,
    setEmailVerificationToken,
    findEmailVerificationToken,
    verifyEmail,
    deleteEmailVerificationToken,
    setPasswordResetToken,
    findResetPasswordToken,
    resetForgotPassword,
};