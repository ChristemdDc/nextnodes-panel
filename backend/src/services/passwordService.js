// src/services/passwordService.js - Hash y verificación de contraseñas

import argon2 from 'argon2';

class PasswordService {
  static async hash(password) {
    try {
      return await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 65536,  // 64 MB
        timeCost: 3,
        parallelism: 4
      });
    } catch (error) {
      console.error('❌ Error hashing password:', error);
      throw new Error('Error procesando contraseña');
    }
  }

  static async verify(password, hash) {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      console.error('❌ Error verifying password:', error);
      return false;
    }
  }

  static async needsRehash(hash) {
    try {
      return argon2.needsRehash(hash);
    } catch (error) {
      return false;
    }
  }
}

export default PasswordService;
