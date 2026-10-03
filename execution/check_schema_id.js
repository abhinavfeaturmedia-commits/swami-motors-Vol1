import { query } from '../backend/db.js';

async function main() {
    try {
        const tablesWithoutId = await query(`
            SELECT DISTINCT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME NOT IN (
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() AND COLUMN_NAME = 'id'
              )
        `);
        console.log('Tables without id column:', tablesWithoutId.map(t => t.TABLE_NAME));

        const modelCols = await query(`
            SELECT TABLE_NAME, COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
              AND (COLUMN_NAME LIKE '%model%' OR COLUMN_NAME = 'model')
        `);
        console.log('Tables with model columns:', modelCols);

        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}

main();
