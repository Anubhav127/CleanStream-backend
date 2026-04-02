import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { ApiResponse } from "../../shared/responses/apiResponse.js";
import { ApiError } from "../../shared/responses/apiError.js";
import { getUserInfoService } from "./user.service.js";

const getUserInfoController = asyncHandler(async (req, res) => {
    const userId = req.params?.userId;

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const user = await getUserInfoService(userId);
    return res.status(200).json(new ApiResponse(200, user, "User info fetched successfully"));
});

export {
    getUserInfoController
}