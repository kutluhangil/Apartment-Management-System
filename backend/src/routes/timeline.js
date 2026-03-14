const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM timeline ORDER BY year ASC').all([]));
});

router.post('/', authenticateToken, (req, res) => {
  const { year, title, description, income, total_expense, maintenance_note, icon } = req.body;
  try {
    const result = db.prepare(
      'INSERT INTO timeline (year, title, description, income, total_expense, maintenance_note, icon) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run([year, title, description || '', income || 0, total_expense || 0, maintenance_note || '', icon || 'foundation']);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch {
    db.prepare(
      'UPDATE timeline SET title=?, description=?, income=?, total_expense=?, maintenance_note=?, icon=? WHERE year=?'
    ).run([title, description || '', income || 0, total_expense || 0, maintenance_note || '', icon || 'foundation', year]);
    res.json({ success: true });
  }
});

module.exports = router;
