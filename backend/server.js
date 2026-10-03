import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

import { checkConnection } from './db.js';
import authRouter, { authenticateToken } from './routes/auth.js';
import dataRouter from './routes/data.js';
import uploadRouter from './routes/upload.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors({
    origin: true,
    credentials: true
}));

// Body Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Global JWT Token decoder
app.use(authenticateToken);

// Serve static uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/data', dataRouter);
app.use('/api/upload', uploadRouter);

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

// Serve frontend static build from public/
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));

    // Client-side routing fallback for React Router
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
            status: 'Frontend build not yet staged in backend/public. Run npm run build and stage files.'
        });
    });
}

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`🚀 Swami Motors Server running on port ${PORT}`);
    console.log(`🌐 Target Domain: https://autokundali.com`);
});
