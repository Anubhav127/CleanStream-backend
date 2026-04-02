import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';
import path from 'path';
import env from '../config/env.js';

cloudinary.config({
    cloud_name: env.CLOUDINARY_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
});

const removeLocalFile = async (filePath) => {
    try {
        await fs.access(filePath);
        await fs.unlink(filePath);
    } catch {
        // file already deleted or doesn't exist — ignore
    }
};

export const uploadToCloudinary = async (filePath) => {
    const absolutePath = path.resolve(filePath);

    try {
        const result = await cloudinary.uploader.upload(absolutePath, {
            folder: 'posts',
        });

        await removeLocalFile(absolutePath);

        return result.secure_url;
    } catch (err) {
        await removeLocalFile(absolutePath);
        throw err;
    }
};