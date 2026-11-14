const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const mysql = require('../backend/node_modules/mysql2/promise');

async function init() {
    console.log('Connecting to MySQL host:', process.env.DB_HOST, 'database:', process.env.DB_NAME);
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 5
    });

    const createSql = `
        CREATE TABLE IF NOT EXISTS file_storage (
            id VARCHAR(100) PRIMARY KEY,
            filename VARCHAR(255) UNIQUE NOT NULL,
            mime_type VARCHAR(100) NOT NULL DEFAULT 'image/jpeg',
            data LONGBLOB NOT NULL,
            size INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_filename (filename)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    console.log('Executing table creation for file_storage...');
    await pool.execute(createSql);
    console.log('✅ file_storage table created or verified successfully in MySQL.');

    const [desc] = await pool.execute('DESCRIBE file_storage');
    console.log('Table structure:');
    desc.forEach(col => console.log(` - ${col.Field} (${col.Type})`));

    await pool.end();
}

init().catch(err => {
    console.error('❌ Error initializing file_storage table:', err.message);
    process.exit(1);
});

