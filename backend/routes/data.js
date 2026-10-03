import express from 'express';
import crypto from 'crypto';
import { query } from '../db.js';

const router = express.Router();

// Whitelist of valid database tables to prevent arbitrary table access
const ALLOWED_TABLES = new Set([
    'accessories', 'attendance_breaks', 'attendance_holidays', 'attendance_records',
    'attendance_sessions', 'audit_logs', 'bookings', 'catalog_views',
    'club_attendance', 'club_business_deals', 'club_chapters', 'club_gifts',
    'club_members', 'club_one_to_many', 'club_one_to_one', 'club_presentations',
    'club_referrals', 'club_service_exchanges', 'customers', 'dealer_settlements',
    'dealers', 'dealership_settings', 'documents', 'finance_services',
    'follow_ups', 'inspections', 'inventory', 'inventory_shares',
    'lead_accessories', 'lead_activities', 'lead_car_interests', 'lead_inventory_items',
    'leads', 'leave_balances', 'leave_requests', 'networking_clubs',
    'profiles', 'sales', 'service_bookings', 'shared_catalog_items',
    'shared_catalogs', 'shift_config', 'smart_notifications', 'staff_announcements',
    'staff_commitments', 'staff_daily_reports', 'staff_incentives', 'tasks',
    'test_drive_bookings', 'user_permissions', 'user_wishlist', 'vehicle_expenses',
    'video_reviews', 'visits', 'website_events'
]);

// Helper to check valid column identifier
function isValidIdentifier(name) {
    return typeof name === 'string' && /^[a-zA-Z0-9_]+$/.test(name);
}

// Helper to safely parse JSON fields returned from MySQL
function parseJsonFields(row) {
    if (!row || typeof row !== 'object') return row;
    const parsed = { ...row };
    for (const [key, val] of Object.entries(parsed)) {
        if (typeof val === 'string') {
            if ((val.startsWith('[') && val.endsWith(']')) || (val.startsWith('{') && val.endsWith('}'))) {
                try {
                    parsed[key] = JSON.parse(val);
                } catch (e) {
                    // keep original string if not valid JSON
                }
            }
        }
    }
    return parsed;
}

// Helper to batch-resolve joined PostgREST relations (e.g. car:inventory(*), customer:customers(*), profiles!staff_id(*))
async function expandRelations(currentTable, columnsStr, rows) {
    if (!rows || rows.length === 0 || typeof columnsStr !== 'string' || !columnsStr.includes('(')) {
        return rows;
    }

    const relationRegex = /(?:([a-zA-Z0-9_]+):)?([a-zA-Z0-9_]+)(?:![a-zA-Z0-9_]+)?\(([^)]*)\)/g;
    let match;
    while ((match = relationRegex.exec(columnsStr)) !== null) {
        const alias = match[1] || match[2];
        const relatedTable = match[2];
        if (!ALLOWED_TABLES.has(relatedTable)) continue;

        // Determine foreign key column in currentTable
        let fkCol = null;
        if (relatedTable === 'inventory' || alias === 'car') {
            fkCol = 'inventory_id';
        } else if (relatedTable === 'customers' || alias === 'customer') {
            fkCol = 'customer_id';
        } else if (relatedTable === 'leads' || alias === 'lead') {
            fkCol = 'lead_id';
        } else if (relatedTable === 'dealers' || alias === 'dealer') {
            fkCol = 'dealer_id';
        } else if (relatedTable === 'accessories') {
            fkCol = 'accessory_id';
        } else if (relatedTable === 'profiles') {
            if (alias === 'creator' || columnsStr.includes('created_by')) fkCol = 'created_by';
            else if (alias === 'staff' || columnsStr.includes('staff_id')) fkCol = 'staff_id';
            else if (alias === 'assigned_profile' || columnsStr.includes('assigned_to')) fkCol = 'assigned_to';
            else if (alias === 'added_by_profile' || columnsStr.includes('added_by')) fkCol = 'added_by';
            else if ('user_id' in rows[0]) fkCol = 'user_id';
            else if ('staff_id' in rows[0]) fkCol = 'staff_id';
            else if ('assigned_to' in rows[0]) fkCol = 'assigned_to';
        }

        if (!fkCol && (relatedTable + '_id') in rows[0]) {
            fkCol = relatedTable + '_id';
        }

        if (!fkCol) continue;

        const ids = [...new Set(rows.map(r => r[fkCol]).filter(Boolean))];
        if (ids.length === 0) {
            rows.forEach(r => { r[alias] = null; });
            continue;
        }

        const placeholders = ids.map(() => '?').join(', ');
        const relRows = await query(`SELECT * FROM \`${relatedTable}\` WHERE \`id\` IN (${placeholders})`, ids);
        const relMap = {};
        for (const relRow of relRows) {
            relMap[relRow.id] = parseJsonFields(relRow);
        }

        rows.forEach(r => {
            const id = r[fkCol];
            r[alias] = id && relMap[id] ? relMap[id] : null;
        });
    }

    return rows;
}

