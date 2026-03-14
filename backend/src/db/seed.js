const bcrypt = require('bcryptjs');
const db = require('./database');

const apartments = [
  { number: 1, owner_name: 'Turgut IRMAK', floor: 1 },
  { number: 2, owner_name: 'GÖZDE BARIK', floor: 1 },
  { number: 3, owner_name: 'Hakan ÇAKIR', floor: 1 },
  { number: 4, owner_name: 'İLYAS GÜLERYÜZ', floor: 2 },
  { number: 5, owner_name: 'A.Tahir ALTINSOY', floor: 2 },
  { number: 6, owner_name: 'R. Tolunay GENÇ', floor: 2 },
  { number: 7, owner_name: 'Hanife ŞEKER', floor: 3 },
  { number: 8, owner_name: 'Kutluhan GUL', floor: 3 },
  { number: 9, owner_name: 'SEVGİ AKKURT', floor: 3 },
  { number: 10, owner_name: 'BORA DENIZ', floor: 4 },
  { number: 11, owner_name: 'Bugra ÇAKIR', floor: 4 },
  { number: 12, owner_name: 'KALI YAPI', floor: 4 },
  { number: 13, owner_name: 'Murat ATAÇ', floor: 5 },
  { number: 14, owner_name: 'Basri GÜZER', floor: 5 },
  { number: 15, owner_name: 'Ebru Yeğin', floor: 5 },
  { number: 16, owner_name: 'KALI YAPI', floor: 6 },
  { number: 17, owner_name: 'KALİ YAPI', floor: 6 },
  { number: 18, owner_name: 'Bahtiyar TURAN', floor: 6 },
];

