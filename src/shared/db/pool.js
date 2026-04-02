import { Pool } from "pg";
import env from "../config/env.js";

const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
    family: 4
});

export { pool };