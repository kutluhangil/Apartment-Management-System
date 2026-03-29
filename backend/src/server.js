require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const { initDb } = require('./db/database');

const app = express();

// ─── Trust proxy (required for correct IP behind Cloudflare Tunnel) ───────────
// Without this, req.ip is the tunnel loopback and rate limiting is broken.
app.set('trust proxy', 1);

// ─── Security headers (helmet) ────────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Allow image/file embeds from uploads
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Inline styles needed for React
      imgSrc: ["'self'", 'data:', 'blob:', '*.public.blob.vercel-storage.com'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'fonts.gstatic.com'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));

// ─── CORS ──────────────────────────────────────────────────────────────────────
// In production, only the FRONTEND_URL is allowed. localhost never appears in prod.
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL].filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:4173'];

if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
  console.error('FATAL: FRONTEND_URL environment variable is not set in production mode. Refusing to start.');
  process.exit(1);
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true, // Required for cookies to be sent cross-origin
}));

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cookieParser());
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

// ─── 404 Not Found handler ────────────────────────────────────────────────────
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint bulunamadı: ' + req.originalUrl });
  }
  next();
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Sunucu hatası oluştu.' });
});

// ─── Boot ──────────────────────────────────────────────────────────────────────
const startServer = async () => {
  await initDb();
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Cumhuriyet Apartmanı API çalışıyor: http://localhost:${PORT}`);
  });
};

if (require.main === module) {
  startServer();
}

module.exports = app;
