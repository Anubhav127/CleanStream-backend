import express, { urlencoded } from 'express';
import requestLogger from './shared/logger/requestLogger.js';
import errorHandler from './shared/middleware/errorHandler.js';
import helmet from 'helmet';
import cors from 'cors';
import { apiLimiter } from './shared/middleware/rateLimiter.js';
import { ApiResponse } from './shared/responses/apiResponse.js';
import cookieParser from 'cookie-parser';

import authRoutes from './modules/auth/auth.routes.js';
import postRoutes from './modules/posts/posts.route.js';
import moderatorRoutes from './modules/moderator/moderator.routes.js';
import feedRoutes from './modules/feed/feed.routes.js';
import interactionRoutes from './modules/interactions/interactions.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import userRoutes from './modules/user/user.routes.js';


const app = express();

app.use(helmet());
app.use(cors({
    origin: "https://clean-stream-frontend.vercel.app",
    credentials: true,
}));

// app.use(apiLimiter);

app.use(express.json());
app.use(urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestLogger);

app.get('/api/v1/health', (req, res) => {
    return res.json(new ApiResponse(200, {}, 'Server is running'));
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/moderator', moderatorRoutes);
app.use('/api/v1/feed', feedRoutes);
app.use('/api/v1/interactions', interactionRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/users', userRoutes);


app.use(errorHandler);

export default app;
