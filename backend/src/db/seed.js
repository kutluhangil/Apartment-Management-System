require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { db, initDb } = require('./database');

const apartments = [
  { number: 1, owner_name: 'Turgut IRMAK', floor: 1, profession: 'Emekli', notes: '' },
  { number: 2, owner_name: 'GÖZDE BARIK', floor: 1, profession: 'Öğretmen', notes: '' },
  { number: 3, owner_name: 'Hakan ÇAKIR', floor: 1, profession: 'Mühendis', notes: '' },
  { number: 4, owner_name: 'İLYAS GÜLERYÜZ', floor: 2, profession: 'Esnaf', notes: '' },
  { number: 5, owner_name: 'A.Tahir ALTINSOY', floor: 2, profession: 'Doktor', notes: '' },
  { number: 6, owner_name: 'R. Tolunay GENÇ', floor: 2, profession: 'Avukat', notes: 'Toplantılarda hukuki danışman' },
  { number: 7, owner_name: 'Hanife ŞEKER', floor: 3, profession: 'Mimar', notes: '' },
  { number: 8, owner_name: 'Kutluhan GUL', floor: 3, profession: 'Software Developer', notes: 'Sistem Yöneticisi' },
  { number: 9, owner_name: 'SEVGİ AKKURT', floor: 3, profession: 'Muhasebeci', notes: '' },
  { number: 10, owner_name: 'BORA DENIZ', floor: 4, profession: 'Pilot', notes: '' },
  { number: 11, owner_name: 'Bugra ÇAKIR', floor: 4, profession: 'Öğrenci', notes: '' },
  { number: 12, owner_name: 'KALI YAPI', floor: 4, profession: 'Şirket', notes: 'Kurumsal' },
  { number: 13, owner_name: 'Murat ATAÇ', floor: 5, profession: 'Yönetici', notes: 'Apartman Yöneticisi' },
  { number: 14, owner_name: 'Basri GÜZER', floor: 5, profession: 'Serbest Meslek', notes: '' },
  { number: 15, owner_name: 'Ebru Yeğin', floor: 5, profession: 'Tasarımcı', notes: '' },
  { number: 16, owner_name: 'KALI YAPI', floor: 6, profession: 'Şirket', notes: 'Kurumsal' },
  { number: 17, owner_name: 'KALİ YAPI', floor: 6, profession: 'Şirket', notes: 'Kurumsal' },
  { number: 18, owner_name: 'Bahtiyar TURAN', floor: 6, profession: 'Danışman', notes: '' },
];

const exec = async (sql, args = []) => db.execute({ sql, args });

