import { z } from "zod";

const createPostSchema = z.object({
    text: z.string().optional(),
    media: z.any().optional(),
});

export {
    createPostSchema
}