import { query } from './backend/src/config/database.js';

async function migrate() {
  try {
    console.log('--- Migrating database ---');
    await query("ALTER TABLE email_verification_codes ADD COLUMN used_at DATETIME NULL");
    console.log('✅ Column used_at added to email_verification_codes');
    
    const tableInfo = await query("PRAGMA table_info(email_verification_codes)");
    console.log('--- New schema ---');
    console.log(JSON.stringify(tableInfo, null, 2));
  } catch (err) {
    console.error('❌ Migration error:', err.message);
  }
}

migrate();
