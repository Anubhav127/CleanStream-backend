import { ApiResponse } from "../../shared/responses/apiResponse.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { getFlaggedPostsService, resolveFlagService, getModerationStatsService, getAuditLogsService } from "./moderator.service.js";

const getFlaggedPostsController = asyncHandler(async (req, res) => {
    const flaggedPosts = await getFlaggedPostsService();
    return res.status(200).json(new ApiResponse(200, flaggedPosts, "Flagged posts fetched successfully"));
});

const resolveFlagController = asyncHandler(async (req, res) => {
    const { postId, action } = req.params;
    const moderatorId = req.user.userId;
    const resolvedPost = await resolveFlagService(postId, moderatorId, action);
    return res.status(200).json(new ApiResponse(200, resolvedPost, "Flag resolved successfully"));
});

const getModerationStatsController = asyncHandler(async (req, res) => {
    const stats = await getModerationStatsService();
    return res.status(200).json(new ApiResponse(200, stats, "Moderation stats fetched successfully"));
});

const getAuditLogsController = asyncHandler(async (req, res) => {
    const auditLogs = await getAuditLogsService();
    return res.status(200).json(new ApiResponse(200, auditLogs, "Audit logs fetched successfully"));
});

export { getFlaggedPostsController, resolveFlagController, getModerationStatsController, getAuditLogsController };