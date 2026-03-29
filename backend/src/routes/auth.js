const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getOne } = require('../db/database');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();
const rateLimit = require('express-rate-limit');

const isProduction = process.env.NODE_ENV === 'production';

// Rate limiting on login — keyed on real IP (trust proxy must be set on app)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Çok fazla giriş denemesi yapıldı, lütfen daha sonra tekrar deneyin.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const COOKIE_OPTIONS = {
  httpOnly: true,                // Not accessible via document.cookie — blocks XSS token theft
  secure: isProduction,          // HTTPS only in production
  sameSite: 'strict',            // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/',
};

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'E-posta ve şifre gereklidir.' });

    const user = await getOne('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) return res.status(401).json({ error: 'E-posta veya şifre hatalı.' });

    // Async bcrypt — does not block the event loop
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'E-posta veya şifre hatalı.' });

    const token = jwt.sign(
      { id: Number(user.id), email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set token as httpOnly secure cookie — never exposed to JavaScript
    res.cookie('token', token, COOKIE_OPTIONS);

    // Return user info only (no token in body — cookie carries it)
    res.json({ user: { id: Number(user.id), email: user.email, name: user.name, role: user.role } });
  } catch (err) { next(err); }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', { ...COOKIE_OPTIONS, maxAge: 0 });
  res.json({ success: true });
});

// Verify current session — used by frontend on page reload
router.get('/me', require('../middleware/auth').authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
