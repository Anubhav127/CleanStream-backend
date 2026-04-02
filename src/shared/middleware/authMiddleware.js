import jwt from 'jsonwebtoken';
import { ApiError } from '../responses/apiError.js';
import env from '../config/env.js';
import { query } from '../db/query.js';

const authMiddleware = async (req, res, next) => {
    const accessToken = req.cookies?.accessToken || req.headers['authorization']?.split(' ')[1];

    try {
        const payload = jwt.verify(accessToken, env.JWT_ACCESS_SECRET);

        // Verify the session still exists in the DB (handles remote logout)
        const { rows } = await query(
            `SELECT id FROM sessions WHERE id = $1 AND expires_at > NOW() LIMIT 1`,
            [payload.sessionId]
        );

        if (rows.length === 0) {
            throw new ApiError(401, 'Session has been revoked');
        }

        req.user = {
            userId: payload.userId,
            role: payload.role,
            sessionId: payload.sessionId,
        };

        next();
    } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new ApiError(401, 'Invalid or expired token');
    }
};

export default authMiddleware;