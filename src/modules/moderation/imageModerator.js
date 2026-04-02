import { getImageModerator } from '../../shared/providers/providersFactory.js';

export async function moderateImage(imageUrl) {
    if (imageUrl === null) {
        return {
            score: 0.50,
            flagged: true,
            meta: null
        }
    }
    const provider = getImageModerator();

    const result = await provider(imageUrl);

    return {
        score: result.score,
        flagged: result.flagged,
        meta: result.labels || null
    };
}