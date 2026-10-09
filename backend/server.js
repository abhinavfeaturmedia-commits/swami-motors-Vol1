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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
// General API Rate Limiter: max 300 requests per 15 minutes per IP
const generalApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
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

// Serve static uploads with caching headers
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir, {
    maxAge: '7d',
    immutable: true
}));

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
const server = app.listen(PORT, () => {
    console.log(`🚀 Swami Motors Server running on port ${PORT}`);
    console.log(`🌐 Target Domain: https://autokundali.com`);
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
