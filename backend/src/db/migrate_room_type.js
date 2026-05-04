require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { db, initDb } = require('./database');

const roomTypes = {
  1:  '2+1', 2:  '2+1', 3:  '2+1',
  4:  '3+1', 5:  '3+1', 6:  '2+1',
  7:  '3+1', 8:  '3+1', 9:  '2+1',
  10: '3+1', 11: '3+1', 12: '2+1',
  13: '3+1', 14: '3+1', 15: '2+1',
  16: '3+1', 17: '3+1', 18: '2+1',
};

const ownerNames = {
  1:  'Turgut IRMAK',     2:  'GÖZDE BARIK',      3:  'Hakan ÇAKIR',
  4:  'İLYAS GÜLERYÜZ',  5:  'A.Tahir ALTINSOY',  6:  'R. Tolunay GENÇ',
  7:  'Hanife ŞEKER',    8:  'Kutluhan GUL',       9:  'SEVGİ AKKURT',
  10: 'BORA DENİZ',      11: 'Buğra ÇAKIR',        12: 'KALI YAPI',
  13: 'Murat ATAÇ',      14: 'Basri GÜZER',        15: 'Ebru KARDEŞ',
  16: 'KALI YAPI',       17: 'KALİ YAPI',          18: 'Bahtiyar TURAN',
};

async function migrate() {
  await initDb();

  // 1. Add room_type column if not exists
  try {
    await db.execute({ sql: `ALTER TABLE apartments ADD COLUMN room_type TEXT DEFAULT '3+1'`, args: [] });
    console.log('✅ room_type sütunu eklendi.');
  } catch (e) {
    if (e.message?.includes('duplicate column')) {
      console.log('ℹ️  room_type sütunu zaten mevcut, atlandı.');
    } else { throw e; }
  }

  // 2. Update each apartment's room_type and owner_name
  for (const [num, type] of Object.entries(roomTypes)) {
    const n = Number(num);
    await db.execute({
      sql: `UPDATE apartments SET room_type = ?, owner_name = ? WHERE number = ?`,
      args: [type, ownerNames[n], n],
    });
    console.log(`  Daire ${String(n).padStart(2,'0')}: ${ownerNames[n]} — ${type}`);
  }

  console.log('\n🎉 Migration tamamlandı!');
  process.exit(0);
}

migrate().catch(err => { console.error('Migration hatası:', err); process.exit(1); });
