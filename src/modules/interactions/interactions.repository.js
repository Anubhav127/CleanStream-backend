// export async function likePost(db, postId, userId) {}
// export async function unlikePost(db, postId, userId) {}
// export async function getPostLikesCount(db, postId) {}
// export async function hasUserLiked(db, postId, userId) {}

import { query } from '../../shared/db/query.js';
import { handleDbError } from '../../shared/db/dbErrorMapper.js';

const likePost = async (postId, userId) => {
    try {
        const { rows } = await query(
            `INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2) RETURNING *`,
            [postId, userId]
        );
        return rows[0];
    } catch (error) {
        handleDbError(error);
    }
};

const unlikePost = async (postId, userId) => {
    const { rowCount } = await query(
        `DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2`,
        [postId, userId]
    );
    return rowCount;
};

const getPostLikesCount = async (postId) => {
    const { rows } = await query(
        `SELECT COUNT(*) as count FROM post_likes WHERE post_id = $1`,
        [postId]
    );
    return rows[0].count;
};

const hasUserLiked = async (postId, userId) => {
    const { rows } = await query(
        `SELECT EXISTS (SELECT 1 FROM post_likes WHERE post_id = $1 AND user_id = $2)`,
        [postId, userId]
    );
    return rows[0].exists;
};

export { likePost, unlikePost, getPostLikesCount, hasUserLiked };