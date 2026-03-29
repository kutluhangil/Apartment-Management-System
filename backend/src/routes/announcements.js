const express = require('express');
const { getAll, getOne, run } = require('../db/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const announcements = await getAll('SELECT * FROM announcements ORDER BY date DESC');
    res.json(announcements);
  } catch (err) { next(err); }
});

router.post('/', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res, next) => {
  try {
    const { title, message, date } = req.body;
    if (!title || !message || !date) return res.status(400).json({ error: 'Eksik alan' });
    
    const result = await run('INSERT INTO announcements (title, message, date, created_by) VALUES (?, ?, ?, ?)', [title, message, date, req.user.id]);
    
    // Log audit
    await run('INSERT INTO audit_logs (user_id, action_type, target_entity, details) VALUES (?, ?, ?, ?)', 
      [req.user.id, 'CREATE', 'announcement', 'Duyuru Eklendi: ' + title]);

    res.status(201).json({ id: result.lastInsertRowid, title });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res, next) => {
  try {
    const ann = await getOne('SELECT * FROM announcements WHERE id = ?', [req.params.id]);
    if (!ann) return res.status(404).json({ error: 'Bulunamadı' });

    await run('DELETE FROM announcements WHERE id = ?', [req.params.id]);

    await run('INSERT INTO audit_logs (user_id, action_type, target_entity, details) VALUES (?, ?, ?, ?)', 
      [req.user.id, 'DELETE', 'announcement', 'Duyuru Silindi: ' + ann.title]);

    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
