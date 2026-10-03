import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    return res.json({ success: true });
});

export default router;