// ─── POST /api/data/select ────────────────────────────────────────────────────
router.post('/select', async (req, res) => {
    try {
        const { table, columns = '*', filters = [], order = null, limit = null, offset = null, single = false } = req.body;

        if (!ALLOWED_TABLES.has(table)) {
            return res.status(400).json({ error: `Invalid or disallowed table: ${table}` });
        }

        // Parse column selection
        let colSql = '*';
        if (columns && columns !== '*') {
            if (Array.isArray(columns)) {
                const validCols = columns.filter(isValidIdentifier).map(c => `\`${c}\``);
                colSql = validCols.length > 0 ? validCols.join(', ') : '*';
            } else if (typeof columns === 'string') {
                const parts = columns.split(',').map(s => s.trim()).filter(isValidIdentifier).map(c => `\`${c}\``);
                colSql = parts.length > 0 ? parts.join(', ') : '*';
            }
        }

        let sql = `SELECT ${colSql} FROM \`${table}\``;
        const params = [];

        // Apply filters: [{ column, operator, value }]
        if (Array.isArray(filters) && filters.length > 0) {
            const whereClauses = [];
            for (const f of filters) {
                if (!f.column || !isValidIdentifier(f.column)) continue;
                const op = f.operator || 'eq';
                const col = `\`${f.column}\``;

                switch (op) {
                    case 'eq':
                        if (f.value === null) {
                            whereClauses.push(`${col} IS NULL`);
                        } else {
                            whereClauses.push(`${col} = ?`);
                            params.push(f.value);
                        }
                        break;
                    case 'neq':
                        if (f.value === null) {
                            whereClauses.push(`${col} IS NOT NULL`);
                        } else {
                            whereClauses.push(`${col} != ?`);
                            params.push(f.value);
                        }
                        break;
                    case 'gt':
                        whereClauses.push(`${col} > ?`);
                        params.push(f.value);
                        break;
                    case 'gte':
                        whereClauses.push(`${col} >= ?`);
                        params.push(f.value);
                        break;
                    case 'lt':
                        whereClauses.push(`${col} < ?`);
                        params.push(f.value);
                        break;
                    case 'lte':
                        whereClauses.push(`${col} <= ?`);
                        params.push(f.value);
                        break;
                    case 'like':
                    case 'ilike':
                        whereClauses.push(`${col} LIKE ?`);
                        params.push(f.value);
                        break;
                    case 'in':
                        if (Array.isArray(f.value) && f.value.length > 0) {
                            const placeholders = f.value.map(() => '?').join(', ');
                            whereClauses.push(`${col} IN (${placeholders})`);
                            params.push(...f.value);
                        }
                        break;
                    case 'is':
                        if (f.value === null) {
                            whereClauses.push(`${col} IS NULL`);
                        } else {
                            whereClauses.push(`${col} = ?`);
                            params.push(f.value);
                        }
                        break;
                    default:
                        whereClauses.push(`${col} = ?`);
                        params.push(f.value);
                }
            }

            if (whereClauses.length > 0) {
                sql += ` WHERE ${whereClauses.join(' AND ')}`;
            }
        }

        // Apply ordering
        if (order && order.column && isValidIdentifier(order.column)) {
            const dir = order.ascending === false ? 'DESC' : 'ASC';
            sql += ` ORDER BY \`${order.column}\` ${dir}`;
        }

        // Apply pagination
        if (limit !== null && limit !== undefined) {
            const lim = parseInt(limit, 10);
            if (!isNaN(lim) && lim >= 0) {
                sql += ` LIMIT ${lim}`;
                if (offset !== null && offset !== undefined) {
                    const off = parseInt(offset, 10);
                    if (!isNaN(off) && off >= 0) {
                        sql += ` OFFSET ${off}`;
                    }
                }
            }
        }

        const rows = await query(sql, params);
        const parsedRows = rows.map(parseJsonFields);
        await expandRelations(table, typeof columns === 'string' ? columns : '', parsedRows);

        if (single) {
            return res.json({ data: parsedRows.length > 0 ? parsedRows[0] : null, error: null });
        }

        return res.json({ data: parsedRows, error: null, count: parsedRows.length });
    } catch (err) {
        console.error('Select query error:', err);
        return res.status(500).json({ data: null, error: err.message });
    }
});

