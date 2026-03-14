const express = require('express');
const path = require('path');
const multer = require('multer');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Sadece PDF, JPG ve PNG dosyaları kabul edilmektedir.'));
  }
});

router.get('/', (req, res) => {
  const { type, page = 1, limit = 10 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const typeFilter = type ? 'WHERE type = ?' : '';
  const params = type ? [type] : [];

  const total = db.prepare(`SELECT COUNT(*) as count FROM expenses ${typeFilter}`).get(params).count;
  const expenses = db.prepare(`SELECT * FROM expenses ${typeFilter} ORDER BY date DESC LIMIT ? OFFSET ?`).all([...params, parseInt(limit), offset]);

  res.json({ expenses, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
});

router.get('/summary', (req, res) => {
  const income = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE type = 'income'`).get([]);
  const expense = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE type = 'expense'`).get([]);
  res.json({
    totalIncome: income.total,
    totalExpense: expense.total,
    balance: income.total - expense.total
  });
});

router.post('/', authenticateToken, upload.single('invoice'), (req, res) => {
  const { title, description, amount, type = 'expense', date } = req.body;
  if (!title || !amount || !date) {
    return res.status(400).json({ error: 'Başlık, tutar ve tarih gereklidir.' });
  }

  const result = db.prepare(
    'INSERT INTO expenses (title, description, amount, type, date, invoice_path, invoice_original_name, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run([title, description || null, parseFloat(amount), type, date, req.file?.filename || null, req.file?.originalname || null, req.user.id]);

  res.status(201).json({ id: result.lastInsertRowid, title, amount, type, date });
});

router.delete('/:id', authenticateToken, (req, res) => {
  const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get([req.params.id]);
  if (!expense) return res.status(404).json({ error: 'Kayıt bulunamadı.' });

  if (expense.invoice_path) {
    const fs = require('fs');
    const filePath = path.join(__dirname, '../../uploads', expense.invoice_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  db.prepare('DELETE FROM expenses WHERE id = ?').run([req.params.id]);
  res.json({ success: true });
});

module.exports = router;
