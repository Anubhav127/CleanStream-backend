import { getFeedPosts } from "./feed.repository.js";

const getFeedPostsService = async (userId, limit) => {
    const posts = await getFeedPosts(userId, limit);

    return posts;
}

export {
    getFeedPostsService
}