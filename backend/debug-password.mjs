import { query } from './src/config/database.js';
import AuthService from './src/services/authService.js';
import PasswordService from './src/services/passwordService.js';

async function testFullFlow() {
  const email = 'test99@test.com';
  const plainPassword = 'Password@123'; // Probemos con esta, es un ejemplo común de validación fuerte
  const hashFromDb = '$argon2id$v=19$m=65536,t=3,p=4$euqhr5F95/NLGH/76RJBGQ$r/QHzsokr3g8HvFJmlUJXMSQD6QyDLOIWFKWYsyAATU';

  try {
    console.log('--- DB Content Test ---');
    const isValid = await PasswordService.verify(plainPassword, hashFromDb);
    console.log(`Verification with 'Password@123': ${isValid}`);

    // Si no es esa, vamos a intentar ver si hay algún error en el AuthService.login
    console.log('\n--- AuthService Test ---');
    try {
      await AuthService.login({
        email,
        password: plainPassword,
        clientIp: '127.0.0.1',
        userAgent: 'debug-tool'
      });
      console.log('✅ AuthService login successful');
    } catch (e) {
      console.log('❌ AuthService login failed:', e.message);
    }

  } catch (err) {
    console.error(err);
  }
}

testFullFlow();
