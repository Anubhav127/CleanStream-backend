import { ApiResponse } from "../../shared/responses/apiResponse.js";
import { toggleLikeService, getPostLikesCountService, hasUserLikedService } from "./interactions.service.js";


const toggleLikeController = async (req, res) => {
    const userId = req.user.userId;
    const { postId } = req.params;

    const result = await toggleLikeService(postId, userId);

    return res.status(200).json(new ApiResponse(200, result, 'Post liked successfully'))
}

const getPostLikesCountController = async (req, res) => {
    const { postId } = req.params;

    const result = await getPostLikesCountService(postId);

    return res.status(200).json(new ApiResponse(200, result, 'Post likes count fetched successfully'))
};

const hasUserLikedController = async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.userId;

    const result = await hasUserLikedService(postId, userId);

    return res.status(200).json(new ApiResponse(200, result, 'User liked status fetched successfully'))
};

export { toggleLikeController, getPostLikesCountController, hasUserLikedController };