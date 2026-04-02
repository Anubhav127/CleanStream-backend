import { updateUsersRole, getAllUsers, deleteUser } from "./admin.repository.js";
import { ApiError } from "../../shared/responses/apiError.js";

const updateUsersRoleService = async ({ userId, role }) => {
    if (!userId || !role) {
        throw new ApiError(400, "User ID and role are required");
    }

    return await updateUsersRole(userId, role);
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