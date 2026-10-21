import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load local .env if present
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config(); // Also check current working directory

let pool = null;

export function getPool() {
    if (!pool) {
        pool = mysql.createPool({
            // Fallback to Hostinger production database if environment variables are not injected
            host: process.env.DB_HOST || 'srv1951.hstgr.io',
            port: Number(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER || 'u750566272_swami',
            password: process.env.DB_PASSWORD || 'SSSMotors@1998',
            database: process.env.DB_NAME || 'u750566272_swami',
            waitForConnections: true,
            connectionLimit: 25,
            queueLimit: 0,
            charset: 'utf8mb4',
            dateStrings: true // Return date/time as strings to prevent timezone distortion
        });
    }
    return pool;
}

export async function query(sql, params = []) {
    const p = getPool();
    const [rows] = await p.execute(sql, params);
    return rows;
}

/**
 * Execute multiple database operations inside an atomic SQL transaction
 */
export async function withTransaction(callback) {
    const p = getPool();
    const conn = await p.getConnection();
    try {
        await conn.beginTransaction();
        const result = await callback(conn);
        await conn.commit();
        return result;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

export async function checkConnection() {
    try {
        const p = getPool();
        const [result] = await p.query('SELECT 1 as connected');
        return { ok: true, result };
    } catch (err) {
        return { ok: false, error: err.message };
    }
}
