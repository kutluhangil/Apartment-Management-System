-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('manager', 'admin')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Apartments table
CREATE TABLE IF NOT EXISTS apartments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number INTEGER UNIQUE NOT NULL,
  owner_name TEXT NOT NULL,
  floor INTEGER DEFAULT 0,
  profession TEXT,
  owner_photo TEXT,
  notes TEXT
);

-- Aidat periods
CREATE TABLE IF NOT EXISTS aidats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  amount REAL NOT NULL DEFAULT 1000,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(month, year)
);

-- Per-apartment payment tracking
CREATE TABLE IF NOT EXISTS aidat_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  aidat_id INTEGER NOT NULL REFERENCES aidats(id) ON DELETE CASCADE,
  apartment_id INTEGER NOT NULL REFERENCES apartments(id),
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK(status IN ('paid', 'pending', 'unpaid')),
  paid_at DATETIME,
  note TEXT,
  UNIQUE(aidat_id, apartment_id)
);

-- Expenses (giderler)
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  amount REAL NOT NULL,
  type TEXT NOT NULL DEFAULT 'expense' CHECK(type IN ('income', 'expense')),
  date DATE NOT NULL,
  invoice_path TEXT,
  invoice_original_name TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Meetings (toplantılar)
CREATE TABLE IF NOT EXISTS meetings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  meeting_type TEXT DEFAULT 'general',
  date DATE NOT NULL,
  time TEXT,
  notes TEXT,
  decisions TEXT,
  attendee_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'completed' CHECK(status IN ('completed', 'info', 'important', 'archived', 'planned')),
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Timeline years
CREATE TABLE IF NOT EXISTS timeline (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  income REAL DEFAULT 0,
  total_expense REAL DEFAULT 0,
  maintenance_note TEXT,
  icon TEXT DEFAULT 'foundation',
  image_path TEXT
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  date TEXT NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Documents archive
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  upload_date TEXT NOT NULL,
  uploaded_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance tracker
CREATE TABLE IF NOT EXISTS maintenance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  maintenance_type TEXT NOT NULL,
  description TEXT,
  last_maintenance_date TEXT,
  next_maintenance_date TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  action_type TEXT NOT NULL,
  target_entity TEXT NOT NULL,
  details TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
