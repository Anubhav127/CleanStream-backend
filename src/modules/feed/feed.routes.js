import { Router } from "express";
import { getFeedPostsController } from "./feed.controller.js";
import authMiddleware from "../../shared/middleware/authMiddleware.js";

const router = Router();

router.route("/").get(authMiddleware, getFeedPostsController);

export default router;