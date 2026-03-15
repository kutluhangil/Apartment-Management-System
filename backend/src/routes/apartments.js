const express = require('express');
const { getAll, getOne, run } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const rows = await getAll('SELECT * FROM apartments ORDER BY number ASC');
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const apt = await getOne('SELECT * FROM apartments WHERE id = ?', [req.params.id]);
    if (!apt) return res.status(404).json({ error: 'Daire bulunamadı.' });
    res.json(apt);
  } catch (err) { next(err); }
});

router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { owner_name, floor, profession, notes } = req.body;
    await run('UPDATE apartments SET owner_name = ?, floor = ?, profession = ?, notes = ? WHERE id = ?',
      [owner_name, floor, profession || null, notes || null, req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
