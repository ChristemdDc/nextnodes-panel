import { query } from './backend/src/config/database.js';

async function checkSchema() {
  try {
    const tableInfo = await query("PRAGMA table_info(email_verification_codes)");
    console.log('--- email_verification_codes schema ---');
    console.log(JSON.stringify(tableInfo, null, 2));
  } catch (err) {
    console.error(err);
  }
}

checkSchema();
