import { handleDbError } from "../../shared/db/dbErrorMapper.js";
import { query } from "../../shared/db/query.js";
import { withTransaction } from "../../shared/db/transaction.js";
import { ApiError } from "../../shared/responses/apiError.js";
import { safeParse } from "../../shared/utils/safeParse.js";

const getFlaggedPosts = async () => {

    // 1. Fetch flagged posts + moderation details
    const { rows: flaggedPosts } = await query(`
        SELECT 
            f.post_id,
            f.reason,
            f.created_at AS flagged_at,
            f.confidence,
            
            p.text,
            p.media_url,
            p.user_id,
            p.status,

            mr.toxicity_score,
            mr.nsfw_score,
            mr.misinfo_score,
            mr.labels,
            mr.model_version

        FROM flags f
        JOIN posts p ON p.id = f.post_id
        LEFT JOIN moderation_results mr ON mr.post_id = p.id

        ORDER BY f.created_at DESC;
    `);


    // 2. Summary stats (single query, no nonsense)
    const { rows: summaryRows } = await query(`
        SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE status = 'PENDING') AS pending,
            COUNT(*) FILTER (WHERE status = 'APPROVED') AS approved,
            COUNT(*) FILTER (WHERE status = 'FLAGGED') AS flagged,
            COUNT(*) FILTER (WHERE status = 'REJECTED') AS rejected
        FROM posts;
    `);

    const summary = summaryRows[0];

    return {
        summary: {
            total: Number(summary.total),
            pending: Number(summary.pending),
            approved: Number(summary.approved),
            flagged: Number(summary.flagged),
            rejected: Number(summary.rejected),
        },
        posts: flaggedPosts.map(post => ({
            ...post,
            labels: safeParse(post.labels)
        }))
    };
};

const resolveFlag = async (postId, moderatorId, action) => {
    try {
        const rows = await withTransaction(async (client) => {
            const { rowCount } = await client.query(`DELETE FROM flags WHERE post_id = $1 RETURNING *; `, [postId]);
            if (rowCount === 0) {
                throw new ApiError(404, "Flag not found");
            }

            const { rows } = await client.query(
                `UPDATE posts SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *;`,
                [action, postId]
            );

            if (rows.length === 0) {
                throw new ApiError(404, "Post not found");
            }

            await client.query(`INSERT INTO audit_logs (post_id, action, performed_by) VALUES ($1, $2, $3);`, [postId, action, moderatorId]);


            return rows;
        });

        return rows[0] || null;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        handleDbError(error);
    }
};

const getModerationStats = async () => {
    const { rows: summaryRows } = await query(`
        SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE status = 'PENDING') AS pending,
            COUNT(*) FILTER (WHERE status = 'APPROVED') AS approved,
            COUNT(*) FILTER (WHERE status = 'FLAGGED') AS flagged,
            COUNT(*) FILTER (WHERE status = 'REJECTED') AS rejected
        FROM posts;
    `);

    const summary = summaryRows[0];

    return {
        summary: {
            total: Number(summary.total),
            pending: Number(summary.pending),
            approved: Number(summary.approved),
            flagged: Number(summary.flagged),
            rejected: Number(summary.rejected),
        },
    }
};

const getAuditLogs = async () => {
    const { rows } = await query(`SELECT * FROM audit_logs ORDER BY created_at DESC;`);
    return rows;
};

export { getFlaggedPosts, resolveFlag, getModerationStats, getAuditLogs };