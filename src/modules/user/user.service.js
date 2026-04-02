import { ApiError } from "../../shared/responses/apiError.js";
import { getUserInfo } from "./user.repository.js";

const getUserInfoService = async (userId) => {
    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const user = await getUserInfo(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return user;
};

export {
    getUserInfoService
};