async function seed() {
  console.log('🌱 Initializing schema...');
  await initDb();

  console.log('👤 Seeding users...');
  const managerPassword = process.env.MANAGER_PASSWORD;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!managerPassword || !adminPassword) {
    console.error('❌ Hata: .env dosyasında MANAGER_PASSWORD ve ADMIN_PASSWORD tanımlı olmalıdır. Çalıştırılmadı.');
    process.exit(1);
  }

  const managerEmail = process.env.MANAGER_EMAIL || 'murat@cumhuriyet.com';
  const adminEmail = process.env.ADMIN_EMAIL || 'kutluhan@cumhuriyet.com';

  const managerHash = await bcrypt.hash(managerPassword, 10);
  const adminHash = await bcrypt.hash(adminPassword, 10);
  await exec(`INSERT OR IGNORE INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)`,
    [managerEmail, managerHash, 'Murat', 'manager']);
  await exec(`INSERT OR IGNORE INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)`,
    [adminEmail, adminHash, 'Kutluhan', 'admin']);

  console.log('🏘 Seeding 18 apartments...');
  for (const apt of apartments) {
    await exec(`INSERT OR IGNORE INTO apartments (number, owner_name, floor, profession, notes) VALUES (?, ?, ?, ?, ?)`,
      [apt.number, apt.owner_name, apt.floor, apt.profession, apt.notes]);
  }

  console.log('📜 Seeding timeline...');
  const timeline = [
    [2024, 'İnşaat Tamamlandı', 'Apartman inşaatı tamamlandı ve teslim edildi.', 0, 5000000, 'Yok', 'foundation'],
    [2025, 'Bakım İyileştirmeleri', 'Boya ve çatı onarımları gerçekleştirildi.', 200000, 50000, 'Boya ve Çatı', 'architecture'],
    [2026, 'Mevcut Finansal Durum', 'Bahçe düzenleme ve peyzaj çalışmaları.', 100000, 20000, 'Bahçe Düzenleme', 'account_balance_wallet'],
  ];
  for (const [year, title, desc, income, expense, maint, icon] of timeline) {
    await exec(`INSERT OR IGNORE INTO timeline (year, title, description, income, total_expense, maintenance_note, icon) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [year, title, desc, income, expense, maint, icon]);
  }

  console.log('📅 Seeding meetings...');
  const meetings = [
    ['Asansör Yenileme ve Boya', 'OLAĞAN GENEL KURUL', '2024-03-12', '19:30',
      'Binanın dış cephe boyasının yenilenmesi ve asansörün periyodik bakımı yerine komple modernizasyonu tartışıldı.',
      JSON.stringify(['Asansör revizyonu için X Firması ile anlaşıldı.', 'Dış cephe boyası 2024 yaz dönemine ertelendi.', 'Aidat ödemeleri %20 oranında güncellendi.']),
      18, 'completed'],
    ['Bahçe ve Peyzaj Düzenlemesi', 'YÖNETİM KURULU', '2024-02-05', '18:00',
      'Arka bahçedeki aydınlatma yetersizliği ve otomatik sulama sistemi arızası gündeme alındı.',
      JSON.stringify(['LED aydınlatma sistemine geçiş kararı alındı.', 'Sulama sistemi için 3 firmadan teklif toplanacak.']),
      12, 'info'],
    ['Güvenlik Kamerası Güncelleme', 'ACİL TOPLANTI', '2024-01-15', '20:00',
      'Son dönemde artan hırsızlık olayları nedeniyle mevcut kameraların HD modellerle değiştirilmesi görüşüldü.',
      JSON.stringify(['4 yeni IP kamera eklenmesine karar verildi.', "Kayıt cihazı kapasitesi 8TB'a çıkarılacak."]),
      15, 'important'],
    ['2023 Yıl Sonu Değerlendirmesi', 'YILLIK TOPLANTI', '2023-12-20', '19:00',
      '2023 yılı gelir-gider tablosu paylaşıldı. Kasa bakiyesi hakkında bilgi verildi.',
      JSON.stringify(['Bütçe raporu oy birliği ile ibra edildi.', 'Apartman görevlisi ikramiyesi onaylandı.']),
      18, 'archived'],
  ];
  for (const [title, type, date, time, notes, decisions, attendees, status] of meetings) {
    await exec(`INSERT OR IGNORE INTO meetings (title, meeting_type, date, time, notes, decisions, attendee_count, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, type, date, time, notes, decisions, attendees, status]);
  }

  console.log('💰 Seeding expenses...');
  const expenses = [
    ['EnerjiSA Elektrik Faturası', 'Ortak alan aydınlatma ve asansör', 1450, 'expense', '2023-10-12'],
    ['İSKİ Su Faturası', 'Bahçe sulama ve temizlik', 850, 'expense', '2023-10-10'],
    ['Asansör Bakım Ücreti', 'Periyodik teknik bakım', 2100, 'expense', '2023-10-05'],
    ['Temizlik Malzemeleri', 'Aylık stok yenileme', 450, 'expense', '2023-10-02'],
    ['Asansör Revizyon', 'Komple revizyon', 2400, 'expense', '2024-03-12'],
    ['Temizlik Malzemeleri (Mart)', 'Mart ayı stok', 850, 'expense', '2024-03-08'],
    ['Bahçe Aydınlatma', 'LED dönüşümü', 950, 'expense', '2024-03-02'],
    ['Mart 2024 Aidat Gelirleri', 'Tahsil edilen aidatlar', 12500, 'income', '2024-03-31'],
  ];
  for (const [title, desc, amount, type, date] of expenses) {
    await exec(`INSERT OR IGNORE INTO expenses (title, description, amount, type, date) VALUES (?, ?, ?, ?, ?)`,
      [title, desc, amount, type, date]);
  }

  console.log('💳 Seeding aidat periods...');
  const now = new Date();
  await exec(`INSERT OR IGNORE INTO aidats (month, year, amount) VALUES (?, ?, ?)`,
    [now.getMonth() + 1, now.getFullYear(), 1000]);
  await exec(`INSERT OR IGNORE INTO aidats (month, year, amount) VALUES (?, ?, ?)`,
    [3, 2024, 1000]);

  const aidatMarch = (await db.execute('SELECT id FROM aidats WHERE month = 3 AND year = 2024')).rows[0];
  if (aidatMarch) {
    const apts = (await db.execute('SELECT id FROM apartments ORDER BY number ASC')).rows;
    const statuses = ['paid','paid','unpaid','paid','paid','pending','paid','paid','unpaid','paid','paid','unpaid','paid','paid','paid','unpaid','pending','paid'];
    for (let i = 0; i < apts.length; i++) {
      const status = statuses[i] || 'unpaid';
      await exec(`INSERT OR IGNORE INTO aidat_payments (aidat_id, apartment_id, status, paid_at) VALUES (?, ?, ?, ?)`,
        [Number(aidatMarch.id), Number(apts[i].id), status, status === 'paid' ? '2024-03-15' : null]);
    }
  }

  console.log('\n🎉 Database seeded successfully!');
  console.log(`📧 Manager: ${process.env.MANAGER_EMAIL || 'murat@cumhuriyet.com'}`);
  console.log(`📧 Admin:   ${process.env.ADMIN_EMAIL || 'kutluhan@cumhuriyet.com'}`);
  process.exit(0);
}

seed().catch(err => { console.error('Seed error:', err); process.exit(1); });
