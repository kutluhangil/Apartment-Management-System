const express = require('express');
const path = require('path');
const multer = require('multer');
const { getAll, getOne, run } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads dir exists
const uploadsDir = path.join(__dirname, '../../uploads');
const fs = require('fs');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname))
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

router.get('/', async (req, res, next) => {
  try {
    const { type, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const typeFilter = type ? 'WHERE type = ?' : '';
    const args = type ? [type] : [];

    const countRow = await getOne(`SELECT COUNT(*) as count FROM expenses ${typeFilter}`, args);
    const total = Number(countRow.count);
    const expenses = await getAll(
      `SELECT * FROM expenses ${typeFilter} ORDER BY date DESC LIMIT ? OFFSET ?`,
      [...args, parseInt(limit), offset]
    );
    res.json({ expenses, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { next(err); }
});

router.get('/summary', async (req, res, next) => {
  try {
    const income = await getOne(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE type = 'income'`);
    const expense = await getOne(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE type = 'expense'`);
    res.json({
      totalIncome: Number(income.total),
      totalExpense: Number(expense.total),
      balance: Number(income.total) - Number(expense.total)
    });
  } catch (err) { next(err); }
});

router.post('/', authenticateToken, upload.single('invoice'), async (req, res, next) => {
  try {
    const { title, description, amount, type = 'expense', date } = req.body;
    if (!title || !amount || !date) return res.status(400).json({ error: 'Başlık, tutar ve tarih gereklidir.' });

    const { lastInsertRowid } = await run(
      'INSERT INTO expenses (title, description, amount, type, date, invoice_path, invoice_original_name, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description || null, parseFloat(amount), type, date, req.file?.filename || null, req.file?.originalname || null, req.user.id]
    );
    res.status(201).json({ id: lastInsertRowid, title, amount, type, date });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const expense = await getOne('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
    if (!expense) return res.status(404).json({ error: 'Kayıt bulunamadı.' });

    if (expense.invoice_path) {
      const filePath = path.join(uploadsDir, expense.invoice_path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await run('DELETE FROM expenses WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
