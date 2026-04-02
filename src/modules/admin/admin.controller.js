import { updateUsersRoleService, getAllUsersService, deleteUserService } from "./admin.service.js";
import { ApiResponse } from "../../shared/responses/apiResponse.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";

const updateUsersRoleController = asyncHandler(async (req, res) => {
    const { userId, role } = req.body;
    const updatedUser = await updateUsersRoleService({ userId, role });
    res.status(200).json(new ApiResponse(200, updatedUser, "User role updated successfully"));
});

const getAllUsersController = asyncHandler(async (req, res) => {
    const users = await getAllUsersService();
    res.status(200).json(new ApiResponse(200, users, "Users fetched successfully"));
});

const deleteUserController = asyncHandler(async (req, res) => {
    const userId = req.params.userId;
    const deletedUser = await deleteUserService(userId);
    res.status(200).json(new ApiResponse(200, deletedUser, "User deleted successfully"));
});

export {
    updateUsersRoleController,
    getAllUsersController,
    deleteUserController
};