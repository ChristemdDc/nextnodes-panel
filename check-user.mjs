import { query } from './backend/src/config/database.js';

async function checkUser() {
  try {
    const users = await query("SELECT id, email, email_normalized, email_verified, account_status, password_hash FROM users");
    console.log('--- users ---');
    console.log(JSON.stringify(users, null, 2));
    
    const codes = await query("SELECT * FROM email_verification_codes");
    console.log('\n--- codes ---');
    console.log(JSON.stringify(codes, null, 2));

    const audits = await query("SELECT * FROM login_audits ORDER BY created_at DESC LIMIT 5");
    console.log('\n--- audits ---');
    console.log(JSON.stringify(audits, null, 2));
  } catch (err) {
    console.error(err);
  }
}

checkUser();
