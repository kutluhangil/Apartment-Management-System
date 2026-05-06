const { createClient } = require('@libsql/client');
const path = require('path');
const fs = require('fs');

// Local dev → SQLite file | Production → Turso remote
const isLocal = !process.env.TURSO_DATABASE_URL;

if (isLocal) {
  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

const db = createClient(
  isLocal
    ? { url: `file:${path.join(__dirname, '../../data/apartment.db')}` }
    : { url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN }
);

// ─── Query helpers ───────────────────────────────────────────────────────────

/** Returns a single row or null */
const getOne = async (sql, args = []) => {
  const r = await db.execute({ sql, args });
  return r.rows[0] || null;
};

/** Returns all rows */
const getAll = async (sql, args = []) => {
  const r = await db.execute({ sql, args });
  return r.rows;
};

/** Runs INSERT / UPDATE / DELETE, returns { lastInsertRowid, changes } */
const run = async (sql, args = []) => {
  const r = await db.execute({ sql, args });
  return { lastInsertRowid: Number(r.lastInsertRowid), changes: r.rowsAffected };
};

/** Initialize schema (runs all CREATE TABLE IF NOT EXISTS statements) */
const initDb = async () => {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  const statements = schema.split(';').map(s => s.trim()).filter(Boolean);
  for (const sql of statements) {
    try {
      await db.execute(sql);
    } catch {
      // table or index already exists – safe to ignore
    }
  }

  // Auto-migrations: add columns that were added after initial schema deployment.
  // Each entry is idempotent — safely skipped if the column already exists.
  const columnMigrations = [
    { table: 'aidat_payments', column: 'amount',    sql: 'ALTER TABLE aidat_payments ADD COLUMN amount REAL NOT NULL DEFAULT 1000' },
    { table: 'apartments',     column: 'room_type', sql: "ALTER TABLE apartments ADD COLUMN room_type TEXT NOT NULL DEFAULT '3+1'" },
    { table: 'apartments',     column: 'profession', sql: 'ALTER TABLE apartments ADD COLUMN profession TEXT' },
    { table: 'apartments',     column: 'owner_photo', sql: 'ALTER TABLE apartments ADD COLUMN owner_photo TEXT' },
    { table: 'apartments',     column: 'notes',      sql: 'ALTER TABLE apartments ADD COLUMN notes TEXT' },
    { table: 'timeline',       column: 'image_path', sql: 'ALTER TABLE timeline ADD COLUMN image_path TEXT' },
  ];

  for (const { table, column, sql } of columnMigrations) {
    try {
      const info = await db.execute(`PRAGMA table_info(${table})`);
      const exists = info.rows.some(row => row.name === column);
      if (!exists) {
        await db.execute(sql);
        console.log(`[migration] Added column "${column}" to "${table}"`);
      }
    } catch (e) {
      console.error(`[migration] Failed for ${table}.${column}:`, e.message);
    }
  }

  if (isLocal) {
    await db.execute('PRAGMA foreign_keys=ON');
  }
};

module.exports = { db, getOne, getAll, run, initDb };