// ─── POST /api/data/insert ────────────────────────────────────────────────────
router.post('/insert', async (req, res) => {
    try {
        const { table, values } = req.body;

        if (!ALLOWED_TABLES.has(table)) {
            return res.status(400).json({ error: `Invalid or disallowed table: ${table}` });
        }

        if (!values) {
            return res.status(400).json({ error: 'No values provided to insert' });
        }

        const items = Array.isArray(values) ? values : [values];
        const insertedItems = [];

        for (const rawItem of items) {
            const item = { ...rawItem };

            // Auto-generate UUID if table has id and not provided
            if (table !== 'dealership_settings' && !item.id) {
                item.id = crypto.randomUUID();
            }

            const validEntries = Object.entries(item).filter(([k]) => isValidIdentifier(k));
            const cols = validEntries.map(([k]) => `\`${k}\``);
            const placeholders = validEntries.map(() => '?');
            const vals = validEntries.map(([_, v]) => {
                if (v === null || v === undefined) return null;
                if (typeof v === 'object' && !(v instanceof Date)) {
                    return JSON.stringify(v);
                }
                if (typeof v === 'boolean') {
                    return v ? 1 : 0;
                }
                return v;
            });

            const sql = `INSERT INTO \`${table}\` (${cols.join(', ')}) VALUES (${placeholders.join(', ')})`;
            await query(sql, vals);
            insertedItems.push(item);
        }

        const resultData = Array.isArray(values) ? insertedItems : insertedItems[0];
        return res.json({ data: resultData, error: null });
    } catch (err) {
        console.error('Insert query error:', err);
        return res.status(500).json({ data: null, error: err.message });
    }
});

