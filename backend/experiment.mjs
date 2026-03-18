import { query } from './src/config/database.js';
import PasswordService from './src/services/passwordService.js';
import AuthService from './src/services/authService.js';

async function experiment() {
  const email = 'test99@test.com';
  const newPassword = 'password123';
  
  try {
    console.log(`--- Experiment: Manual Password Update for ${email} ---`);
    
    // 1. Hash manually
    const newHash = await PasswordService.hash(newPassword);
    console.log(`New Hash: ${newHash}`);
    
    // 2. Update DB
    await query("UPDATE users SET password_hash = ? WHERE email_normalized = ?", [newHash, email.toLowerCase().trim()]);
    console.log('✅ DB Updated');
    
    // 3. Verify immediately with PasswordService
    const verify1 = await PasswordService.verify(newPassword, newHash);
    console.log(`Immediate Verification: ${verify1}`);
    
    // 4. Try Login via AuthService
    console.log('\n--- Attempting AuthService.login ---');
    try {
      const result = await AuthService.login({
        email,
        password: newPassword,
        clientIp: '127.0.0.1',
        userAgent: 'experiment-script'
      });
      console.log('✅ Login SUCCESS:', result.user.email);
    } catch (e) {
      console.log('❌ Login FAILED:', e.message);
    }
  } catch (err) {
    console.error(err);
  }
}

experiment();
