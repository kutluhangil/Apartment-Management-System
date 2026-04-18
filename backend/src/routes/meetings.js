const express = require('express');
const { getAll, getOne, run } = require('../db/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { year, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const yearFilter = year ? "WHERE strftime('%Y', date) = ?" : '';
    const args = year ? [String(year)] : [];

    const countRow = await getOne(`SELECT COUNT(*) as count FROM meetings ${yearFilter}`, args);
    const total = Number(countRow.count);
    const meetings = await getAll(
      `SELECT * FROM meetings ${yearFilter} ORDER BY date DESC LIMIT ? OFFSET ?`,
      [...args, parseInt(limit), offset]
    );
    const parsed = meetings.map(m => ({
      ...Object.fromEntries(Object.entries(m)),
      decisions: m.decisions ? JSON.parse(m.decisions) : []
    }));
    res.json({ meetings: parsed, total, page: parseInt(page) });
  } catch (err) { next(err); }
});

router.post('/', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res, next) => {
  try {
    const { title, meeting_type, date, time, notes, decisions, attendee_count, status } = req.body;
    if (!title || !date) return res.status(400).json({ error: 'Başlık ve tarih gereklidir.' });

    const decisionsJson = Array.isArray(decisions) ? JSON.stringify(decisions) : JSON.stringify([]);
    const { lastInsertRowid } = await run(
      'INSERT INTO meetings (title, meeting_type, date, time, notes, decisions, attendee_count, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, meeting_type || 'GENEL TOPLANTI', date, time || null, notes || null, decisionsJson, attendee_count || 0, status || 'completed', req.user.id]
    );
    res.status(201).json({ id: lastInsertRowid });
  } catch (err) { next(err); }
});

router.put('/:id', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res, next) => {
  try {
    const { title, meeting_type, date, time, notes, decisions, attendee_count, status } = req.body;
    const decisionsJson = Array.isArray(decisions) ? JSON.stringify(decisions) :
      (typeof decisions === 'string' ? decisions : JSON.stringify([]));

    await run(
      'UPDATE meetings SET title=?, meeting_type=?, date=?, time=?, notes=?, decisions=?, attendee_count=?, status=? WHERE id=?',
      [title, meeting_type, date, time, notes, decisionsJson, attendee_count, status, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res, next) => {
  try {
    await run('DELETE FROM meetings WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
