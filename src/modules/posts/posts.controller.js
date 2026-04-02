import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { ApiError } from "../../shared/responses/apiError.js";
import { ApiResponse } from "../../shared/responses/apiResponse.js";
import { createPostService, getAllUsersPostsService, deletePostService } from "./posts.service.js";


const createPostController = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const text = req.body?.text?.trim() || null;
    const localFilePath = req.file?.path || null;

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    if (!text && !localFilePath) {
        throw new ApiError(400, "Post must contain text, an image, or both");
    }

    const post = await createPostService({ userId, text, localFilePath });
    return res.status(201).json(new ApiResponse(201, post, "Post created successfully"));
});

const getAllUsersPostsController = asyncHandler(async (req, res) => {
    const userId = req.params?.userId;

    const posts = await getAllUsersPostsService({ userId });
    return res.status(200).json(new ApiResponse(200, posts, "Posts fetched successfully"));
});

const deletePostController = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const postId = req.params?.postId;

    const post = await deletePostService({ userId, postId });
    return res.status(200).json(new ApiResponse(200, post, "Post deleted successfully"));
});

export {
    createPostController,
    getAllUsersPostsController,
    deletePostController
}