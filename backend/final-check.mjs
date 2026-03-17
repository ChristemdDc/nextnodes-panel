import argon2 from 'argon2';
import { query } from './src/config/database.js';

async function finalDiagnose() {
  const email = 'test99@test.com';
  const passwords = ['Password@123', 'admin123', 'Nextnodes@2026', 'nextnodes'];
  
  try {
    const users = await query('SELECT password_hash FROM users WHERE email_normalized = ?', [email]);
    if (users.length === 0) {
      console.log('User not found');
      return;
    }
    
    const hash = users[0].password_hash;
    console.log(`Hash in DB: ${hash}`);

    for (const p of passwords) {
      const match = await argon2.verify(hash, p);
      console.log(`Testing '${p}': ${match}`);
    }

    // Probar si el hash tiene caracteres extraños o está mal formado
    console.log(`Hash length: ${hash.length}`);
    
  } catch (err) {
    console.error(err);
  }
}

finalDiagnose();
