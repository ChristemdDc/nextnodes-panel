import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'auth.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking tables in:', dbPath);

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('Error listing tables:', err);
    process.exit(1);
  }
  console.log('Tables found:', tables.map(t => t.name));
  
  if (tables.some(t => t.name === 'users')) {
    db.all("PRAGMA table_info(users)", (err, info) => {
      console.log('Users columns:', info.map(c => c.name));
      
      if (tables.some(t => t.name === 'email_verification_codes')) {
        db.all("PRAGMA table_info(email_verification_codes)", (err, info) => {
          console.log('Email verification codes columns:', info.map(c => c.name));
          process.exit(0);
        });
      } else {
        console.log('❌ email_verification_codes table NOT found');
        process.exit(0);
      }
    });
  } else {
    console.log('❌ users table NOT found');
    process.exit(0);
  }
});
