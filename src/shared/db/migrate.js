// src/shared/db/migrate.js
import fs from 'fs';
import path from 'path';
import { pool } from './pool.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.join(__dirname, 'migrations');

const runMigrations = async () => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Create migrations table if not exists
        await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE,
        executed_at TIMESTAMP DEFAULT NOW()
      );
    `);

        const files = fs.readdirSync(migrationsDir).sort();

        for (const file of files) {
            const res = await client.query(
                'SELECT 1 FROM migrations WHERE filename = $1',
                [file]
            );

            if (res.rowCount > 0) {
                console.log(`Skipping ${file}`);
                continue;
            }

            console.log(`Running ${file}`);

            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf-8');

            await client.query(sql);

            await client.query(
                'INSERT INTO migrations (filename) VALUES ($1)',
                [file]
            );
        }

        await client.query('COMMIT');
        console.log('Migrations completed');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed', err);
    } finally {
        client.release();
    }
};

runMigrations();