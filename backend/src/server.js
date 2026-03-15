const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db/database');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:5173']
  : ['http://localhost:5173'];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/apartments', require('./routes/apartments'));
app.use('/api/aidats', require('./routes/aidats'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/timeline', require('./routes/timeline'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/analytics', require('./routes/analytics'));
app.get('/api/health', (req, res) => res.json({ status: 'ok', name: 'Cumhuriyet Apartmanı API' }));

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Sunucu hatası oluştu.' });
});

// ─── Boot ──────────────────────────────────────────────────────────────────────
// initDb() is called once at startup (schema creation)
const startServer = async () => {
  await initDb();
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Cumhuriyet Apartmanı API çalışıyor: http://localhost:${PORT}`);
  });
};

// In Vercel (serverless) we just export the app.
// When running locally (node src/server.js), we start the server.
if (require.main === module) {
  startServer();
}

module.exports = app;
