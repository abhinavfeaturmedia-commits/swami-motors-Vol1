import express from 'express';
import crypto from 'crypto';
import { query, withTransaction } from '../db.js';

const router = express.Router();

// Tables supporting soft-delete via deleted_at timestamp
const SOFT_DELETE_TABLES = new Set([
    'inventory',
    'leads',
    'customers',
    'sales',
    'bookings',
    'vehicle_expenses'
]);

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

// Tables that can be queried publicly without a staff/admin login
const PUBLIC_READ_TABLES = new Set([
    'inventory',
    'accessories',
    'dealership_settings',
    'shared_catalogs',
    'shared_catalog_items',
    'video_reviews',
    'catalog_views',
    'lead_car_interests',
    'lead_accessories',
    'lead_inventory_items'
]);

// Tables that public visitors can submit to (inquiries, test drives, wishlist, analytics, finance)
const PUBLIC_INSERT_TABLES = new Set([
    'leads',
    'bookings',
    'visits',
    'lead_inventory_items',
    'lead_activities',
    'lead_accessories',
    'lead_car_interests',
    'website_events',
    'catalog_views',
    'user_wishlist',
    'finance_services'
]);

// Helper to normalize time strings ('10:30 AM', '2:00 PM') into MySQL TIME format 'HH:MM:SS'
function normalizeTime(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return timeStr;
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
    if (!match) return timeStr;
    let [_, hours, minutes, seconds, meridiem] = match;
    let h = parseInt(hours, 10);
    const m = minutes.padStart(2, '0');
    const s = (seconds || '00').padStart(2, '0');
    if (meridiem) {
        const isPM = meridiem.toUpperCase() === 'PM';
        if (isPM && h < 12) h += 12;
        if (!isPM && h === 12) h = 0;
    }
    return `${String(h).padStart(2, '0')}:${m}:${s}`;
}

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

        // Security check: restrict non-public tables to authenticated users
        if (!PUBLIC_READ_TABLES.has(table)) {
            if (!req.user) {
                return res.status(401).json({ error: `Unauthorized: Authentication required to view ${table}` });
            }
            if (req.user.role === 'customer') {
                const customerAllowed = new Set(['user_wishlist', 'leads', 'bookings', 'finance_services', 'profiles']);
                if (!customerAllowed.has(table)) {
                    return res.status(403).json({ error: `Forbidden: Staff or admin access required to view ${table}` });
                }
            }
        }

        // Customer automatic scoping: customers can only view their own leads, bookings, finance, and wishlist
        const activeFilters = Array.isArray(filters) ? [...filters] : [];
        if (req.user && req.user.role === 'customer') {
            if (table === 'leads' || table === 'finance_services') {
                if (req.user.phone) {
                    activeFilters.push({ column: 'phone', operator: 'eq', value: req.user.phone });
                } else if (req.user.email) {
                    activeFilters.push({ column: 'email', operator: 'eq', value: req.user.email });
                } else {
                    activeFilters.push({ column: 'user_id', operator: 'eq', value: req.user.id });
                }
            } else if (table === 'user_wishlist') {
                activeFilters.push({ column: 'user_id', operator: 'eq', value: req.user.id });
            }
        }

        // Auto-filter soft-deleted records unless explicitly requested
        if (SOFT_DELETE_TABLES.has(table) && !req.body.include_deleted) {
            const hasDeletedAt = activeFilters.some(f => f.column === 'deleted_at');
            if (!hasDeletedAt) {
                activeFilters.push({ column: 'deleted_at', operator: 'is_null', value: null });
            }
        }

        // Parse column selection
        let colSql = '*';
        if (columns && columns !== '*') {
            if (Array.isArray(columns)) {
                const validCols = columns.filter(c => c === '*' || isValidIdentifier(c)).map(c => c === '*' ? '*' : `\`${c}\``);
                colSql = validCols.length > 0 ? (validCols.includes('*') ? '*' : validCols.join(', ')) : '*';
            } else if (typeof columns === 'string') {
                if (columns.includes('*')) {
                    colSql = '*';
                } else {
                    // Strip out relational queries like `car:inventory(...)` or `items(...)` so nested columns don't leak into parent table SELECT
                    const cleaned = columns.replace(/\w+(?::\w+)?\([^)]*\)/g, '').trim();
                    const parts = cleaned.split(',')
                        .map(s => s.trim())
                        .filter(s => s.length > 0 && isValidIdentifier(s))
                        .map(c => `\`${c}\``);
                    colSql = parts.length > 0 ? parts.join(', ') : '*';
                }
            }
        }

        let sql = `SELECT ${colSql} FROM \`${table}\``;
        const params = [];
        const whereClauses = [];

        // Apply filters: [{ column, operator, value }]
        if (activeFilters.length > 0) {
            for (const f of activeFilters) {
                // Support PostgREST .or('col.op.val,col2.op.val2') conditions
                if (f.operator === 'or' && typeof f.value === 'string') {
                    const conditions = f.value.match(/[^,()]+(?:\([^)]*\))?/g) || [f.value];
                    const orParts = [];
                    for (const cond of conditions) {
                        const trimmed = cond.trim();
                        const dotParts = trimmed.split('.');
                        if (dotParts.length >= 2) {
                            const cName = dotParts[0].trim();
                            const cOp = dotParts[1].trim();
                            const cVal = dotParts.slice(2).join('.').trim();
                            if (isValidIdentifier(cName)) {
                                if (cOp === 'is' && cVal === 'null') {
                                    orParts.push(`\`${cName}\` IS NULL`);
                                } else if (cOp === 'not' && cVal === 'null') {
                                    orParts.push(`\`${cName}\` IS NOT NULL`);
                                } else if (cOp === 'ilike' || cOp === 'like') {
                                    orParts.push(`\`${cName}\` LIKE ?`);
                                    params.push(cVal);
                                } else if (cOp === 'eq') {
                                    orParts.push(`\`${cName}\` = ?`);
                                    params.push(cVal);
                                } else if (cOp === 'neq') {
                                    orParts.push(`\`${cName}\` != ?`);
                                    params.push(cVal);
                                } else if (cOp === 'gt') {
                                    orParts.push(`\`${cName}\` > ?`);
                                    params.push(cVal);
                                } else if (cOp === 'gte') {
                                    orParts.push(`\`${cName}\` >= ?`);
                                    params.push(cVal);
                                } else if (cOp === 'lt') {
                                    orParts.push(`\`${cName}\` < ?`);
                                    params.push(cVal);
                                } else if (cOp === 'lte') {
                                    orParts.push(`\`${cName}\` <= ?`);
                                    params.push(cVal);
                                } else if (cOp === 'in') {
                                    const inVals = cVal.replace(/^\(|\)$/g, '').split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
                                    if (inVals.length > 0) {
                                        const p = inVals.map(() => '?').join(', ');
                                        orParts.push(`\`${cName}\` IN (${p})`);
                                        params.push(...inVals);
                                    }
                                }
                            }
                        }
                    }
                    if (orParts.length > 0) {
                        whereClauses.push(`(${orParts.join(' OR ')})`);
                    }
                    continue;
                }

                if (!f.column || !isValidIdentifier(f.column)) continue;
                const op = f.operator || 'eq';
                const col = `\`${f.column}\``;

                switch (op) {
                    case 'is_null':
                        whereClauses.push(`${col} IS NULL`);
                        break;
                    case 'not_null':
                        whereClauses.push(`${col} IS NOT NULL`);
                        break;
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
                    case 'not_like':
                    case 'not_ilike':
                        whereClauses.push(`${col} NOT LIKE ?`);
                        params.push(f.value);
                        break;
                    case 'in':
                        if (Array.isArray(f.value) && f.value.length > 0) {
                            const placeholders = f.value.map(() => '?').join(', ');
                            whereClauses.push(`${col} IN (${placeholders})`);
                            params.push(...f.value);
                        }
                        break;
                    case 'not_in':
                        if (Array.isArray(f.value) && f.value.length > 0) {
                            const placeholders = f.value.map(() => '?').join(', ');
                            whereClauses.push(`${col} NOT IN (${placeholders})`);
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

        // Support exact count for server-side pagination
        let totalCount = null;
        if (req.body.count === 'exact') {
            let countSql = `SELECT COUNT(*) AS total_count FROM \`${table}\``;
            if (whereClauses.length > 0) {
                countSql += ` WHERE ${whereClauses.join(' AND ')}`;
            }
            const countRows = await query(countSql, params);
            totalCount = countRows[0]?.total_count ?? 0;
        }

        const rows = await query(sql, params);
        let parsedRows = rows.map(parseJsonFields);
        await expandRelations(table, typeof columns === 'string' ? columns : '', parsedRows);

        // Security: Strip password_hash if profiles are queried
        if (table === 'profiles') {
            parsedRows.forEach(p => { delete p.password_hash; });
        }

        // Security: Filter out sensitive keys from dealership_settings unless admin, but preserve safe metadata for openrouter
        if (table === 'dealership_settings' && (!req.user || req.user.role !== 'admin')) {
            parsedRows = parsedRows
                .filter(r => {
                    const k = r.setting_key ?? r.key;
                    return k !== 'smtp_settings' && k !== 'api_keys';
                })
                .map(r => {
                    const k = r.setting_key ?? r.key;
                    if (k === 'openrouter_settings' && r.setting_value) {
                        const val = typeof r.setting_value === 'object' ? { ...r.setting_value } : {};
                        return {
                            ...r,
                            setting_value: {
                                ...val,
                                is_configured: Boolean(val.api_key),
                                api_key: val.api_key ? 'configured' : ''
                            }
                        };
                    }
                    return r;
                });
        }

        if (single) {
            return res.json({ data: parsedRows.length > 0 ? parsedRows[0] : null, error: null, count: totalCount !== null ? totalCount : (parsedRows.length > 0 ? 1 : 0) });
        }

        return res.json({ data: parsedRows, error: null, count: totalCount !== null ? totalCount : parsedRows.length });
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

        // Security check: only allow public insert on permitted lead/inquiry/event tables
        if (!PUBLIC_INSERT_TABLES.has(table)) {
            if (!req.user) {
                return res.status(401).json({ error: `Unauthorized: Authentication required to insert into ${table}` });
            }
            if (req.user.role === 'customer' && table !== 'user_wishlist') {
                return res.status(403).json({ error: `Forbidden: Admin or staff access required to insert into ${table}` });
            }
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

            // Defaults for strict NOT NULL datetime & time fields
            const now = new Date();
            if (table === 'bookings' && item.booking_time) {
                item.booking_time = normalizeTime(item.booking_time);
            }
            if (table === 'catalog_views' && !item.viewed_at) {
                item.viewed_at = now;
            }
            if ((table === 'visits' || table === 'finance_services') && !item.created_at) {
                item.created_at = now;
            }
            if ((table === 'visits' || table === 'finance_services') && !item.updated_at) {
                item.updated_at = now;
            }
            if (table === 'staff_announcements' && !item.created_at) {
                item.created_at = now;
            }
            if (table === 'leads' && !item.created_at) {
                item.created_at = now;
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

        // Security check: require authentication for upsert
        if (!req.user) {
            return res.status(401).json({ error: `Unauthorized: Authentication required to upsert into ${table}` });
        }
        if (req.user.role === 'customer' && table !== 'user_wishlist') {
            return res.status(403).json({ error: `Forbidden: Admin or staff access required to upsert into ${table}` });
        }

        if (!values) {
            return res.status(400).json({ error: 'No values provided to upsert' });
        }

        const items = Array.isArray(values) ? values : [values];
        const upsertedItems = [];

        for (const rawItem of items) {
            const item = { ...rawItem };

            if (table === 'bookings' && item.booking_time) {
                item.booking_time = normalizeTime(item.booking_time);
            }

            const now = new Date();
            if (item.updated_at === undefined && ['attendance_records', 'user_permissions', 'finance_services', 'visits', 'leads'].includes(table)) {
                item.updated_at = now;
            }

            const conflictKeys = onConflict ? onConflict.split(',').map(s => s.trim()) : ['id'];

            // Intelligent conflict resolution: if id not explicitly passed, check if a row exists matching conflict keys
            let matchedId = item.id;
            if (!matchedId && table !== 'dealership_settings' && conflictKeys.length > 0 && !conflictKeys.includes('id')) {
                const whereCols = conflictKeys.filter(isValidIdentifier);
                const whereVals = whereCols.map(c => item[c]);
                if (whereCols.length > 0 && whereVals.every(v => v !== undefined && v !== null)) {
                    try {
                        const checkSql = `SELECT \`id\` FROM \`${table}\` WHERE ${whereCols.map(c => `\`${c}\` = ?`).join(' AND ')} LIMIT 1`;
                        const existing = await query(checkSql, whereVals);
                        if (existing && existing.length > 0) {
                            matchedId = existing[0].id;
                            item.id = matchedId;
                        }
                    } catch (e) {
                        // Table may not have an 'id' column or lookup failed, ignore
                    }
                }
            }

            if (!item.id && table !== 'dealership_settings') {
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

            const updateCols = validEntries
                .filter(([k]) => !conflictKeys.includes(k) && k !== 'id')
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

        // Security check: require authentication for updates
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized: Authentication required to update records' });
        }
        if (req.user.role === 'customer') {
            if (table === 'profiles') {
                match.id = req.user.id;
            } else if (table !== 'user_wishlist') {
                return res.status(403).json({ error: `Forbidden: Admin or staff access required to update ${table}` });
            }
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

        // Security check: require authentication for deletions
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized: Authentication required to delete records' });
        }
        if (req.user.role === 'customer') {
            if (table === 'user_wishlist') {
                match.user_id = req.user.id;
            } else {
                return res.status(403).json({ error: `Forbidden: Admin or staff access required to delete from ${table}` });
            }
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

        // Soft delete support: If table supports soft-delete and hard_delete is not explicitly true, mark deleted_at = NOW()
        if (SOFT_DELETE_TABLES.has(table) && req.body.hard_delete !== true) {
            const sql = `UPDATE \`${table}\` SET \`deleted_at\` = NOW() WHERE ${whereClauses.join(' AND ')}`;
            await query(sql, params);
            return res.json({ success: true, soft_deleted: true, error: null });
        }

        const sql = `DELETE FROM \`${table}\` WHERE ${whereClauses.join(' AND ')}`;
        await query(sql, params);

        return res.json({ success: true, error: null });
    } catch (err) {
        console.error('Delete query error:', err);
        return res.status(500).json({ data: null, error: err.message });
    }
});

// ─── POST /api/data/rpc ───────────────────────────────────────────────────────
router.post('/rpc', async (req, res) => {
    try {
        const { fnName, args = {} } = req.body;

        if (fnName === 'search_leads_by_text') {
            const term = (args.search_term || '').trim();
            if (!term) return res.json({ data: [], error: null });

            const likeTerm = `%${term}%`;
            const sql = `
                SELECT DISTINCT l.id
                FROM \`leads\` l
                LEFT JOIN \`lead_car_interests\` lci ON lci.lead_id = l.id
                LEFT JOIN \`inventory\` i ON lci.inventory_id = i.id
                LEFT JOIN \`dealers\` d ON i.dealer_id = d.id
                LEFT JOIN \`follow_ups\` fu ON fu.lead_id = l.id
                WHERE 
                    l.full_name LIKE ? OR
                    l.phone LIKE ? OR
                    l.email LIKE ? OR
                    l.type LIKE ? OR
                    l.source LIKE ? OR
                    l.status LIKE ? OR
                    l.notes LIKE ? OR
                    l.car_make LIKE ? OR
                    l.car_model LIKE ? OR
                    l.budget LIKE ? OR
                    l.message LIKE ? OR
                    l.lead_quality LIKE ? OR
                    l.personal_address LIKE ? OR
                    l.office_address LIKE ? OR
                    l.secondary_phone LIKE ? OR
                    l.whatsapp_number LIKE ? OR
                    i.make LIKE ? OR
                    i.model LIKE ? OR
                    i.registration_no LIKE ? OR
                    d.name LIKE ? OR
                    fu.notes LIKE ?
                ORDER BY l.created_at DESC
                LIMIT 100
            `;
            const params = Array(21).fill(likeTerm);
            const rows = await query(sql, params);
            return res.json({ data: rows.map(r => r.id), error: null });
        }

        if (fnName === 'search_customers_by_text') {
            const term = (args.search_term || '').trim();
            if (!term) return res.json({ data: [], error: null });

            const likeTerm = `%${term}%`;
            const sql = `
                SELECT DISTINCT c.id
                FROM \`customers\` c
                LEFT JOIN \`sales\` s ON s.customer_id = c.id
                LEFT JOIN \`inventory\` i ON s.inventory_id = i.id
                WHERE
                    c.full_name LIKE ? OR
                    c.phone LIKE ? OR
                    c.email LIKE ? OR
                    c.city LIKE ? OR
                    c.address LIKE ? OR
                    c.alternate_phone LIKE ? OR
                    c.whatsapp_number LIKE ? OR
                    c.occupation LIKE ? OR
                    c.notes LIKE ? OR
                    i.make LIKE ? OR
                    i.model LIKE ? OR
                    i.registration_no LIKE ?
                ORDER BY c.created_at DESC
                LIMIT 100
            `;
            const params = Array(12).fill(likeTerm);
            const rows = await query(sql, params);
            return res.json({ data: rows.map(r => r.id), error: null });
        }

        if (fnName === 'search_bookings_by_text') {
            const term = (args.search_term || '').trim();
            if (!term) return res.json({ data: [], error: null });

            const likeTerm = `%${term}%`;
            const sql = `
                SELECT DISTINCT b.id
                FROM \`bookings\` b
                LEFT JOIN \`leads\` l ON b.lead_id = l.id
                LEFT JOIN \`inventory\` i ON b.inventory_id = i.id
                WHERE
                    b.status LIKE ? OR
                    b.booking_type LIKE ? OR
                    b.notes LIKE ? OR
                    l.full_name LIKE ? OR
                    l.phone LIKE ? OR
                    l.email LIKE ? OR
                    l.notes LIKE ? OR
                    i.make LIKE ? OR
                    i.model LIKE ? OR
                    i.registration_no LIKE ?
                ORDER BY b.booking_date DESC
                LIMIT 100
            `;
            const params = Array(10).fill(likeTerm);
            const rows = await query(sql, params);
            return res.json({ data: rows.map(r => r.id), error: null });
        }

        return res.status(400).json({ error: `Unknown RPC function: ${fnName}` });
    } catch (err) {
        console.error('RPC execution error:', err);
        return res.status(500).json({ data: null, error: err.message });
    }
});

// ─── POST /api/data/record-sale-transaction ──────────────────────────────────
router.post('/record-sale-transaction', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized: Authentication required to record sales' });
        }
        const { inventory_id, final_price, customer_name, customer_phone, customer_email, notes, sale_type = 'purchased' } = req.body;

        if (!inventory_id || !final_price || !customer_name) {
            return res.status(400).json({ error: 'inventory_id, final_price, and customer_name are required' });
        }

        const result = await withTransaction(async (conn) => {
            // 1. Fetch car with row lock to prevent race conditions
            const [cars] = await conn.execute('SELECT * FROM inventory WHERE id = ? FOR UPDATE', [inventory_id]);
            if (!cars || cars.length === 0) {
                throw new Error('Vehicle not found or already deleted');
            }
            const car = cars[0];
            if (car.status === 'sold') {
                throw new Error('Vehicle is already recorded as sold');
            }

            const purchaseCost = Number(car.purchase_cost) || 0;
            const finalPriceNum = Number(final_price);
            const netProfit = finalPriceNum - purchaseCost;

            // 2. Upsert customer
            let customerId = crypto.randomUUID();
            const phone = (customer_phone || '').trim();
            if (phone) {
                const [existingCust] = await conn.execute('SELECT id FROM customers WHERE phone = ? LIMIT 1', [phone]);
                if (existingCust && existingCust.length > 0) {
                    customerId = existingCust[0].id;
                    await conn.execute('UPDATE customers SET full_name = ?, updated_at = NOW() WHERE id = ?', [customer_name.trim(), customerId]);
                } else {
                    await conn.execute(
                        'INSERT INTO customers (id, full_name, phone, email, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
                        [customerId, customer_name.trim(), phone, customer_email || null, notes || 'Walk-in buyer']
                    );
                }
            } else {
                await conn.execute(
                    'INSERT INTO customers (id, full_name, phone, email, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
                    [customerId, customer_name.trim(), null, customer_email || null, notes || 'Walk-in buyer']
                );
            }

            // 3. Insert sale ledger entry
            const saleId = crypto.randomUUID();
            await conn.execute(
                `INSERT INTO sales (
                    id, customer_id, inventory_id, final_price, sale_date, 
                    purchase_cost_snapshot, profit, sale_type, status, payment_status, notes, sold_by, created_at
                ) VALUES (?, ?, ?, ?, CURDATE(), ?, ?, ?, 'completed', 'paid', ?, ?, NOW())`,
                [saleId, customerId, inventory_id, finalPriceNum, purchaseCost, netProfit, sale_type, notes || 'Direct showroom sale', req.user.id]
            );

            // 4. Update inventory status to 'sold'
            await conn.execute('UPDATE inventory SET status = "sold", updated_at = NOW() WHERE id = ?', [inventory_id]);

            // 5. Audit log
            const vehicleTitle = `${car.year} ${car.make} ${car.model} (${car.registration_no || 'No Reg'})`;
            await conn.execute(
                `INSERT INTO audit_logs (id, user_id, action, target_type, target_name, details, created_at)
                 VALUES (?, ?, 'Direct Sale Recorded', 'Vehicle Sale', ?, ?, NOW())`,
                [
                    crypto.randomUUID(),
                    req.user.id,
                    vehicleTitle,
                    `Sold to ${customer_name.trim()} for ₹${finalPriceNum.toLocaleString('en-IN')} (Cost: ₹${purchaseCost.toLocaleString('en-IN')}, Net Profit: ₹${netProfit.toLocaleString('en-IN')})`
                ]
            );

            return {
                sale_id: saleId,
                customer_id: customerId,
                inventory_id,
                profit: netProfit,
                final_price: finalPriceNum
            };
        });

        return res.json({ success: true, data: result });
    } catch (err) {
        console.error('Transaction error in /record-sale-transaction:', err);
        return res.status(400).json({ error: err.message || 'Transaction failed' });
    }
});

export default router;
