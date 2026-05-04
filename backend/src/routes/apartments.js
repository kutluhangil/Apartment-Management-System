const express = require('express');
const { getAll, getOne, run } = require('../db/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Vercel only allows writing to /tmp
const uploadDest = process.env.VERCEL ? '/tmp' : path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDest)) fs.mkdirSync(uploadDest, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDest),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const safeName = Math.round(Math.random() * 1e9).toString(36);
    cb(null, `${Date.now()}-${safeName}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedExt = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowedMime.includes(file.mimetype) || !allowedExt.includes(ext)) {
      return cb(new Error('Yalnızca JPG, PNG veya WEBP formatlarına izin verilir.'));
    }
    cb(null, true);
  }
});

const router = express.Router();

router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const rows = await getAll('SELECT * FROM apartments ORDER BY number ASC');
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const apt = await getOne('SELECT * FROM apartments WHERE id = ?', [req.params.id]);
    if (!apt) return res.status(404).json({ error: 'Daire bulunamadı.' });
    res.json(apt);
  } catch (err) { next(err); }
});

router.put('/:id', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res, next) => {
  try {
    const { owner_name, floor, profession, notes, owner_photo, room_type } = req.body;
    await run('UPDATE apartments SET owner_name = ?, floor = ?, profession = ?, notes = ?, owner_photo = ?, room_type = ? WHERE id = ?',
      [owner_name, floor, profession || null, notes || null, owner_photo || null, room_type || '3+1', req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.get('/:id/aidats', authenticateToken, async (req, res, next) => {
  try {
    const rows = await getAll(`
      SELECT ap.status, ap.paid_at, ap.note, a.month, a.year, a.amount
      FROM aidat_payments ap
      JOIN aidats a ON ap.aidat_id = a.id
      WHERE ap.apartment_id = ?
      ORDER BY a.year DESC, a.month DESC
    `, [req.params.id]);
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/:id/photo', authenticateToken, authorizeRole(['admin', 'manager']), upload.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Dosya yüklenemedi.' });
    
    // Store relative path
    const photoPath = `/uploads/${req.file.filename}`;
    
    await run('UPDATE apartments SET owner_photo = ? WHERE id = ?', [photoPath, req.params.id]);
    
    // In Vercel, this won't persist across instances, but /tmp is the only writable place.
    // For a real production app you would use S3/Cloudinary here.
    res.json({ success: true, url: photoPath });
  } catch (err) { next(err); }
});

module.exports = router;
