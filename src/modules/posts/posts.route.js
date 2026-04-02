import { Router } from "express";
import { createPostController, getAllUsersPostsController, deletePostController } from "./posts.controller.js";
import upload from "../../shared/middleware/upload.js";
import authMiddleware from "../../shared/middleware/authMiddleware.js";
import validate from "../../shared/middleware/validate.js";
import { createPostSchema } from "./posts.validation.js";


const router = Router();

router.route('/create-post').post(authMiddleware, upload.single('media'), validate(createPostSchema), createPostController);
router.route('/users/:userId').get(authMiddleware, getAllUsersPostsController);
router.route('/:postId').delete(authMiddleware, deletePostController);

export default router;