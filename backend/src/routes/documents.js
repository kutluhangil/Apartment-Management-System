const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getAll, getOne, run } = require('../db/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const router = express.Router();

const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

// Local uploads directory (used when Vercel Blob token is absent)
const uploadsDir = path.join(__dirname, '../../uploads');
if (!useBlob && !fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = useBlob
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: uploadsDir,
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9).toString(36)}${ext}`);
      }
    });

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Sadece PDF, DOCX, JPG ve PNG dosyaları kabul edilmektedir.'));
  }
});

router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const docs = await getAll('SELECT * FROM documents ORDER BY upload_date DESC');
    res.json(docs);
  } catch (err) { next(err); }
});

router.post('/', authenticateToken, authorizeRole(['admin', 'manager']), upload.single('file'), async (req, res, next) => {
  try {
    const { title, description } = req.body;
    if (!title || !req.file) return res.status(400).json({ error: 'Başlık ve dosya gereklidir.' });

    let fileUrl;
    if (useBlob) {
      const { put } = require('@vercel/blob');
      const blob = await put(req.file.originalname, req.file.buffer, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN
      });
      fileUrl = blob.url;
    } else {
      fileUrl = `/uploads/${req.file.filename}`;
    }

    const date = new Date().toISOString().split('T')[0];
    const result = await run('INSERT INTO documents (title, description, file_url, upload_date, uploaded_by) VALUES (?, ?, ?, ?, ?)',
      [title, description || null, fileUrl, date, req.user.id]);

    await run('INSERT INTO audit_logs (user_id, action_type, target_entity, details) VALUES (?, ?, ?, ?)',
      [req.user.id, 'CREATE', 'document', 'Belge Eklendi: ' + title]);

    res.status(201).json({ id: result.lastInsertRowid, title, url: fileUrl });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res, next) => {
  try {
    const doc = await getOne('SELECT * FROM documents WHERE id = ?', [req.params.id]);
    if (!doc) return res.status(404).json({ error: 'Bulunamadı' });

    // Try deleting the file (blob or local)
    try {
      if (useBlob && doc.file_url.startsWith('http')) {
        const { del } = require('@vercel/blob');
        await del(doc.file_url);
      } else if (doc.file_url.startsWith('/uploads/')) {
        const localPath = path.join(uploadsDir, path.basename(doc.file_url));
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
      }
    } catch(e) { console.warn("File delete fail", e); }

    await run('DELETE FROM documents WHERE id = ?', [req.params.id]);

    await run('INSERT INTO audit_logs (user_id, action_type, target_entity, details) VALUES (?, ?, ?, ?)', 
      [req.user.id, 'DELETE', 'document', 'Belge Silindi: ' + doc.title]);

    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
