import { Router } from "express";
import { getFlaggedPostsController, resolveFlagController, getModerationStatsController, getAuditLogsController } from "./moderator.controller.js";
import authMiddleware from "../../shared/middleware/authMiddleware.js";
import authorizeRoles from "../../shared/middleware/authorizeRoles.js";

const router = Router();

router.route('/flagged-posts').get(authMiddleware, authorizeRoles(["MODERATOR", "ADMIN"]), getFlaggedPostsController);
router.route('/flagged-posts/:postId/:action').patch(authMiddleware, authorizeRoles(["MODERATOR", "ADMIN"]), resolveFlagController);
router.route('/stats').get(authMiddleware, authorizeRoles(["MODERATOR", "ADMIN"]), getModerationStatsController);
router.route('/audit-logs').get(authMiddleware, authorizeRoles(["MODERATOR", "ADMIN"]), getAuditLogsController);

export default router;