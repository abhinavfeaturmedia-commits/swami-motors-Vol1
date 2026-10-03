import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'swami_motors_default_jwt_secret_key_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Authentication middleware to extract user from Bearer token
export async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        req.user = null;
        next();
    }
}

// Enforce login middleware
export function requireAuth(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }
    next();
}

// Enforce admin role middleware
export function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { email, password, full_name, phone } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check if user already exists
        const existingUsers = await query('SELECT id FROM profiles WHERE email = ? LIMIT 1', [normalizedEmail]);
        if (existingUsers && existingUsers.length > 0) {
            return res.status(400).json({ error: 'An account with this email already exists.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const newUserId = crypto.randomUUID();
        const userName = (full_name || email.split('@')[0]).trim();
        const userPhone = phone ? phone.trim() : null;

        await query(
            'INSERT INTO profiles (id, email, password_hash, full_name, phone, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [newUserId, normalizedEmail, password_hash, userName, userPhone, 'customer', 1]
        );

        // Issue JWT token
        const tokenPayload = {
            id: newUserId,
            email: normalizedEmail,
            role: 'customer',
            full_name: userName
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        const profile = {
            id: newUserId,
            email: normalizedEmail,
            full_name: userName,
            phone: userPhone,
            role: 'customer',
            is_active: 1
        };

        return res.json({
            access_token: token,
            token_type: 'bearer',
            expires_in: 7 * 24 * 3600,
            user: {
                id: newUserId,
                email: normalizedEmail,
                role: 'customer',
                user_metadata: {
                    full_name: userName,
                    role: 'customer'
                }
            },
            profile,
            permissions: {}
        });
    } catch (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ error: 'Internal server error during registration' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Fetch user profile from MySQL
        const users = await query('SELECT * FROM profiles WHERE email = ? LIMIT 1', [email.trim().toLowerCase()]);
        if (!users || users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users[0];

        // Check if account is active
        if (user.is_active === 0 || user.is_active === false) {
            return res.status(403).json({ error: 'Account is deactivated. Contact administrator.' });
        }

        // Verify bcrypt password hash
        if (!user.password_hash) {
            return res.status(401).json({ error: 'No password set for this account. Contact administrator.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Fetch permissions for staff
        let permissions = {};
        if (user.role !== 'admin') {
            const perms = await query('SELECT module, can_view, can_manage FROM user_permissions WHERE user_id = ?', [user.id]);
            perms.forEach(p => {
                permissions[p.module] = {
                    module: p.module,
                    can_view: Boolean(p.can_view),
                    can_manage: Boolean(p.can_manage)
                };
            });
        }

        // Issue JWT token
        const tokenPayload = {
            id: user.id,
            email: user.email,
            role: user.role,
            full_name: user.full_name
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        // Clean user object (remove password_hash)
        const profile = { ...user };
        delete profile.password_hash;

        return res.json({
            access_token: token,
            token_type: 'bearer',
            expires_in: 7 * 24 * 3600,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                user_metadata: {
                    full_name: user.full_name,
                    role: user.role
                }
            },
            profile,
            permissions
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Internal server error during login' });
    }
});

// GET /api/auth/me (Get current session/profile)
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ user: null, session: null });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const users = await query('SELECT * FROM profiles WHERE id = ? LIMIT 1', [decoded.id]);

        if (!users || users.length === 0) {
            return res.status(401).json({ user: null, session: null });
        }

        const profile = { ...users[0] };
        delete profile.password_hash;

        let permissions = {};
        if (profile.role !== 'admin') {
            const perms = await query('SELECT module, can_view, can_manage FROM user_permissions WHERE user_id = ?', [profile.id]);
            perms.forEach(p => {
                permissions[p.module] = {
                    module: p.module,
                    can_view: Boolean(p.can_view),
                    can_manage: Boolean(p.can_manage)
                };
            });
        }

        return res.json({
            user: {
                id: profile.id,
                email: profile.email,
                role: profile.role,
                user_metadata: {
                    full_name: profile.full_name,
                    role: profile.role
                }
            },
            profile,
            permissions
        });
    } catch (err) {
        return res.status(401).json({ user: null, session: null, error: 'Invalid or expired token' });
    }
});

// POST /api/auth/staff-create (Admin creates staff user)
router.post('/staff-create', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { email, password, full_name, phone, role = 'sales', department = 'Sales' } = req.body;

        if (!email || !password || !full_name) {
            return res.status(400).json({ error: 'Email, password, and full name are required' });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check if user already exists
        const existingUsers = await query('SELECT id FROM profiles WHERE email = ? LIMIT 1', [normalizedEmail]);
        if (existingUsers && existingUsers.length > 0) {
            return res.status(400).json({ error: 'An account with this email already exists.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const newUserId = crypto.randomUUID();
        const userName = full_name.trim();
        const userPhone = phone ? phone.trim() : null;

        await query(
            'INSERT INTO profiles (id, email, password_hash, full_name, phone, role, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [newUserId, normalizedEmail, password_hash, userName, userPhone, role, 1, new Date()]
        );

        // Default permissions for staff
        const defaultModules = ['leads', 'inventory', 'customers', 'bookings', 'calendar', 'planner', 'attendance'];
        for (const mod of defaultModules) {
            const canManage = role === 'admin' ? 1 : (['leads', 'bookings'].includes(mod) ? 1 : 0);
            await query(
                'INSERT INTO user_permissions (id, user_id, module, can_view, can_manage, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                [crypto.randomUUID(), newUserId, mod, 1, canManage, new Date()]
            );
        }

        return res.json({
            success: true,
            user: {
                id: newUserId,
                email: normalizedEmail,
                full_name: userName,
                role,
                department
            }
        });
    } catch (err) {
        console.error('Staff creation error:', err);
        return res.status(500).json({ error: 'Internal server error creating staff member: ' + err.message });
    }
});

// POST /api/auth/staff-reset-password (Admin or user resets password)
router.post('/staff-reset-password', requireAuth, async (req, res) => {
    try {
        const { user_id, new_password } = req.body;

        if (!user_id || !new_password) {
            return res.status(400).json({ error: 'user_id and new_password are required' });
        }

        // If not admin, user can only reset their own password
        if (req.user.role !== 'admin' && req.user.id !== user_id) {
            return res.status(403).json({ error: 'Forbidden: You cannot change another user\'s password' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(new_password, salt);

        await query('UPDATE profiles SET password_hash = ?, updated_at = ? WHERE id = ?', [password_hash, new Date(), user_id]);

        return res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        console.error('Password reset error:', err);
        return res.status(500).json({ error: 'Internal server error updating password: ' + err.message });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    return res.json({ success: true });
});

export default router;

