import { ApiError } from "../responses/apiError.js";

const authorizeRoles = (role) => {
    return (req, res, next) => {
        if (!role.includes(req.user.role)) {
            throw new ApiError(403, 'Unauthorized');
        }
        next();
    }
}

export default authorizeRoles;