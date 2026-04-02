import { ApiError } from "../../shared/responses/apiError.js";
import { createPost, getAllUsersPosts, deletePost } from "./posts.repository.js";
import { uploadToCloudinary } from "../../shared/services/cloudinary.js";
import { moderationQueue } from "../../shared/queue/moderation.queue.js";

const createPostService = async ({ userId, text, localFilePath }) => {
    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    if (!text && !localFilePath) {
        throw new ApiError(400, "Post must contain text, an image, or both");
    }

    let mediaUrl = null;

    if (localFilePath) {
        mediaUrl = await uploadToCloudinary(localFilePath);
        if (!mediaUrl) {
            throw new ApiError(400, "Error occurred while uploading file");
        }
    }

    const post = await createPost(userId, text, mediaUrl);

    await moderationQueue.add('moderatePost', { post });

    return post;
};

const getAllUsersPostsService = async ({ userId }) => {
    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const posts = await getAllUsersPosts(userId);

    return posts;
};

const deletePostService = async ({ postId }) => {
    if (!postId) {
        throw new ApiError(400, "Post ID is required");
    }

    await deletePost(postId);

    return true;
}

export {
    createPostService,
    getAllUsersPostsService,
    deletePostService
}
