import { Router } from 'express';
import { toggleLikeController, getPostLikesCountController, hasUserLikedController } from './interactions.controller.js';
import authMiddleware from '../../shared/middleware/authMiddleware.js';

const router = Router();

router.route('/toggle-like/:postId').post(authMiddleware, toggleLikeController);
router.route('/likes/:postId').get(authMiddleware, getPostLikesCountController);
router.route('/liked/:postId').get(authMiddleware, hasUserLikedController);

export default router;