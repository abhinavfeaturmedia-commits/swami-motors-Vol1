import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool = null;

export function getPool() {
    if (!pool) {
        pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'swami_motors',
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
