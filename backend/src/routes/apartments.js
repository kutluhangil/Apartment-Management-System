const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const apartments = db.prepare('SELECT * FROM apartments ORDER BY number ASC').all([]);
  res.json(apartments);
});

router.get('/:id', (req, res) => {
  const apt = db.prepare('SELECT * FROM apartments WHERE id = ?').get([req.params.id]);
  if (!apt) return res.status(404).json({ error: 'Daire bulunamadı.' });
  res.json(apt);
});

router.put('/:id', authenticateToken, (req, res) => {
  const { owner_name, floor, notes } = req.body;
  db.prepare('UPDATE apartments SET owner_name = ?, floor = ?, notes = ? WHERE id = ?').run([
    owner_name, floor, notes, req.params.id
  ]);
  res.json({ success: true });
});

module.exports = router;
