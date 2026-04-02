import axios from 'axios';

export async function moderateImageWithSightengine(imageUrl) {
    const response = await axios.get('https://api.sightengine.com/1.0/check.json', {
        params: {
            url: imageUrl,
            models: 'nudity-2.1,weapon,recreational_drug,medical,offensive-2.0,text-content,gore-2.0,qr-content,violence',
            api_user: process.env.SIGHTENGINE_USER,
            api_secret: process.env.SIGHTENGINE_SECRET
        }
    });

    const data = response.data;

    const scores = [];

    // Nudity (v2.1) — only flag the explicitly unsafe ones
    const nudity = data.nudity || {};
    const nudityScores = {
        sexual_activity: nudity.sexual_activity || 0,
        sexual_display: nudity.sexual_display || 0,
        erotica: nudity.erotica || 0,
        very_suggestive: nudity.very_suggestive || 0,
    };
    for (const [label, score] of Object.entries(nudityScores)) {
        scores.push({ category: 'nudity', label, score });
    }

    // Weapon
    const weaponClasses = data.weapon?.classes || {};
    for (const [label, score] of Object.entries(weaponClasses)) {
        scores.push({ category: 'weapon', label, score });
    }

    // Recreational drugs
    if (data.recreational_drug) {
        scores.push({ category: 'recreational_drug', label: 'drug', score: data.recreational_drug.prob || 0 });
    }

    // Gore
    if (data.gore) {
        scores.push({ category: 'gore', label: 'gore', score: data.gore.prob || 0 });
    }

    // Violence
    if (data.violence) {
        scores.push({ category: 'violence', label: 'violence', score: data.violence.prob || 0 });
    }

    // Offensive symbols
    const offensive = data.offensive || {};
    for (const [label, score] of Object.entries(offensive)) {
        scores.push({ category: 'offensive', label, score });
    }

    // Medical
    if (data.medical) {
        scores.push({ category: 'medical', label: 'medical', score: data.medical.prob || 0 });
    }

    const highest = scores.reduce(
        (max, curr) => (curr.score > max.score ? curr : max),
        { category: 'none', label: 'clean', score: 0 }
    );

    const flagged = highest.score > 0.5;

    return {
        score: highest.score,
        flagged,
        labels: {
            category: highest.category,
            label: highest.label,
            score: highest.score,
        }
    };
}