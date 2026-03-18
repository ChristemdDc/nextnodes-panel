import { query } from './src/config/database.js';
import PasswordService from './src/services/passwordService.js';

async function deepAudit() {
  try {
    const audits = await query("SELECT * FROM login_audits ORDER BY id DESC LIMIT 10");
    console.log('--- Latest Audits ---');
    console.log(JSON.stringify(audits, null, 2));

    const latestUser = await query("SELECT * FROM users ORDER BY id DESC LIMIT 1");
    if (latestUser.length > 0) {
      const user = latestUser[0];
      console.log('\n--- Latest User ---');
      console.log(`Email: ${user.email}`);
      console.log(`Hash: "${user.hash || user.password_hash}"`);
      
      const passwordsToTest = ['Nextnodes@2026', 'nextnodes@2026', 'Password@123', 'NextNodes@2026'];
      console.log('\n--- Testing Passwords against this Hash ---');
      for (const p of passwordsToTest) {
        const ok = await PasswordService.verify(p, user.password_hash);
        console.log(`   '${p}': ${ok}`);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

deepAudit();
