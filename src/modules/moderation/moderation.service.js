import { moderateText } from './textModerator.js';
import { moderateImage } from './imageModerator.js';
import { decideModeration } from './decisionEngine.js';
import { withTransaction } from '../../shared/db/transaction.js';

export async function runModeration({ postId, text, mediaUrl, userId }) {
  return withTransaction(async (client) => {
    // 1. Run moderation (skip if content type is absent)
    const textRes = text ? await moderateText(text) : null;
    const mediaRes = mediaUrl ? await moderateImage(mediaUrl) : null;

    // 2. Decision
    const result = decideModeration(textRes, mediaRes);

    // 3. Map scores properly
    const toxicityScore = textRes?.score || 0;
    const nsfwScore = mediaRes?.score || 0;
    const misinfoScore = (text === null || text === "") ? 0.0 : 0.1;

    const labels = JSON.stringify({
      text: textRes?.meta || null,
      media: mediaRes?.meta || null
    });

    // 4. Insert moderation result
    await client.query(`
            INSERT INTO moderation_results 
            (post_id, toxicity_score, nsfw_score, misinfo_score, labels, model_version)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [
      postId,
      toxicityScore,
      nsfwScore,
      misinfoScore,
      labels,
      'openai-v1'
    ]);

    // 5. Flags
    if (result.createFlag) {
      await client.query(`
                INSERT INTO flags (post_id, reason, source, confidence)
                VALUES ($1, $2, $3, $4)
            `, [
        postId,
        result.reason,
        'ML',
        Math.max(toxicityScore, nsfwScore)
      ]);
    }

    // 6. Audit log
    await client.query(`
            INSERT INTO audit_logs (post_id, action, performed_by)
            VALUES ($1, $2, $3)
        `, [
      postId,
      `MODERATION_${result.decision}`,
      userId
    ]);

    // 7. Update post
    await client.query(`
            UPDATE posts 
            SET status = $1 
            WHERE id = $2
        `, [result.decision, postId]);

    return result;
  });
}