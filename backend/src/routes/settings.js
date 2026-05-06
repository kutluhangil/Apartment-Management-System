const express = require('express');
const router = express.Router();

// Public read-only settings — used by landing page (IBAN, açıklama formatı vs.)
// These come from env so no DB write is needed; admin updates server .env to change.
router.get('/', (req, res) => {
  res.json({
    iban: process.env.APARTMENT_IBAN || 'TR00 0000 0000 0000 0000 0000 00',
    accountName: process.env.APARTMENT_ACCOUNT_NAME || 'Cumhuriyet Apartmanı Yönetimi',
    bankName: process.env.APARTMENT_BANK_NAME || '',
    paymentNoteTemplate: process.env.APARTMENT_PAYMENT_NOTE || 'Daire {No} - {Ay} {Yıl} Aidatı',
    contactEmail: process.env.APARTMENT_CONTACT_EMAIL || 'murat@cumhuriyet.com',
  });
});

module.exports = router;
