import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler, apiResponse } from '../lib/utils.js';

const router = Router();

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung. Hanya JPG, PNG, dan PDF yang diperbolehkan.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// POST /api/upload
router.post(
  '/',
  requireAuth,
  requireRole('admin', 'finance'),
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Tidak ada file yang diunggah' });
      return;
    }

    // Relative path to be saved in DB
    const fileUrl = `/public/uploads/${req.file.filename}`;
    
    res.status(201).json(apiResponse({ url: fileUrl }, 'File berhasil diunggah'));
  })
);
// GET /api/upload/preview/:b64name
router.get('/preview/:b64name', (req, res) => {
  try {
    const filename = Buffer.from(req.params.b64name, 'base64').toString('utf8');
    const filepath = path.join(uploadDir, filename);
    if (fs.existsSync(filepath)) {
      res.sendFile(filepath);
    } else {
      res.status(404).send('File not found');
    }
  } catch (err) {
    res.status(400).send('Invalid request');
  }
});

export default router;
