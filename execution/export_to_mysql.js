import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const eq = line.indexOf('=');
    if (eq > 0 && !line.startsWith('#')) {
        env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
    }
});

const SUPABASE_URL = env['VITE_SUPABASE_URL'];
const SUPABASE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

// Load schema metadata exported in step 88
const schemaOutputFile = path.join(
    'C:', 'Users', 'Abhinav', '.gemini', 'antigravity-ide', 'brain',
    '6bc84aee-6462-4a58-8bb0-208430d070ee', '.system_generated', 'steps', '88', 'output.txt'
);

let rawSchemaData;
try {
    const rawContent = fs.readFileSync(schemaOutputFile, 'utf8');
    const parsed = JSON.parse(rawContent);
    const text = parsed.result || rawContent;
    const jsonStart = text.indexOf('[');
    const jsonEnd = text.lastIndexOf(']');
    if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('Could not find JSON array in schema output');
    }
    rawSchemaData = JSON.parse(text.substring(jsonStart, jsonEnd + 1));
    console.log(`Loaded metadata for ${rawSchemaData.length} columns across all tables.`);
} catch (err) {
    console.error('Failed to parse schema metadata:', err);
    process.exit(1);
}

// Password hashes from auth.users (loaded dynamically from environment if provided)
const AUTH_PASSWORD_HASHES = process.env.AUTH_PASSWORD_HASHES 
    ? JSON.parse(process.env.AUTH_PASSWORD_HASHES) 
    : {};

// Group columns by table
const tables = {};
for (const col of rawSchemaData) {
    if (!tables[col.table_name]) {
        tables[col.table_name] = [];
    }
    tables[col.table_name].push(col);
}

// Convert Postgres data type to MySQL
function pgToMySqlType(col) {
    const { data_type, udt_name, character_maximum_length, numeric_precision, numeric_scale } = col;

    if (data_type === 'uuid') return 'VARCHAR(36)';
    if (data_type === 'ARRAY' || udt_name.startsWith('_')) return 'JSON';
    if (data_type === 'jsonb' || data_type === 'json') return 'JSON';
    if (data_type === 'boolean') return 'TINYINT(1)';
    if (data_type === 'integer') return 'INT';
    if (data_type === 'numeric') {
        const p = numeric_precision || 14;
        const s = numeric_scale || 2;
        return `DECIMAL(${p},${s})`;
    }
    if (data_type === 'timestamp with time zone' || data_type === 'timestamp without time zone') {
        return 'DATETIME';
    }
    if (data_type === 'date') return 'DATE';
    if (data_type === 'time without time zone') return 'TIME';
    if (data_type === 'character varying') {
        return `VARCHAR(${character_maximum_length || 255})`;
    }
    if (data_type === 'text') {
        return 'LONGTEXT';
    }
    return 'TEXT';
}

function escapeSqlValue(val, colType = '') {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'boolean') return val ? '1' : '0';
    if (typeof val === 'number') return isNaN(val) ? 'NULL' : String(val);

    // If target column is DATETIME / TIMESTAMP
    if (colType === 'DATETIME' || colType === 'TIMESTAMP') {
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
            const clean = val.replace('T', ' ').slice(0, 19);
            return `'${clean}'`;
        }
        if (val instanceof Date) {
            return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
        }
    }

    // If target column is DATE
    if (colType === 'DATE') {
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
            return `'${val.slice(0, 10)}'`;
        }
    }

    if (typeof val === 'object') {
        // Date or array or JSON object
        if (val instanceof Date) {
            return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
        }
        val = JSON.stringify(val);
    }
    // String escaping
    const str = String(val)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\0/g, '\\0')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\x1a/g, '\\Z');
    return `'${str}'`;
}

async function fetchAllRows(tableName) {
    const limit = 1000;
    let from = 0;
    let allRows = [];

    // For smart_notifications, limit to latest 5000 rows
    const isNotifications = tableName === 'smart_notifications';
    const maxRows = isNotifications ? 5000 : Infinity;

    while (allRows.length < maxRows) {
        let query = supabase.from(tableName).select('*');
        if (isNotifications) {
            query = query.order('created_at', { ascending: false });
        }
        const to = from + Math.min(limit, maxRows - allRows.length) - 1;
        const { data, error } = await query.range(from, to);

        if (error) {
            console.error(`Error querying ${tableName}:`, error.message);
            break;
        }

        if (!data || data.length === 0) break;
        allRows = allRows.concat(data);
        if (data.length < limit) break;
        from += limit;
    }

    return allRows;
}

