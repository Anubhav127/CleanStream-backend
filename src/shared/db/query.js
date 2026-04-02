import { pool } from "./pool.js";

const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;

        console.log('query executed', { text, duration });

        return res;
    } catch (err) {
        console.error('query error', err);
        throw err;
    }
};

export { query };