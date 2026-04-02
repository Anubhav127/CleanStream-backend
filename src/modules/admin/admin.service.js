import { updateUsersRole, getAllUsers, deleteUser } from "./admin.repository.js";
import { ApiError } from "../../shared/responses/apiError.js";
import { withTransaction } from "../../shared/db/transaction.js";
import { deleteSessionByUserId } from "../auth/auth.repository.js";

const updateUsersRoleService = async ({ userId, role }) => {
    if (!userId || !role) {
        throw new ApiError(400, "User ID and role are required");
    }

    return await withTransaction(async (client) => {
        await deleteSessionByUserId(userId, client);
        return await updateUsersRole(userId, role, client);
    });
};

const getAllUsersService = async () => {
    return await getAllUsers();
};

const deleteUserService = async (userId) => {
    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }
    return await deleteUser(userId);

};

export {
    updateUsersRoleService,
    getAllUsersService,
    deleteUserService
};