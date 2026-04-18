const express = require('express');
const path = require('path');
const multer = require('multer');
const { getAll, getOne, run } = require('../db/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads dir exists (use /tmp on Vercel serverless, else local uploads dir)
const isVercel = !!process.env.VERCEL;
const uploadsDir = isVercel ? '/tmp' : path.join(__dirname, '../../uploads');
const fs = require('fs');
if (!isVercel && !fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = Math.round(Math.random() * 1e9).toString(36);
    cb(null, `${Date.now()}-${safeName}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    const mimeAllowed = ['application/pdf', 'image/jpeg', 'image/png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext) && mimeAllowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Sadece PDF, JPG ve PNG dosyaları kabul edilmektedir.'));
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { type, month, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let filters = [];
    let args = [];
    
    if (type) {
      filters.push('type = ?');
      args.push(type);
    }
    if (month) {
      filters.push("date LIKE ?");
      args.push(`${month}-%`);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const countRow = await getOne(`SELECT COUNT(*) as count FROM expenses ${whereClause}`, args);
    const total = Number(countRow.count);
    const expenses = await getAll(
      `SELECT * FROM expenses ${whereClause} ORDER BY date DESC LIMIT ? OFFSET ?`,
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

router.post('/', authenticateToken, authorizeRole(['admin', 'manager']), upload.single('invoice'), async (req, res, next) => {
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

router.delete('/:id', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res, next) => {
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
