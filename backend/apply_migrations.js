import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'auth.db');
const sqlPath = path.resolve(__dirname, 'migrations/001_create_tables.sql');

const db = new sqlite3.Database(dbPath);

console.log('Using database:', dbPath);
console.log('Reading SQL from:', sqlPath);

const sql = fs.readFileSync(sqlPath, 'utf8');

// SQLite doesn't support multiple statements in a single run() or all()
// We use exec() for this
db.exec(sql, (err) => {
  if (err) {
    console.error('❌ Error executing migration:', err.message);
    process.exit(1);
  }
  console.log('✅ Migration applied successfully');
  process.exit(0);
});
