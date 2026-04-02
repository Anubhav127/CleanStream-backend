import crypto from 'crypto';

export const generateToken = () => {
    const hash = crypto.randomBytes(32);

    const hashToken = crypto.createHash('sha256').update(hash).digest('hex');

    return hashToken;
};
