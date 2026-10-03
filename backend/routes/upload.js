import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure upload directories exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
const carsUploadsDir = path.join(uploadsDir, 'cars');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(carsUploadsDir)) fs.mkdirSync(carsUploadsDir, { recursive: true });

// Configure Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, carsUploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname).toLowerCase();
        const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '');
        cb(null, `${baseName}-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|pdf/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const mime = file.mimetype;

    if (allowedTypes.test(ext) || allowedTypes.test(mime)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files (JPG, PNG, WEBP) and PDF documents are allowed'));
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max per image
    fileFilter
});

// Single file upload
router.post('/single', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const publicUrl = `/uploads/cars/${req.file.filename}`;
    return res.json({
        url: publicUrl,
        filename: req.file.filename,
        size: req.file.size
    });
});

// Multiple file upload
router.post('/multiple', upload.array('files', 20), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }
    const files = req.files.map(f => ({
        url: `/uploads/cars/${f.filename}`,
        filename: f.filename,
        size: f.size
    }));
    return res.json({ files });
});

export default router;
