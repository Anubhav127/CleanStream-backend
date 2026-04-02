import { query } from "../../shared/db/query.js";

const getUserInfo = async (userId) => {
    const { rows } = await query(
        `SELECT username, email, role, is_verified, created_at FROM users WHERE id = $1`,
        [userId]
    );
    return rows[0];
}

export {
    getUserInfo
}