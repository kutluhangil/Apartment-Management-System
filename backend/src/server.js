const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/apartments', require('./routes/apartments'));
app.use('/api/aidats', require('./routes/aidats'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/timeline', require('./routes/timeline'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', name: 'Cumhuriyet Apartmanı API' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Sunucu hatası oluştu.' });
});

// Ensure uploads dir exists
const fs = require('fs');
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.listen(PORT, () => {
  console.log(`🚀 Cumhuriyet Apartmanı API çalışıyor: http://localhost:${PORT}`);
});

module.exports = app;
