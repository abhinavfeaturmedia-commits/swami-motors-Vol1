import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

import { checkConnection, getPool } from './db.js';
import authRouter, { authenticateToken } from './routes/auth.js';
import dataRouter from './routes/data.js';
import uploadRouter from './routes/upload.js';
import aiRouter from './routes/ai.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust reverse proxy (Hostinger Passenger / Nginx proxy)
app.set('trust proxy', 1);

// ─── 1. HTTP Security Headers (Helmet) ────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
            imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
            connectSrc: [
                "'self'", 
                'https://autokundali.com', 
                'https://www.autokundali.com', 
                'https://openrouter.ai', 
                'https://*.supabase.co',
                'http://localhost:*'
            ],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// ─── 2. Strict CORS Policy ───────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
    'https://autokundali.com',
    'https://www.autokundali.com',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
];

// Helper to allow local development / private LAN IPs (e.g. 192.168.x.x, 10.x.x.x, localhost)
const isLocalOrPrivateOrigin = (origin) => {
    return /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin);
};

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (
            ALLOWED_ORIGINS.includes(origin) || 
            origin.endsWith('.autokundali.com') ||
            isLocalOrPrivateOrigin(origin)
        ) {
            return callback(null, true);
        }
        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Prefer', 'apikey', 'X-Requested-With']
}));

// ─── 3. Rate Limiters ────────────────────────────────────────────────────────
// General API Rate Limiter: max 3000 requests per 15 minutes per IP
// Authenticated requests (Bearer token) and local LAN requests are exempted
const generalApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3000,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting if user is authenticated via Bearer token
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            return true;
        }
        // Skip rate limiting for local development or LAN IPs
        const ip = req.ip || req.connection?.remoteAddress || '';
        if (ip.includes('127.0.0.1') || ip.includes('::1') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
            return true;
        }
        return false;
    },
    message: { error: 'Too many requests from this IP. Please try again after 15 minutes.' }
});

// Auth Rate Limiter (Login / Register): max 15 attempts per 15 minutes per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

// AI Chatbot Rate Limiter: max 25 calls per 15 minutes per IP
const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 25,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'AI inquiry rate limit exceeded. Please wait a few minutes before chatting again.' }
});

app.use('/api/', generalApiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/ai/', aiLimiter);

// ─── 4. Body Parsers & Middleware ────────────────────────────────────────────
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Global JWT Token decoder
app.use(authenticateToken);

// Serve static uploads with caching headers (supports persistent Hostinger public_html directory + Cloud fallback)
const candidateUploadDirs = [
    process.env.UPLOADS_DIR,
    '/home/u750566272/domains/autokundali.com/public_html/uploads',
    '/home/u750566272/public_html/uploads',
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'public', 'uploads')
].filter(Boolean);

candidateUploadDirs.forEach(dir => {
    try {
        if (!fs.existsSync(dir)) {
            const parent = path.dirname(dir);
            if (fs.existsSync(parent)) fs.mkdirSync(dir, { recursive: true });
        }
    } catch (_) {}
    if (fs.existsSync(dir)) {
        app.use('/uploads', express.static(dir, {
            maxAge: '7d',
            immutable: true,
            setHeaders: (res) => {
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            }
        }));
    }
});

// ─── 4b. High-Performance MySQL Binary Image Streaming ─────────────────────
// Serves images directly from MySQL file_storage table with 1-year browser caching
app.get(['/uploads/cars/:filename', '/uploads/:folder/:filename', '/api/media/:filename'], async (req, res, next) => {
    const filename = req.params.filename;
    if (!filename) return next();

    try {
        const pool = getPool();
        if (pool) {
            const [rows] = await pool.execute(
                'SELECT data, mime_type, size FROM file_storage WHERE filename = ? LIMIT 1',
                [filename]
            );
            if (rows && rows.length > 0 && rows[0].data) {
                res.setHeader('Content-Type', rows[0].mime_type || 'image/jpeg');
                res.setHeader('Content-Length', rows[0].size || rows[0].data.length);
                res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
                return res.send(rows[0].data);
            }
        }

        // Secondary check: local disk cache if present
        for (const dir of candidateUploadDirs) {
            const filePath = path.join(dir, req.params.folder || 'cars', filename);
            if (fs.existsSync(filePath)) {
                return res.sendFile(filePath);
            }
        }

        next();
    } catch (err) {
        console.error('[MySQL Image Stream Error]:', err.message);
        next();
    }
});

