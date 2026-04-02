import { ApiError } from "../responses/apiError.js";

const handleDbError = (err) => {
    // Unique constraint violation
    if (err.code === '23505') {
        throw new ApiError(409, 'Resource already exists', err.detail);
    }

    // Fallback (don't leak DB internals)
    throw new ApiError(500, 'Database operation failed', err.detail);
};

export { handleDbError };