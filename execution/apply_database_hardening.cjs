/**
 * apply_database_hardening.cjs
 * Adds soft-delete (deleted_at) columns and secondary performance indexes to MySQL
 */

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

const OPERATIONS = [
    // ─── 1. Soft-Delete Columns ──────────────────────────────────────────────
    {
        name: 'inventory.deleted_at column',
        sql: "ALTER TABLE inventory ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL;"
    },
    {
        name: 'leads.deleted_at column',
        sql: "ALTER TABLE leads ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL;"
    },
    {
        name: 'customers.deleted_at column',
        sql: "ALTER TABLE customers ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL;"
    },
    {
        name: 'sales.deleted_at column',
        sql: "ALTER TABLE sales ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL;"
    },
    {
        name: 'bookings.deleted_at column',
        sql: "ALTER TABLE bookings ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL;"
    },
    {
        name: 'vehicle_expenses.deleted_at column',
        sql: "ALTER TABLE vehicle_expenses ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL;"
    },

    // ─── 2. Performance B-Tree Indexes ───────────────────────────────────────
    {
        name: 'leads phone index',
        sql: "ALTER TABLE leads ADD INDEX idx_leads_phone (phone(20));"
    },
    {
        name: 'leads status index',
        sql: "ALTER TABLE leads ADD INDEX idx_leads_status (status(20));"
    },
    {
        name: 'leads type index',
        sql: "ALTER TABLE leads ADD INDEX idx_leads_type (type(20));"
    },
    {
        name: 'leads created_at index',
        sql: "ALTER TABLE leads ADD INDEX idx_leads_created_at (created_at);"
    },
    {
        name: 'leads assigned_to index',
        sql: "ALTER TABLE leads ADD INDEX idx_leads_assigned_to (assigned_to);"
    },
    {
        name: 'inventory status index',
        sql: "ALTER TABLE inventory ADD INDEX idx_inventory_status (status(20));"
    },
    {
        name: 'inventory make & model index',
        sql: "ALTER TABLE inventory ADD INDEX idx_inventory_make_model (make(50), model(50));"
    },
    {
        name: 'inventory price index',
        sql: "ALTER TABLE inventory ADD INDEX idx_inventory_price (price);"
    },
    {
        name: 'inventory registration_no index',
        sql: "ALTER TABLE inventory ADD INDEX idx_inventory_reg_no (registration_no(20));"
    },
    {
        name: 'inventory created_at index',
        sql: "ALTER TABLE inventory ADD INDEX idx_inventory_created_at (created_at);"
    },
    {
        name: 'customers phone index',
        sql: "ALTER TABLE customers ADD INDEX idx_customers_phone (phone(20));"
    },
    {
        name: 'customers created_at index',
        sql: "ALTER TABLE customers ADD INDEX idx_customers_created_at (created_at);"
    },
    {
        name: 'bookings date index',
        sql: "ALTER TABLE bookings ADD INDEX idx_bookings_date (booking_date);"
    },
    {
        name: 'bookings type & status index',
        sql: "ALTER TABLE bookings ADD INDEX idx_bookings_type_status (booking_type(20), status(20));"
    },
    {
        name: 'bookings lead_id index',
        sql: "ALTER TABLE bookings ADD INDEX idx_bookings_lead_id (lead_id);"
    },
    {
        name: 'sales customer_id index',
        sql: "ALTER TABLE sales ADD INDEX idx_sales_customer_id (customer_id);"
    },
    {
        name: 'sales inventory_id index',
        sql: "ALTER TABLE sales ADD INDEX idx_sales_inventory_id (inventory_id);"
    },
    {
        name: 'sales date index',
        sql: "ALTER TABLE sales ADD INDEX idx_sales_date (sale_date);"
    },
    {
        name: 'visits lead_id index',
        sql: "ALTER TABLE visits ADD INDEX idx_visits_lead_id (lead_id);"
    },
    {
        name: 'visits customer_id index',
        sql: "ALTER TABLE visits ADD INDEX idx_visits_customer_id (customer_id);"
    },
    {
        name: 'visits staff_id index',
        sql: "ALTER TABLE visits ADD INDEX idx_visits_staff_id (staff_id);"
    },
    {
        name: 'visits date index',
        sql: "ALTER TABLE visits ADD INDEX idx_visits_date (visit_date);"
    },
    {
        name: 'follow_ups lead_id index',
        sql: "ALTER TABLE follow_ups ADD INDEX idx_follow_ups_lead_id (lead_id);"
    },
    {
        name: 'follow_ups due date index',
        sql: "ALTER TABLE follow_ups ADD INDEX idx_follow_ups_due (due_date, is_done);"
    },
    {
        name: 'audit_logs action index',
        sql: "ALTER TABLE audit_logs ADD INDEX idx_audit_logs_action (action(50));"
    },
    {
        name: 'audit_logs created_at index',
        sql: "ALTER TABLE audit_logs ADD INDEX idx_audit_logs_created_at (created_at);"
    }
];

async function applyHardening() {
    console.log('Connecting to Hostinger via SSH to apply soft-delete columns & B-Tree indexes...');
    const conn = new SshClient();

    await new Promise((resolve, reject) => {
        conn.on('ready', async () => {
            console.log('SSH connection established.');

            for (const op of OPERATIONS) {
                await new Promise((qResolve) => {
                    const cmd = `mysql -u ${DB_USER} -p'${DB_PASS}' ${DB_NAME} -e "${op.sql}" 2>&1`;
                    conn.exec(cmd, (err, stream) => {
                        if (err) {
                            console.error(`Error executing ${op.name}:`, err.message);
                            return qResolve();
                        }
                        let output = '';
                        stream.on('data', (d) => { output += d.toString(); });
                        stream.on('close', (code) => {
                            if (code === 0) {
                                console.log(`✅ [APPLIED] ${op.name}`);
                            } else if (output.includes('Duplicate column name') || output.includes('Duplicate key name') || output.includes('already exists')) {
                                console.log(`ℹ️ [ALREADY EXISTS] ${op.name}`);
                            } else {
                                console.warn(`⚠️ [OUTPUT] ${op.name} (code ${code}): ${output.trim()}`);
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

    console.log('Database hardening migration completed.');
}

applyHardening().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
