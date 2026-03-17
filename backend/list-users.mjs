import { query } from './src/config/database.js';

async function listUsers() {
  try {
    const users = await query("SELECT * FROM users");
    console.log('--- users ---');
    console.log(JSON.stringify(users, null, 2));
  } catch (err) {
    console.error(err);
  }
}

listUsers();
