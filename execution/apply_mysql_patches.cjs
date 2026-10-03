const { Client: SshClient } = require('ssh2');
const dotenv = require('dotenv');

dotenv.config();

const SSH_HOST = process.env.HOSTINGER_SSH_HOST || '145.79.209.154';
const SSH_PORT = Number(process.env.HOSTINGER_SSH_PORT) || 65002;
const SSH_USER = process.env.HOSTINGER_SSH_USER;
const SSH_PASS = process.env.HOSTINGER_SSH_PASS;

const DB_USER = process.env.DB_USER || process.env.MYSQL_USER;
const DB_PASS = process.env.DB_PASS || process.env.MYSQL_PASSWORD;
const DB_NAME = process.env.DB_NAME || process.env.MYSQL_DATABASE;

if (!SSH_USER || !SSH_PASS || !DB_USER || !DB_PASS || !DB_NAME) {
    console.error('❌ Error: Missing required SSH or DB credentials in environment variables (.env)');
    process.exit(1);
}

const QUERIES = [
    {
        name: 'attendance_records unique key (user_id, date)',
        sql: "ALTER TABLE attendance_records ADD UNIQUE KEY uq_attendance_user_date (user_id, date);"
    },
    {
        name: 'catalog_views DEFAULT CURRENT_TIMESTAMP',
        sql: "ALTER TABLE catalog_views MODIFY COLUMN viewed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;"
    },
    {
        name: 'visits DEFAULT CURRENT_TIMESTAMP',
        sql: "ALTER TABLE visits MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;"
    },
    {
        name: 'finance_services DEFAULT CURRENT_TIMESTAMP',
        sql: "ALTER TABLE finance_services MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;"
    },
    {
        name: 'staff_announcements DEFAULT CURRENT_TIMESTAMP',
        sql: "ALTER TABLE staff_announcements MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;"
    },
    {
        name: 'user_permissions module VARCHAR(100) & unique key',
        sql: "ALTER TABLE user_permissions MODIFY COLUMN module VARCHAR(100) NOT NULL, ADD UNIQUE KEY uq_user_permissions_module (user_id, module);"
    }
];

async function applyPatches() {
    console.log('Connecting to Hostinger via SSH to verify and apply live MySQL schema patches...');
    const conn = new SshClient();

    await new Promise((resolve, reject) => {
        conn.on('ready', async () => {
            console.log('SSH connection established.');

            for (const q of QUERIES) {
                await new Promise((qResolve) => {
                    const cmd = `mysql -u ${DB_USER} -p'${DB_PASS}' ${DB_NAME} -e "${q.sql}" 2>&1`;
                    conn.exec(cmd, (err, stream) => {
                        if (err) {
                            console.error(`Error executing ${q.name}:`, err.message);
                            return qResolve();
                        }
                        let output = '';
                        stream.on('data', (d) => { output += d.toString(); });
                        stream.on('close', (code) => {
                            if (code === 0) {
                                console.log(`✅ [APPLIED] ${q.name}`);
                            } else if (output.includes('Duplicate key name') || output.includes('already exists')) {
                                console.log(`ℹ️ [ALREADY EXISTS] ${q.name}`);
                            } else {
                                console.warn(`⚠️ [OUTPUT] ${q.name} (code ${code}): ${output.trim()}`);
                            }
                            qResolve();
                        });
                    });
                });
            }

            conn.end();
            resolve();
        });

        conn.on('error', (err) => {
            console.error('SSH Error:', err.message);
            reject(err);
        });

        conn.connect({
            host: SSH_HOST,
            port: SSH_PORT,
            username: SSH_USER,
            password: SSH_PASS
        });
    });

    console.log('Live MySQL schema patch verification completed.');
}

applyPatches().catch(err => {
    console.error('Failed to run patches:', err);
    process.exit(1);
});
