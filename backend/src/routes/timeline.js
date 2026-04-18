const express = require('express');
const { getAll, run } = require('../db/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    res.json(await getAll('SELECT * FROM timeline ORDER BY year ASC'));
  } catch (err) { next(err); }
});

router.post('/', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res, next) => {
  try {
    const { year, title, description, income, total_expense, maintenance_note, icon } = req.body;
    try {
      const { lastInsertRowid } = await run(
        'INSERT INTO timeline (year, title, description, income, total_expense, maintenance_note, icon) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [year, title, description || '', income || 0, total_expense || 0, maintenance_note || '', icon || 'foundation']
      );
      res.status(201).json({ id: lastInsertRowid });
    } catch {
      // year already exists → update
      await run(
        'UPDATE timeline SET title=?, description=?, income=?, total_expense=?, maintenance_note=?, icon=? WHERE year=?',
        [title, description || '', income || 0, total_expense || 0, maintenance_note || '', icon || 'foundation', year]
      );
      res.json({ success: true });
    }
  } catch (err) { next(err); }
});

module.exports = router;
