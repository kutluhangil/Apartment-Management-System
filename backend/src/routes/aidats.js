const express = require('express');
const { getAll, getOne, run } = require('../db/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res, next) => {
  try {
    res.json(await getAll('SELECT * FROM aidats ORDER BY year DESC, month DESC'));
  } catch (err) { next(err); }
});

router.get('/:id/payments', authenticateToken, async (req, res, next) => {
  try {
    const rows = await getAll(`
      SELECT ap.*, a.number as apartment_number, a.owner_name, a.room_type
      FROM aidat_payments ap
      JOIN apartments a ON ap.apartment_id = a.id
      WHERE ap.aidat_id = ?
      ORDER BY a.number ASC
    `, [req.params.id]);
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res, next) => {
  try {
    const { month, year, amount_2plus1, amount_3plus1 } = req.body;
    if (!month || !year) return res.status(400).json({ error: 'Ay ve yıl gereklidir.' });

    const val2plus1 = amount_2plus1 || 800;
    const val3plus1 = amount_3plus1 || 1000;

    const existing = await getOne('SELECT id FROM aidats WHERE month = ? AND year = ?', [month, year]);
    if (existing) return res.status(409).json({ error: 'Bu ay ve yıl için zaten aidat dönemi mevcut.' });

    const { lastInsertRowid: aidatId } = await run(
      'INSERT INTO aidats (month, year, amount) VALUES (?, ?, ?)', [month, year, val3plus1]
    );
    const apartments = await getAll('SELECT id, room_type FROM apartments');
    for (const apt of apartments) {
      const individualAmount = apt.room_type === '2+1' ? val2plus1 : val3plus1;
      await run('INSERT INTO aidat_payments (aidat_id, apartment_id, status, amount) VALUES (?, ?, ?, ?)',
        [aidatId, Number(apt.id), 'unpaid', individualAmount]);
    }
    res.status(201).json({ id: aidatId, month, year, amount });
  } catch (err) { next(err); }
});

router.put('/payments/:id', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res, next) => {
  try {
    const { status, note, paid_at } = req.body;
    const paidAt = status === 'paid' ? (paid_at || new Date().toISOString()) : null;
    await run('UPDATE aidat_payments SET status = ?, note = ?, paid_at = ? WHERE id = ?',
      [status, note || null, paidAt, req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res, next) => {
  try {
    const aidat = await getOne('SELECT id FROM aidats WHERE id = ?', [req.params.id]);
    if (!aidat) return res.status(404).json({ error: 'Dönem bulunamadı.' });

    await run('DELETE FROM aidat_payments WHERE aidat_id = ?', [req.params.id]);
    await run('DELETE FROM aidats WHERE id = ?', [req.params.id]);

    res.json({ success: true });
  } catch (err) { next(err); }
});

router.get('/:id/stats', authenticateToken, async (req, res, next) => {
  try {
    const aidat = await getOne('SELECT * FROM aidats WHERE id = ?', [req.params.id]);
    if (!aidat) return res.status(404).json({ error: 'Dönem bulunamadı.' });

    const stats = await getOne(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'unpaid' THEN 1 ELSE 0 END) as unpaid_count,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as collected,
        SUM(amount) as total_expected
      FROM aidat_payments WHERE aidat_id = ?
    `, [req.params.id]);

    res.json({
      ...Object.fromEntries(Object.entries(aidat)),
      ...Object.fromEntries(Object.entries(stats)),
      collected: Number(stats.collected || 0),
      total_expected: Number(stats.total_expected || 0)
    });
  } catch (err) { next(err); }
});

module.exports = router;
