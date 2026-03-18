import axios from 'axios';

async function testApi() {
  const email = `api_test_${Date.now()}@example.com`;
  const password = 'Nextnodes@2026';
  const name = 'API Tester';
  const baseUrl = 'http://localhost:8081/api/v1';

  try {
    console.log(`--- Testing API Flow for ${email} ---`);
    
    // 1. Register
    console.log('1. Registering...');
    const regRes = await axios.post(`${baseUrl}/auth/register`, {
      name,
      email,
      password
    });
    console.log('✅ Registration OK');

    // 2. Fetch code from DB (using my debug tool logic)
    // Note: I'll assume the code is printed in the console if I could see it, 
    // but here I'll just check the DB directly via a child process or similar if needed.
    // For now, let's just test if login fails BEFORE verification or after.
    
    // 3. Login attempt
    console.log('2. Attempting login (should fail because not verified)...');
    try {
      await axios.post(`${baseUrl}/auth/login`, {
        email,
        password
      });
      console.log('❌ Error: Login worked but should have failed verification');
    } catch (e) {
      console.log(`✅ Expected failure: ${e.response?.data?.message || e.message}`);
    }

    // 4. Manual Verification in DB (to simulate user bypass)
    // I specify this so I can test the password check.
    
  } catch (err) {
    console.error('❌ API Test Error:', err.response?.data || err.message);
  }
}

testApi();
