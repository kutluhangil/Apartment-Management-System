const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const aidats = db.prepare('SELECT * FROM aidats ORDER BY year DESC, month DESC').all([]);
  res.json(aidats);
});

router.get('/:id/payments', authenticateToken, (req, res) => {
  const payments = db.prepare(`
    SELECT ap.*, a.number as apartment_number, a.owner_name
    FROM aidat_payments ap
    JOIN apartments a ON ap.apartment_id = a.id
    WHERE ap.aidat_id = ?
    ORDER BY a.number ASC
  `).all([req.params.id]);
  res.json(payments);
});

router.post('/', authenticateToken, (req, res) => {
  const { month, year, amount } = req.body;
  if (!month || !year || !amount) {
    return res.status(400).json({ error: 'Ay, yıl ve tutar gereklidir.' });
  }

  try {
    const result = db.prepare('INSERT INTO aidats (month, year, amount) VALUES (?, ?, ?)').run([month, year, amount]);
    const aidatId = result.lastInsertRowid;

    const apartments = db.prepare('SELECT id FROM apartments').all([]);
    const insertPayment = db.prepare('INSERT INTO aidat_payments (aidat_id, apartment_id, status) VALUES (?, ?, ?)');
    for (const apt of apartments) {
      insertPayment.run([aidatId, apt.id, 'unpaid']);
    }

    res.status(201).json({ id: aidatId, month, year, amount });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Bu ay ve yıl için zaten aidat dönemi mevcut.' });
    }
    throw err;
  }
});

router.put('/payments/:id', authenticateToken, (req, res) => {
  const { status, note, paid_at } = req.body;
  const paidAt = status === 'paid' ? (paid_at || new Date().toISOString()) : null;
  db.prepare('UPDATE aidat_payments SET status = ?, note = ?, paid_at = ? WHERE id = ?').run([
    status, note || null, paidAt, req.params.id
  ]);
  res.json({ success: true });
});

router.get('/:id/stats', authenticateToken, (req, res) => {
  const aidat = db.prepare('SELECT * FROM aidats WHERE id = ?').get([req.params.id]);
  if (!aidat) return res.status(404).json({ error: 'Dönem bulunamadı.' });

  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
      SUM(CASE WHEN status = 'unpaid' THEN 1 ELSE 0 END) as unpaid_count
    FROM aidat_payments WHERE aidat_id = ?
  `).get([req.params.id]);

  res.json({ ...aidat, ...stats, collected: stats.paid_count * aidat.amount });
});

module.exports = router;
