import { Router } from 'express';
import authMiddleware from '../../shared/middleware/authMiddleware.js';
import { getUserInfoController } from './user.controller.js';

const router = Router();

router.route('/:userId').get(authMiddleware, getUserInfoController);

export default router;