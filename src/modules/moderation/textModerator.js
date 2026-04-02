import { getTextModerator } from '../../shared/providers/providersFactory.js';

export async function moderateText(text) {
    const provider = getTextModerator();

    const result = await provider(text);

    return {
        score: result.score,
        flagged: result.flagged,
        reason: result.flagged ? 'ai_flagged' : 'clean',
        meta: result.categories || null
    };
}