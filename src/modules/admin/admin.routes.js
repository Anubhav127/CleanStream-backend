import { Router } from 'express';
import { updateUsersRoleController, getAllUsersController, deleteUserController } from './admin.controller.js';
import authMiddleware from '../../shared/middleware/authMiddleware.js';
import authorizeRoles from '../../shared/middleware/authorizeRoles.js';

const router = Router();

router.route('/update-role').patch(authMiddleware, authorizeRoles(['ADMIN']), updateUsersRoleController);
router.route('/get-all-users').get(authMiddleware, authorizeRoles(['ADMIN']), getAllUsersController);
router.route('/delete-user/:userId').delete(authMiddleware, authorizeRoles(['ADMIN']), deleteUserController);

export default router;