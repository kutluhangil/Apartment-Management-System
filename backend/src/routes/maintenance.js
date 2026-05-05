const express = require('express');
const { getAll, getOne, run } = require('../db/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const records = await getAll('SELECT * FROM maintenance ORDER BY next_maintenance_date ASC');
    res.json(records);
  } catch (err) { next(err); }
});

router.post('/', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res, next) => {
  try {
    const { maintenance_type, description, last_maintenance_date, next_maintenance_date } = req.body;
    if (!maintenance_type) return res.status(400).json({ error: 'Bakım türü zorunludur' });
    
    const result = await run('INSERT INTO maintenance (maintenance_type, description, last_maintenance_date, next_maintenance_date, created_by) VALUES (?, ?, ?, ?, ?)', 
      [maintenance_type, description || null, last_maintenance_date || null, next_maintenance_date || null, req.user.id]);
    
    res.status(201).json({ id: result.lastInsertRowid, maintenance_type });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res, next) => {
  try {
    await run('DELETE FROM maintenance WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
