import { query } from './src/config/database.js';
import AuthService from './src/services/authService.js';

async function testLogin() {
  const email = 'test99@test.com';
  const passwords = ['Password@123', 'admin123', 'Nextnodes@2026', 'nextnodes'];
  const hashFromDb = '$argon2id$v=19$m=65536,t=3,p=4$euqhr5F95/NLGH/76RJBGQ$r/QHzsokr3g8HvFJmlUJXMSQD6QyDLOIWFKWYsyAATU';

  try {
    console.log('--- DB Content Test ---');
    for (const p of passwords) {
      const isValid = await PasswordService.verify(p, hashFromDb);
      console.log(`Verification with '${p}': ${isValid}`);
      if (isValid) {
        console.log('✅ FOUND PASSWORD!');
        break;
      }
    }
}

testLogin();
