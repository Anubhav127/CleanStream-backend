import OpenAI from 'openai';
import env from '../../config/env.js';

const client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: env.OPENROUTER_API_KEY,
});

async function openaiTextModeration(text) {
    const response = await client.chat.completions.create({
        model: 'openai/gpt-4.1-nano',
        response_format: { type: 'json_object' },
        messages: [
            {
                role: 'system',
                content: `You are a content moderation system. Analyze the given text and return a JSON object with exactly this structure:
{
  "flagged": boolean,
  "categories": {
    "harassment": boolean,
    "harassment/threatening": boolean,
    "hate": boolean,
    "hate/threatening": boolean,
    "self-harm": boolean,
    "self-harm/intent": boolean,
    "self-harm/instructions": boolean,
    "sexual": boolean,
    "sexual/minors": boolean,
    "violence": boolean,
    "violence/graphic": boolean
  },
  "category_scores": {
    "harassment": number (0-1),
    "harassment/threatening": number (0-1),
    "hate": number (0-1),
    "hate/threatening": number (0-1),
    "self-harm": number (0-1),
    "self-harm/intent": number (0-1),
    "self-harm/instructions": number (0-1),
    "sexual": number (0-1),
    "sexual/minors": number (0-1),
    "violence": number (0-1),
    "violence/graphic": number (0-1)
  }
}
Set "flagged" to true if any category is detected. Be strict and accurate.`,
            },
            {
                role: 'user',
                content: text,
            },
        ],
    });

    const result = JSON.parse(response.choices[0].message.content);
    const maxScore = Math.max(...Object.values(result.category_scores));

    return {
        score: maxScore,
        flagged: result.flagged,
        categories: result.categories,
    };
}

export { openaiTextModeration };