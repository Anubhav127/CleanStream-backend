import { query } from "../../shared/db/query.js";

const getFeedPosts = async (userId, limit = 10) => {
    const { rows } = await query(
        `SELECT
            p.*,
            u.username,
            COUNT(pl.id) AS like_count,
            EXISTS (
                SELECT 1 
                FROM post_likes 
                WHERE post_id = p.id AND user_id = $1
            ) AS liked_by_user
        FROM posts p
        LEFT JOIN users u ON u.id = p.user_id
        LEFT JOIN post_likes pl ON pl.post_id = p.id
        WHERE p.status = 'APPROVED'
        GROUP BY p.id, u.username
        ORDER BY p.created_at DESC
        LIMIT $2;`,
        [userId, limit]
    );

    return rows;
}

export {
    getFeedPosts
}