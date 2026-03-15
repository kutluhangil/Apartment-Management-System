const express = require('express');
const multer = require('multer');
const { put, del } = require('@vercel/blob');
const { getAll, getOne, run } = require('../db/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Sadece PDF, DOCX, JPG ve PNG dosyaları kabul edilmektedir.'));
  }
});

router.get('/', async (req, res, next) => {
  try {
    const docs = await getAll('SELECT * FROM documents ORDER BY upload_date DESC');
    res.json(docs);
  } catch (err) { next(err); }
});

router.post('/', authenticateToken, authorizeRole(['admin', 'manager']), upload.single('file'), async (req, res, next) => {
  try {
    const { title, description } = req.body;
    if (!title || !req.file) return res.status(400).json({ error: 'Başlık ve dosya gereklidir.' });
    
    // Upload to Vercel Blob
    const blob = await put(req.file.originalname, req.file.buffer, { 
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN // Should be auto-detected in Vercel, but good practice
    }).catch(e => {
        // Fallback for local development if BLOB token is missing
        console.warn("Vercel blob upload failed (likely missing token). Throwing error.", e);
        throw new Error("Dosya yükleme BLOB hatası. .env token kontrol edin.");
    });

    const date = new Date().toISOString().split('T')[0];
    const result = await run('INSERT INTO documents (title, description, file_url, upload_date, uploaded_by) VALUES (?, ?, ?, ?, ?)', 
      [title, description || null, blob.url, date, req.user.id]);
    
    // Log audit
    await run('INSERT INTO audit_logs (user_id, action_type, target_entity, details) VALUES (?, ?, ?, ?)', 
      [req.user.id, 'CREATE', 'document', 'Belge Eklendi: ' + title]);

    res.status(201).json({ id: result.lastInsertRowid, title, url: blob.url });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res, next) => {
  try {
    const doc = await getOne('SELECT * FROM documents WHERE id = ?', [req.params.id]);
    if (!doc) return res.status(404).json({ error: 'Bulunamadı' });

    // Try deleting from blob 
    try {
        await del(doc.file_url);
    } catch(e) { console.warn("Blob delete fail", e); }

    await run('DELETE FROM documents WHERE id = ?', [req.params.id]);

    await run('INSERT INTO audit_logs (user_id, action_type, target_entity, details) VALUES (?, ?, ?, ?)', 
      [req.user.id, 'DELETE', 'document', 'Belge Silindi: ' + doc.title]);

    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
