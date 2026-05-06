/**
 * Aidat hatırlatma scripti.
 *
 * Çalışma mantığı:
 *   1. Mevcut ay için aidat dönemini bulur (yoksa otomatik oluşturur).
 *   2. Ödenmemiş daireleri listeler.
 *   3. Liste'yi konsola yazar VE — eğer ortam değişkenleri set edilmişse —
 *      Telegram bot üzerinden bildirim gönderir.
 *
 * Cron örneği (her ayın 1'i saat 09:00):
 *   0 9 1 * * cd /home/kutluhan/Apartment-Management-System/backend && /usr/bin/node src/scripts/send-reminder.js >> /home/kutluhan/reminder.log 2>&1
 *
 * Telegram için gerekli env değişkenleri:
 *   TELEGRAM_BOT_TOKEN   — @BotFather'dan alınır
 *   TELEGRAM_CHAT_ID     — Grup veya kanal ID'si (öne -100 gelir)
 *
 * Webhook için (Discord, Slack, custom):
 *   REMINDER_WEBHOOK_URL — POST {text:"..."} olarak çağrılır
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { initDb, getOne, getAll, run } = require('../db/database');

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

async function ensureCurrentAidat() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  let aidat = await getOne('SELECT * FROM aidats WHERE month = ? AND year = ?', [month, year]);
  if (aidat) return aidat;

  // Önceki ayın tutarını referans al
  const prev = await getOne('SELECT amount FROM aidats ORDER BY year DESC, month DESC LIMIT 1');
  const baseAmount = prev?.amount || 1000;

  const { lastInsertRowid } = await run(
    'INSERT INTO aidats (month, year, amount) VALUES (?, ?, ?)', [month, year, baseAmount]
  );
  const aidatId = Number(lastInsertRowid);

  // Tüm dairelere ödeme kaydı aç (room_type'a göre tutar)
  const apartments = await getAll('SELECT id, room_type FROM apartments');
  for (const apt of apartments) {
    const amount = apt.room_type === '2+1' ? Math.round(baseAmount * 0.8) : baseAmount;
    await run(
      'INSERT OR IGNORE INTO aidat_payments (aidat_id, apartment_id, status, amount) VALUES (?, ?, ?, ?)',
      [aidatId, Number(apt.id), 'unpaid', amount]
    );
  }

  console.log(`✅ Yeni dönem oluşturuldu: ${MONTHS[month - 1]} ${year}`);
  return await getOne('SELECT * FROM aidats WHERE id = ?', [aidatId]);
}

async function buildMessage(aidat) {
  const unpaid = await getAll(`
    SELECT a.number, a.owner_name, a.room_type, ap.amount
    FROM aidat_payments ap
    JOIN apartments a ON ap.apartment_id = a.id
    WHERE ap.aidat_id = ? AND ap.status != 'paid'
    ORDER BY a.number ASC
  `, [aidat.id]);

  const period = `${MONTHS[aidat.month - 1]} ${aidat.year}`;

  if (unpaid.length === 0) {
    return `🎉 *Cumhuriyet Apartmanı*\n${period} dönemi: tüm daireler aidatını ödemiş. Teşekkürler!`;
  }

  const lines = unpaid.map(u =>
    `• Daire ${String(u.number).padStart(2, '0')} — ${u.owner_name} (${u.room_type}) → ${Number(u.amount).toLocaleString('tr-TR')} ₺`
  ).join('\n');

  const total = unpaid.reduce((s, u) => s + Number(u.amount), 0);

  return [
    `🏢 *Cumhuriyet Apartmanı — Aidat Hatırlatması*`,
    ``,
    `Dönem: *${period}*`,
    `Bekleyen: *${unpaid.length} daire / ${total.toLocaleString('tr-TR')} ₺*`,
    ``,
    lines,
    ``,
    `Detaylı bilgi: https://cumhuriyetapartmani.com`,
  ].join('\n');
}

async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  });
  if (!res.ok) {
    console.error('Telegram error:', await res.text());
    return false;
  }
  console.log('✅ Telegram mesajı gönderildi.');
  return true;
}

async function sendWebhook(text) {
  const url = process.env.REMINDER_WEBHOOK_URL;
  if (!url) return false;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, content: text }), // Discord uses content, Slack uses text
  });
  if (!res.ok) {
    console.error('Webhook error:', res.status, await res.text());
    return false;
  }
  console.log('✅ Webhook çağrıldı.');
  return true;
}

async function main() {
  await initDb();
  const aidat = await ensureCurrentAidat();
  const message = await buildMessage(aidat);

  console.log('\n─── HATIRLATMA MESAJI ───────────────────────────────');
  console.log(message);
  console.log('─────────────────────────────────────────────────────\n');

  const telegram = await sendTelegram(message);
  const webhook = await sendWebhook(message);

  if (!telegram && !webhook) {
    console.log('⚠️  Hiçbir bildirim kanalı yapılandırılmamış.');
    console.log('   Telegram için TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID set edin.');
    console.log('   Veya REMINDER_WEBHOOK_URL ile özel webhook tanımlayın.');
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Reminder error:', err);
  process.exit(1);
});
