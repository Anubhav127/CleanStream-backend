import { getFlaggedPosts, resolveFlag, getModerationStats, getAuditLogs } from "./moderator.repository.js";

const getFlaggedPostsService = async () => {
    return await getFlaggedPosts();
};

const resolveFlagService = async (postId, moderatorId, action) => {

    const validActions = ["APPROVED", "REJECTED"];
    if (!validActions.includes(action)) {
        throw new ApiError(400, "Invalid action");
    }

    return await resolveFlag(postId, moderatorId, action);
};

const getModerationStatsService = async () => {
    return await getModerationStats();
};

const getAuditLogsService = async () => {
    return await getAuditLogs();
};
export { getFlaggedPostsService, resolveFlagService, getModerationStatsService, getAuditLogsService };