async function runExport() {
    console.log('🚀 Starting Supabase to MySQL Export...\n');
    const dumpPath = path.join(__dirname, '..', 'swami_motors_mysql_dump.sql');
    const stream = fs.createWriteStream(dumpPath, { encoding: 'utf8' });

    stream.write(`-- ========================================================\n`);
    stream.write(`-- SWAMI MOTORS: COMPLETE MYSQL DATABASE DUMP\n`);
    stream.write(`-- Generated: ${new Date().toISOString()}\n`);
    stream.write(`-- Target Environment: Hostinger MySQL (MariaDB / MySQL 8.0)\n`);
    stream.write(`-- ========================================================\n\n`);
    stream.write(`SET NAMES utf8mb4;\n`);
    stream.write(`SET FOREIGN_KEY_CHECKS = 0;\n`);
    stream.write(`SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';\n\n`);

    const tableNames = Object.keys(tables).sort();
    const stats = {};

    for (const tableName of tableNames) {
        process.stdout.write(`Exporting ${tableName}... `);
        const cols = tables[tableName];

        // Primary key resolution
        const pkCol = tableName === 'dealership_settings' ? 'setting_key' : 'id';

        // Write CREATE TABLE
        stream.write(`--\n-- Table structure for table \`${tableName}\`\n--\n`);
        stream.write(`DROP TABLE IF EXISTS \`${tableName}\`;\n`);
        stream.write(`CREATE TABLE \`${tableName}\` (\n`);

        const colDefs = cols.map(c => {
            const myType = pgToMySqlType(c);
            const nullable = c.is_nullable === 'NO' ? 'NOT NULL' : 'NULL';
            return `  \`${c.column_name}\` ${myType} ${nullable}`;
        });

        // Add password_hash to profiles if table is profiles
        if (tableName === 'profiles') {
            colDefs.push(`  \`password_hash\` VARCHAR(255) NULL`);
        }

        colDefs.push(`  PRIMARY KEY (\`${pkCol}\`)`);
        stream.write(colDefs.join(',\n') + '\n');
        stream.write(`) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`);

        // Fetch rows
        const rows = await fetchAllRows(tableName);
        stats[tableName] = rows.length;

        if (rows.length > 0) {
            stream.write(`--\n-- Dumping data for table \`${tableName}\` (${rows.length} rows)\n--\n`);

            // Batch inserts (100 rows per INSERT)
            const batchSize = 100;
            for (let i = 0; i < rows.length; i += batchSize) {
                const batch = rows.slice(i, i + batchSize);
                const colNames = cols.map(c => `\`${c.column_name}\``);
                if (tableName === 'profiles') {
                    colNames.push('`password_hash`');
                }

                const valueRows = batch.map(row => {
                    const vals = cols.map(c => escapeSqlValue(row[c.column_name], pgToMySqlType(c)));
                    if (tableName === 'profiles') {
                        const hash = AUTH_PASSWORD_HASHES[row.id] || null;
                        vals.push(escapeSqlValue(hash, 'VARCHAR'));
                    }
                    return `(${vals.join(', ')})`;
                });

                stream.write(`INSERT INTO \`${tableName}\` (${colNames.join(', ')}) VALUES\n${valueRows.join(',\n')};\n`);
            }
            stream.write('\n');
        }

        console.log(`✅ (${rows.length} rows)`);
    }

    stream.write(`SET FOREIGN_KEY_CHECKS = 1;\n`);
    stream.write(`-- ========================================================\n`);
    stream.write(`-- DUMP COMPLETE\n`);
    stream.write(`-- ========================================================\n`);
    stream.end();

    console.log(`\n🎉 Export completed successfully! Saved to: ${dumpPath}\n`);
    console.log('📊 Summary of Exported Rows:');
    console.table(
        Object.entries(stats)
            .filter(([_, count]) => count > 0)
            .map(([table, count]) => ({ Table: table, Rows: count }))
    );
}

runExport().catch(err => {
    console.error('Export failed:', err);
    process.exit(1);
});