// ─── 5. API Routes ───────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/data', dataRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/ai', aiRouter);

// Health check endpoint
app.get('/api/health', async (req, res) => {
    const dbStatus = await checkConnection();
    res.json({
        status: 'ok',
        domain: 'autokundali.com',
        serverTime: new Date().toISOString(),
        mysql: dbStatus.ok ? 'connected' : `error: ${dbStatus.error}`
    });
});

// ─── 6. Serve Frontend Static SPA ────────────────────────────────────────────
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir, {
        maxAge: '1d',
        setHeaders: (res, filePath) => {
            // Immutable caching for hashed assets
            if (filePath.includes('/assets/')) {
                res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            }
        }
    }));

    // Client-side routing fallback for React Router SPA
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
            return next();
        }
        res.sendFile(path.join(publicDir, 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.json({
            message: 'Swami Motors API Server (autokundali.com) is running.',
            status: 'Frontend build not yet staged in backend/public. Run npm run build.'
        });
    });
}

// ─── 7. Global Error Handler ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    res.status(err.status || 500).json({ 
        error: err.message || 'Internal server error',
        code: err.code || 'SERVER_ERROR'
    });
});

// ─── 8. Server Process Lifecycle & Graceful Shutdown ─────────────────────────
// One-time auto-healing for any cars with missing / broken photo paths
async function autoHealMissingPhotos() {
    try {
        const pool = getPool();
        if (!pool) return;
        const [broken] = await pool.execute(`
            SELECT id, make, model, year, thumbnail, images 
            FROM inventory 
            WHERE deleted_at IS NULL AND (
                thumbnail IS NULL 
                OR thumbnail = '' 
                OR thumbnail = '[]'
                OR thumbnail NOT IN (SELECT CONCAT('/uploads/cars/', filename) FROM file_storage)
            )
            LIMIT 50
        `);
        if (!broken || broken.length === 0) return;
        console.log(`[Photo AutoHeal] Found ${broken.length} vehicles needing photo verification...`);
        for (const car of broken) {
            const [donors] = await pool.execute(`
                SELECT i.thumbnail, i.images 
                FROM inventory i
                JOIN file_storage fs ON fs.filename = SUBSTRING_INDEX(i.thumbnail, '/', -1)
                WHERE i.deleted_at IS NULL 
                  AND i.id != ?
                  AND i.make = ? 
                  AND i.thumbnail IS NOT NULL 
                  AND i.thumbnail != ''
                ORDER BY (i.model = ?) DESC, ABS(i.year - ?) ASC
                LIMIT 1
            `, [car.id, car.make, car.model, car.year]);
            if (donors && donors.length > 0 && donors[0].thumbnail) {
                const thumb = donors[0].thumbnail;
                const imgs = typeof donors[0].images === 'string' ? donors[0].images : JSON.stringify(donors[0].images);
                await pool.execute('UPDATE inventory SET thumbnail = ?, images = ? WHERE id = ?', [thumb, imgs, car.id]);
                console.log(`   ✅ [AutoHeal] Restored photos for ${car.year} ${car.make} ${car.model}`);
            }
        }
    } catch (e) {
        console.warn('[Photo AutoHeal Notice]', e.message);
    }
}

const server = app.listen(PORT, () => {
    console.log(`🚀 Swami Motors Server running on port ${PORT}`);
    console.log(`🌐 Target Domain: https://autokundali.com`);
    autoHealMissingPhotos();
});

const gracefulShutdown = (signal) => {
    console.log(`\n🛑 Received ${signal}. Closing HTTP server and database pool gracefully...`);
    server.close(async () => {
        try {
            const pool = getPool();
            if (pool) {
                await pool.end();
                console.log('   ✅ MySQL pool closed successfully.');
            }
        } catch (e) {
            console.error('   ⚠️ Error closing MySQL pool:', e.message);
        }
        console.log('   👋 Process exiting safely.');
        process.exit(0);
    });

    // Force exit if hanging after 10s
    setTimeout(() => {
        console.error('   ⚠️ Forcefully terminating after timeout.');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Promise Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('🚨 Uncaught Exception thrown:', err);
});
