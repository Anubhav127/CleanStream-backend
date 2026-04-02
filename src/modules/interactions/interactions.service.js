import { ApiError } from "../../shared/responses/apiError.js";
import { likePost, unlikePost, getPostLikesCount, hasUserLiked } from "./interactions.repository.js";

const toggleLikeService = async (postId, userId) => {
    if (!postId || !userId) {
        throw new ApiError(400, 'Post ID and User ID are required')
    }

    const liked = await hasUserLiked(postId, userId);

    if (liked) {
        await unlikePost(postId, userId);
        return { liked: false };
    } else {
        await likePost(postId, userId);
        return { liked: true };
    }
}

const getPostLikesCountService = async (postId) => {
    if (!postId) {
        throw new ApiError(400, 'Post ID is required')
    }

    return await getPostLikesCount(postId);
};

const hasUserLikedService = async (postId, userId) => {
    if (!postId || !userId) {
        throw new ApiError(400, 'Post ID and User ID are required')
    }

    return await hasUserLiked(postId, userId);
};

export { toggleLikeService, getPostLikesCountService, hasUserLikedService };