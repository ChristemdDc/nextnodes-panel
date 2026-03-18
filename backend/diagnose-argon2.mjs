import argon2 from 'argon2';

async function diagnose() {
  const passwords = ['Password@123', 'undefined', ''];
  try {
    console.log('--- Testing argon2 ---');
    for (const p of passwords) {
      const hash = await argon2.hash(p, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4
      });
      console.log(`✅ Hash for '${p}':`, hash);
      const ok = await argon2.verify(hash, p);
      console.log(`   Verification: ${ok}`);
    }
  } catch (err) {
    console.error('❌ Argon2 error:', err);
  }
}

diagnose();
