require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { db } = require('./database');

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

async function migrate() {
  console.log('Migrating database...');
  try {
    await db.execute('ALTER TABLE apartments ADD COLUMN profession TEXT');
    console.log('Added column "profession"');
  } catch (err) {
    if (!err.message.includes('duplicate column name')) {
      console.error('Error adding profession:', err.message);
    }
  }

  for (const apt of apartments) {
    await db.execute({
      sql: 'UPDATE apartments SET profession = ?, notes = ? WHERE number = ?',
      args: [apt.profession, apt.notes, apt.number]
    });
  }
  console.log('Updated existing apartments with profession and notes.');
}

migrate().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