async function seed() {
  console.log('🌱 Seeding database...');

  // Users
  const managerHash = await bcrypt.hash('manager123', 10);
  const adminHash = await bcrypt.hash('admin123', 10);

  db.prepare(`INSERT OR IGNORE INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)`).run([
    'murat@cumhuriyet.com', managerHash, 'Murat Ataç', 'manager'
  ]);
  db.prepare(`INSERT OR IGNORE INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)`).run([
    'kutluhan@cumhuriyet.com', adminHash, 'Kutluhan Gül', 'admin'
  ]);
  console.log('✅ Users seeded');

  // Apartments
  const insertApt = db.prepare(`INSERT OR IGNORE INTO apartments (number, owner_name, floor) VALUES (?, ?, ?)`);
  for (const apt of apartments) {
    insertApt.run([apt.number, apt.owner_name, apt.floor]);
  }
  console.log('✅ Apartments seeded');

  // Timeline
  const timelineData = [
    { year: 2024, title: 'İnşaat Tamamlandı', description: 'Apartman inşaatı tamamlandı ve teslim edildi.', income: 0, total_expense: 5000000, maintenance_note: 'Yok', icon: 'foundation' },
    { year: 2025, title: 'Bakım İyileştirmeleri', description: 'Boya ve çatı onarımları gerçekleştirildi.', income: 200000, total_expense: 50000, maintenance_note: 'Boya ve Çatı', icon: 'architecture' },
    { year: 2026, title: 'Mevcut Finansal Durum', description: 'Bahçe düzenleme ve peyzaj çalışmaları.', income: 100000, total_expense: 20000, maintenance_note: 'Bahçe Düzenleme', icon: 'account_balance_wallet' },
  ];
  const insertTimeline = db.prepare(`INSERT OR IGNORE INTO timeline (year, title, description, income, total_expense, maintenance_note, icon) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  for (const t of timelineData) {
    insertTimeline.run([t.year, t.title, t.description, t.income, t.total_expense, t.maintenance_note, t.icon]);
  }
  console.log('✅ Timeline seeded');

  // Sample meetings
  const meetings = [
    { title: 'Asansör Yenileme ve Boya', meeting_type: 'OLAĞAN GENEL KURUL', date: '2024-03-12', time: '19:30', notes: 'Binanın dış cephe boyasının yenilenmesi ve asansörün periyodik bakımı yerine komple modernizasyonu tartışıldı. Teklifler incelendi.', decisions: JSON.stringify(['Asansör revizyonu için X Firması ile anlaşıldı.', 'Dış cephe boyası 2024 yaz dönemine ertelendi.', 'Aidat ödemeleri %20 oranında güncellendi.']), attendee_count: 18, status: 'completed' },
    { title: 'Bahçe ve Peyzaj Düzenlemesi', meeting_type: 'YÖNETİM KURULU', date: '2024-02-05', time: '18:00', notes: 'Arka bahçedeki aydınlatma yetersizliği ve otomatik sulama sistemi arızası gündeme alındı.', decisions: JSON.stringify(['LED aydınlatma sistemine geçiş kararı alındı.', 'Sulama sistemi için 3 farklı firmadan teklif toplanacak.']), attendee_count: 12, status: 'info' },
    { title: 'Güvenlik Kamerası Güncelleme', meeting_type: 'ACİL TOPLANTI', date: '2024-01-15', time: '20:00', notes: 'Son dönemde mahallede artan hırsızlık olayları nedeniyle mevcut kameraların HD modellerle değiştirilmesi görüşüldü.', decisions: JSON.stringify(['4 yeni IP kamera eklenmesine karar verildi.', "Kayıt cihazı kapasitesi 2TB'dan 8TB'a çıkarılacak."]), attendee_count: 15, status: 'important' },
    { title: '2023 Yıl Sonu Değerlendirmesi', meeting_type: 'YILLIK TOPLANTI', date: '2023-12-20', time: '19:00', notes: '2023 yılı gelir-gider tablosu paylaşıldı. Kasa bakiyesi ve ödenmemiş aidatlar hakkında bilgi verildi.', decisions: JSON.stringify(['Bütçe raporu oy birliği ile ibra edildi.', 'Apartman görevlisi ikramiyesi onaylandı.']), attendee_count: 18, status: 'archived' },
  ];

  const insertMeeting = db.prepare(`INSERT OR IGNORE INTO meetings (title, meeting_type, date, time, notes, decisions, attendee_count, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const m of meetings) {
    insertMeeting.run([m.title, m.meeting_type, m.date, m.time, m.notes, m.decisions, m.attendee_count, m.status]);
  }
  console.log('✅ Meetings seeded');

  // Sample expenses
  const expenseData = [
    { title: 'EnerjiSA Elektrik Faturası', description: 'Ortak alan aydınlatma ve asansör', amount: 1450, type: 'expense', date: '2023-10-12' },
    { title: 'İSKİ Su Faturası', description: 'Bahçe sulama ve temizlik', amount: 850, type: 'expense', date: '2023-10-10' },
    { title: 'Asansör Bakım Ücreti', description: 'Periyodik teknik bakım', amount: 2100, type: 'expense', date: '2023-10-05' },
    { title: 'Temizlik Malzemeleri', description: 'Aylık stok yenileme', amount: 450, type: 'expense', date: '2023-10-02' },
    { title: 'Asansör Revizyon', description: 'Komple asansör revizyonu', amount: 2400, type: 'expense', date: '2024-03-12' },
    { title: 'Temizlik Malzemeleri (Mart)', description: 'Mart ayı stok', amount: 850, type: 'expense', date: '2024-03-08' },
    { title: 'Bahçe Aydınlatma', description: 'LED dönüşümü', amount: 950, type: 'expense', date: '2024-03-02' },
    { title: 'Mart 2024 Aidat Gelirleri', description: 'Tahsil edilen aidatlar', amount: 12500, type: 'income', date: '2024-03-31' },
  ];
  const insertExpense = db.prepare(`INSERT OR IGNORE INTO expenses (title, description, amount, type, date) VALUES (?, ?, ?, ?, ?)`);
  for (const e of expenseData) {
    insertExpense.run([e.title, e.description, e.amount, e.type, e.date]);
  }
  console.log('✅ Expenses seeded');

  // Aidat periods
  const insertAidat = db.prepare(`INSERT OR IGNORE INTO aidats (month, year, amount) VALUES (?, ?, ?)`);
  const now = new Date();
  insertAidat.run([now.getMonth() + 1, now.getFullYear(), 1000]);
  insertAidat.run([3, 2024, 1000]);

  const aidatMarch = db.prepare(`SELECT id FROM aidats WHERE month = 3 AND year = 2024`).get([]);
  if (aidatMarch) {
    const apts = db.prepare(`SELECT id FROM apartments ORDER BY number ASC`).all([]);
    const statuses = ['paid', 'paid', 'unpaid', 'paid', 'paid', 'pending', 'paid', 'paid', 'unpaid', 'paid', 'paid', 'unpaid', 'paid', 'paid', 'paid', 'unpaid', 'pending', 'paid'];
    const insertPayment = db.prepare(`INSERT OR IGNORE INTO aidat_payments (aidat_id, apartment_id, status, paid_at) VALUES (?, ?, ?, ?)`);
    apts.forEach((apt, i) => {
      const status = statuses[i] || 'unpaid';
      insertPayment.run([aidatMarch.id, apt.id, status, status === 'paid' ? '2024-03-15' : null]);
    });
  }
  console.log('✅ Aidat payments seeded');

  console.log('\n🎉 Database seeded successfully!');
  console.log('📧 Manager: murat@cumhuriyet.com / manager123');
  console.log('📧 Admin:   kutluhan@cumhuriyet.com / admin123');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
