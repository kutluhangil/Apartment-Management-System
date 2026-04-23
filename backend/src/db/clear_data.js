// Tüm örnek verileri siler, daireler ve kullanıcılar korunur.
// Kullanım: node src/db/clear_data.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { run, getAll } = require('./database');

const TABLES = [
  'aidat_payments', 'aidats', 'expenses', 'meetings',
  'announcements', 'documents', 'maintenance', 'audit_logs', 'timeline',
];

async function clearData() {
  console.log('🗑  Veriler siliniyor...');
  for (const t of TABLES) {
    const r = await run(`DELETE FROM ${t}`);
    console.log(`  ${t}: ${r.changes} satır silindi`);
  }
  const [{ n: apts }] = await getAll('SELECT COUNT(*) as n FROM apartments');
  const [{ n: users }] = await getAll('SELECT COUNT(*) as n FROM users');
  console.log(`\n✅ Tamamlandı. Korunan: ${apts} daire, ${users} kullanıcı`);
  process.exit(0);
}

clearData().catch(e => { console.error('❌', e.message); process.exit(1); });
