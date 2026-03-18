import { query } from './backend/src/config/database.js';

async function cleanup() {
  try {
    console.log('🧹 Limpieza rápida para debug...');
    const tables = ['login_audits', 'email_verification_codes', 'password_reset_tokens', 'sessions', 'users'];
    for (const table of tables) {
      await query(`DELETE FROM ${table}`);
      console.log(`✅ ${table} limpia.`);
    }
    await query("DELETE FROM sqlite_sequence");
    console.log('✨ DB Lista.');
  } catch (err) {
    console.error(err);
  }
}
cleanup();