// ─── POST /api/data/upsert ────────────────────────────────────────────────────
router.post('/upsert', async (req, res) => {
    try {
        const { table, values, onConflict } = req.body;

        if (!ALLOWED_TABLES.has(table)) {
            return res.status(400).json({ error: `Invalid or disallowed table: ${table}` });
        }

        if (!values) {
            return res.status(400).json({ error: 'No values provided to upsert' });
        }

        const items = Array.isArray(values) ? values : [values];
        const upsertedItems = [];

        for (const rawItem of items) {
            const item = { ...rawItem };

            if (table !== 'dealership_settings' && !item.id && !onConflict) {
                item.id = crypto.randomUUID();
            }

            const validEntries = Object.entries(item).filter(([k]) => isValidIdentifier(k));
            const cols = validEntries.map(([k]) => `\`${k}\``);
            const placeholders = validEntries.map(() => '?');
            const vals = validEntries.map(([_, v]) => {
                if (v === null || v === undefined) return null;
                if (typeof v === 'object' && !(v instanceof Date)) {
                    return JSON.stringify(v);
                }
                if (typeof v === 'boolean') {
                    return v ? 1 : 0;
                }
                return v;
            });

            const conflictKeys = onConflict ? onConflict.split(',').map(s => s.trim()) : ['id'];
            const updateCols = validEntries
                .filter(([k]) => !conflictKeys.includes(k))
                .map(([k]) => `\`${k}\` = VALUES(\`${k}\`)`);

            let sql = `INSERT INTO \`${table}\` (${cols.join(', ')}) VALUES (${placeholders.join(', ')})`;
            if (updateCols.length > 0) {
                sql += ` ON DUPLICATE KEY UPDATE ${updateCols.join(', ')}`;
            }

            await query(sql, vals);
            upsertedItems.push(item);
        }

        const resultData = Array.isArray(values) ? upsertedItems : upsertedItems[0];
        return res.json({ data: resultData, error: null });
    } catch (err) {
        console.error('Upsert query error:', err);
        return res.status(500).json({ data: null, error: err.message });
    }
});

// ─── POST /api/data/update ────────────────────────────────────────────────────
router.post('/update', async (req, res) => {
    try {
        const { table, values, match } = req.body;

        if (!ALLOWED_TABLES.has(table)) {
            return res.status(400).json({ error: `Invalid or disallowed table: ${table}` });
        }

        if (!values || !match) {
            return res.status(400).json({ error: 'Values and match conditions are required' });
        }

        const setClauses = [];
        const params = [];

        for (const [k, v] of Object.entries(values)) {
            if (!isValidIdentifier(k)) continue;
            setClauses.push(`\`${k}\` = ?`);
            if (v === null || v === undefined) {
                params.push(null);
            } else if (typeof v === 'object' && !(v instanceof Date)) {
                params.push(JSON.stringify(v));
            } else if (typeof v === 'boolean') {
                params.push(v ? 1 : 0);
            } else {
                params.push(v);
            }
        }

        if (setClauses.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        const whereClauses = [];
        for (const [k, v] of Object.entries(match)) {
            if (!isValidIdentifier(k)) continue;
            whereClauses.push(`\`${k}\` = ?`);
            params.push(v);
        }

        if (whereClauses.length === 0) {
            return res.status(400).json({ error: 'Match condition cannot be empty for updates' });
        }

        const sql = `UPDATE \`${table}\` SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')}`;
        await query(sql, params);

        return res.json({ success: true, error: null });
    } catch (err) {
        console.error('Update query error:', err);
        return res.status(500).json({ data: null, error: err.message });
    }
});

// ─── POST /api/data/delete ────────────────────────────────────────────────────
router.post('/delete', async (req, res) => {
    try {
        const { table, match } = req.body;

        if (!ALLOWED_TABLES.has(table)) {
            return res.status(400).json({ error: `Invalid or disallowed table: ${table}` });
        }

        if (!match || Object.keys(match).length === 0) {
            return res.status(400).json({ error: 'Match criteria required for deletion' });
        }

        const whereClauses = [];
        const params = [];

        for (const [k, v] of Object.entries(match)) {
            if (!isValidIdentifier(k)) continue;
            whereClauses.push(`\`${k}\` = ?`);
            params.push(v);
        }

        const sql = `DELETE FROM \`${table}\` WHERE ${whereClauses.join(' AND ')}`;
        await query(sql, params);

        return res.json({ success: true, error: null });
    } catch (err) {
        console.error('Delete query error:', err);
        return res.status(500).json({ data: null, error: err.message });
    }
});

export default router;
