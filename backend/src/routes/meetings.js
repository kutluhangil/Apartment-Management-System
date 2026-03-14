const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { year, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const yearFilter = year ? "WHERE strftime('%Y', date) = ?" : '';
  const params = year ? [String(year)] : [];

  const total = db.prepare(`SELECT COUNT(*) as count FROM meetings ${yearFilter}`).get(params).count;
  const meetings = db.prepare(`SELECT * FROM meetings ${yearFilter} ORDER BY date DESC LIMIT ? OFFSET ?`).all([...params, parseInt(limit), offset]);

  const parsed = meetings.map(m => ({
    ...m,
    decisions: m.decisions ? JSON.parse(m.decisions) : []
  }));

  res.json({ meetings: parsed, total, page: parseInt(page) });
});

router.post('/', authenticateToken, (req, res) => {
  const { title, meeting_type, date, time, notes, decisions, attendee_count, status } = req.body;
  if (!title || !date) return res.status(400).json({ error: 'Başlık ve tarih gereklidir.' });

  const decisionsJson = Array.isArray(decisions) ? JSON.stringify(decisions) : JSON.stringify([]);
  const result = db.prepare(
    'INSERT INTO meetings (title, meeting_type, date, time, notes, decisions, attendee_count, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run([title, meeting_type || 'GENEL TOPLANTI', date, time || null, notes || null, decisionsJson, attendee_count || 0, status || 'completed', req.user.id]);

  res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/:id', authenticateToken, (req, res) => {
  const { title, meeting_type, date, time, notes, decisions, attendee_count, status } = req.body;
  const decisionsJson = Array.isArray(decisions) ? JSON.stringify(decisions) :
    (typeof decisions === 'string' ? decisions : JSON.stringify([]));

  db.prepare(
    'UPDATE meetings SET title=?, meeting_type=?, date=?, time=?, notes=?, decisions=?, attendee_count=?, status=? WHERE id=?'
  ).run([title, meeting_type, date, time, notes, decisionsJson, attendee_count, status, req.params.id]);
  res.json({ success: true });
});

router.delete('/:id', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM meetings WHERE id = ?').run([req.params.id]);
  res.json({ success: true });
});

module.exports = router;
