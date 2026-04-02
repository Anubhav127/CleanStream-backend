export function decideModeration(textRes, imageRes) {
    const score = Math.max(
        textRes?.score || 0,
        imageRes?.score || 0
    );

    if (score > 0.8) {
        return {
            decision: 'REJECTED',
            reason: 'high_risk',
            createFlag: false
        };
    }

    if (score > 0.5) {
        return {
            decision: 'FLAGGED',
            reason: 'medium_risk',
            createFlag: true
        };
    }

    return {
        decision: 'APPROVED',
        reason: 'clean',
        createFlag: false
    };
}