import { getFeedPostsService } from './feed.service.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { ApiResponse } from '../../shared/responses/apiResponse.js';

const getFeedPostsController = asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const { limit } = req.query;

    const posts = await getFeedPostsService(userId, limit);

    return res.status(200).json(new ApiResponse(200, posts, "Feed posts fetched successfully"))
})

export {
    getFeedPostsController
}