const { run } = require('./database');

async function migrate() {
  console.log('Starting massive features database migration...');

  try {
    // 1. Announcements Table
    await run(`
      CREATE TABLE IF NOT EXISTS announcements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        date TEXT NOT NULL,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    console.log('✅ announcements table created/verified.');

    // 2. Documents Archive Table
    await run(`
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        file_url TEXT NOT NULL,
        upload_date TEXT NOT NULL,
        uploaded_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      )
    `);
    console.log('✅ documents table created/verified.');

    // 3. Maintenance Tracker Table
    await run(`
      CREATE TABLE IF NOT EXISTS maintenance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        maintenance_type TEXT NOT NULL,
        description TEXT,
        last_maintenance_date TEXT,
        next_maintenance_date TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    console.log('✅ maintenance table created/verified.');

    // 4. Audit Logs Table
    await run(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action_type TEXT NOT NULL,
        target_entity TEXT NOT NULL,
        details TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('✅ audit_logs table created/verified.');

    // 5. Upgrade Timeline Table
    try {
      await run(`ALTER TABLE timeline ADD COLUMN image_path TEXT`);
      console.log('✅ Added image_path column to timeline table.');
    } catch (err) {
      if (err.message && err.message.includes('duplicate column name')) {
        console.log('ℹ️ Column image_path already exists in timeline table. Skipping.');
      } else {
        console.log('⚠️ Warning altering timeline table (might already exist or other error):', err.message);
      }
    }

    // Seed some initial announcements & maintenance data
    const existingAnnouncements = await run(`SELECT COUNT(*) as count FROM announcements`);
    if (existingAnnouncements.lastInsertRowid === undefined || true) { // simple check, manually insert if empty
      try {
        await run(`INSERT INTO announcements (title, message, date, created_by) VALUES 
          ('Su Kesintisi', 'Yarın 10:00 - 14:00 arasında şebeke çalışması nedeniyle su kesintisi olacaktır.', '2026-03-20', 1)`);
        await run(`INSERT INTO maintenance (maintenance_type, description, last_maintenance_date, next_maintenance_date, created_by) VALUES 
          ('Asansör Bakımı', 'Aylık periyodik A bloğu asansör bakımı', '2026-03-12', '2026-04-12', 1)`);
        console.log('✅ Seeded initial announcements and maintenance data.');
      } catch(e) { console.log('Seed skip/fail: ', e.message) }
    }

    console.log('🎉 Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
