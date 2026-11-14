import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { requireAuth } from './auth.js';
import { getPool } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Persistent uploads directory logic (supports Hostinger public_html or environment override or local fallback)
function resolveUploadsDir() {
    if (process.env.UPLOADS_DIR) {
        return process.env.UPLOADS_DIR;
    }
    const candidates = [
        '/home/u750566272/domains/autokundali.com/public_html/uploads',
        '/home/u750566272/public_html/uploads',
        path.join(__dirname, '..', 'uploads'),
        path.join(process.cwd(), 'uploads')
    ];
    for (const c of candidates) {
        const parent = path.dirname(c);
        if (fs.existsSync(parent)) {
            return c;
        }
    }
    return path.join(__dirname, '..', 'uploads');
}

const uploadsDir = resolveUploadsDir();
const carsUploadsDir = path.join(uploadsDir, 'cars');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(carsUploadsDir)) fs.mkdirSync(carsUploadsDir, { recursive: true });

/**
 * Persists an uploaded file buffer directly into the MySQL file_storage table as LONGBLOB
 */
async function saveFileToMySQL(filePath, filename, mimeType) {
    try {
        const pool = getPool();
        if (!pool) throw new Error('Database pool not available');
        const fileBuffer = fs.readFileSync(filePath);
        const id = crypto.randomUUID();
        const size = fileBuffer.length;

        await pool.execute(
            `INSERT INTO file_storage (id, filename, mime_type, data, size) 
             VALUES (?, ?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE data = VALUES(data), size = VALUES(size), mime_type = VALUES(mime_type)`,
            [id, filename, mimeType || 'image/jpeg', fileBuffer, size]
        );
        return `/uploads/cars/${filename}`;
    } catch (err) {
        console.error('[MySQL File Storage Error]:', err.message);
        return null;
    }
}

// Configure Multer storage with sanitized filenames
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, carsUploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname).toLowerCase();
        const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50) || 'upload';
        cb(null, `${baseName}-${uniqueSuffix}${ext}`);
    }
});

const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'pdf']);
const ALLOWED_MIMES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
]);

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const mime = (file.mimetype || '').toLowerCase();

    if (ALLOWED_EXTENSIONS.has(ext) && ALLOWED_MIMES.has(mime)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, PNG, WEBP images and PDF documents are permitted.'));
    }
};

const upload = multer({
    storage,
    limits: { 
        fileSize: 10 * 1024 * 1024, // 10MB max per file
        files: 20
    },
    fileFilter
});

/**
 * Verify genuine magic bytes to prevent polyglot / extension-spoofing attacks
 */
function verifyMagicBytes(filePath) {
    try {
        const buffer = Buffer.alloc(12);
        const fd = fs.openSync(filePath, 'r');
        fs.readSync(fd, buffer, 0, 12, 0);
        fs.closeSync(fd);

        // JPEG: FF D8 FF
        if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true;
        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true;
        // WEBP: RIFF .... WEBP
        if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return true;
        // PDF: %PDF
        if (buffer.toString('ascii', 0, 4) === '%PDF') return true;

        return false;
    } catch (e) {
        return false;
    }
}

// Security: Check Content-Length header before buffering large payloads
function checkContentLength(maxBytes) {
    return (req, res, next) => {
        const len = parseInt(req.headers['content-length'] || '0', 10);
        if (len > maxBytes) {
            return res.status(413).json({ error: `Payload too large. Maximum allowed size is ${Math.round(maxBytes / 1024 / 1024)}MB.` });
        }
        next();
    };
}

// ─── POST /api/upload/single (Authenticated Staff/Admin) ──────────────────────
router.post('/single', requireAuth, checkContentLength(12 * 1024 * 1024), upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded or file rejected by security filter.' });
    }

    // Verify magic bytes
    const isValid = verifyMagicBytes(req.file.path);
    if (!isValid) {
        fs.unlink(req.file.path, () => {});
        return res.status(400).json({ error: 'Security verification failed: File content does not match allowed format signature.' });
    }

    // Store image binary directly into MySQL file_storage table
    await saveFileToMySQL(req.file.path, req.file.filename, req.file.mimetype);
    const publicUrl = `/uploads/cars/${req.file.filename}`;

    return res.json({
        url: publicUrl,
        filename: req.file.filename,
        size: req.file.size
    });
});

// ─── POST /api/upload/multiple (Authenticated Staff/Admin) ────────────────────
router.post('/multiple', requireAuth, checkContentLength(60 * 1024 * 1024), upload.array('files', 20), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded or files rejected by security filter.' });
    }

    const validFiles = [];
    for (const f of req.files) {
        if (verifyMagicBytes(f.path)) {
            await saveFileToMySQL(f.path, f.filename, f.mimetype);
            const publicUrl = `/uploads/cars/${f.filename}`;

            validFiles.push({
                url: publicUrl,
                filename: f.filename,
                size: f.size
            });
        } else {
            // Delete spoofed or invalid file
            fs.unlink(f.path, () => {});
        }
    }

    if (validFiles.length === 0) {
        return res.status(400).json({ error: 'All uploaded files failed file format signature validation.' });
    }

    return res.json({ files: validFiles });
});

export default router;
