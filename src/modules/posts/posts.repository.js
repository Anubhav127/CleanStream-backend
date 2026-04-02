import { query } from '../../shared/db/query.js';
import { handleDbError } from '../../shared/db/dbErrorMapper.js';

const createPost = async (userId, text, media_url) => {
    try {
        const { rows } = await query(
            `INSERT INTO posts (user_id, text, media_url)
            VALUES ($1, $2, $3)
            RETURNING id, user_id, text, media_url, created_at`,
            [userId, text, media_url]
        );

        return rows[0] || null;
    } catch (err) {
        handleDbError(err);
    }
};

const getPostById = async (postId) => {
    const { rows } = await query(
        `SELECT * FROM posts WHERE id = $1`, [postId]
    );

    return rows[0] || null;
};

const updatePostStatus = async (postId, status) => {
    try {
        const { rows } = await query(
            `UPDATE posts SET status = $1 WHERE id = $2
            RETURNING id, user_id, text, media_url, status, updated_at`,
            [status, postId]
        );

        return rows[0] || null;
    } catch (err) {
        handleDbError(err);
    }
};

const deletePost = async (postId) => {
    const { rowCount } = await query(
        `DELETE FROM posts WHERE id = $1`, [postId]
    );

    return rowCount > 0;
};

const getAllUsersPosts = async (userId) => {
    const { rows } = await query(
        `SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
    );

    return rows || [];
}


export {
    createPost,
    getPostById,
    updatePostStatus,
    deletePost,
    getAllUsersPosts
};