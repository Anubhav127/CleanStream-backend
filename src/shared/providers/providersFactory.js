import { openaiTextModeration } from './text/openai.provider.js';
import { mockTextModeration } from './text/mock.provider.js';

import { moderateImageWithSightengine } from './image/sightengine.provider.js';
import { mockImageModeration } from './image/mock.provider.js';

import env from '../config/env.js';

export function getTextModerator() {
    if (env.MODERATION_PROVIDER === 'openai') {
        return openaiTextModeration;
    }
    return mockTextModeration;
}

export function getImageModerator() {
    if (env.IMAGE_PROVIDER === 'sightengine') {
        return moderateImageWithSightengine;
    }
    return mockImageModeration;
}