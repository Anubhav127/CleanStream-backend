import { query } from "../../shared/db/query.js";

const updateUsersRole = async (userId, role) => {
    try {
        const { rows } = await query(
            `UPDATE users SET role = $2 WHERE id = $1 RETURNING *`,
            [userId, role]
        );
        return rows[0];
    } catch (error) {
        throw error;
    }
};

const getAllUsers = async () => {
    const { rows } = await query(
        `SELECT * FROM users`
    );
    return rows;
};

const deleteUser = async (userId) => {
    const { rows } = await query(
        `DELETE FROM users WHERE id = $1 RETURNING *`,
        [userId]
    );
    return rows[0];
};

export {
    updateUsersRole,
    getAllUsers,
    deleteUser
};