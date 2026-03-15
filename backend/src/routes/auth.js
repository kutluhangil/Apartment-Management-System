const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getOne } = require('../db/database');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();
const rateLimit = require('express-rate-limit');

// Rate limiting for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per `window` (here, per 15 minutes)
  message: { error: 'Çok fazla giriş denemesi yapıldı, lütfen daha sonra tekrar deneyin.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'E-posta ve şifre gereklidir.' });

    const user = await getOne('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) return res.status(401).json({ error: 'E-posta veya şifre hatalı.' });

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'E-posta veya şifre hatalı.' });

    const token = jwt.sign(
      { id: Number(user.id), email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: Number(user.id), email: user.email, name: user.name, role: user.role } });
  } catch (err) { next(err); }
});

module.exports = router;
