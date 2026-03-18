// src/services/authService.js - Lógica de autenticación
import { OAuth2Client } from 'google-auth-library';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';
import PasswordService from './passwordService.js';

// Helper for SQLite dates
const toSqliteDate = (date) => date.toISOString().replace('T', ' ').substring(0, 19);

class AuthService {
  /**
   * REGISTER - Crear nuevo usuario
   */
  static async register({ email, password, name, clientIp }) {
    // Email normalizado
    const normalizedEmail = email.toLowerCase().trim();

    // Verificar si existe
    const existing = await query(
      'SELECT id FROM users WHERE email_normalized = ?',
      [normalizedEmail]
    );

    if (existing.length > 0) {
      const error = new Error('Este email ya está registrado');
      error.status = 409;
      throw error;
    }

    // Hash de contraseña
    const passwordHash = await PasswordService.hash(password);
    console.log(`🔑 REGISTER: Email="${email}", Password length=${password.length}, Hash="${passwordHash}"`);

    // Crear usuario
    await query(
      `INSERT INTO users (email, email_normalized, name, password_hash, account_status)
       VALUES (?, ?, ?, ?, 'pending_verification')`,
      [email, normalizedEmail, name, passwordHash]
    );

    const users = await query('SELECT id FROM users WHERE email_normalized = ?', [normalizedEmail]);
    const userId = users[0].id;

    // Generar código de verificación (6 dígitos)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = Buffer.from(code).toString('base64'); // Simple hash para demo

    const expiryTime = toSqliteDate(new Date(Date.now() + 15 * 60 * 1000)); // 15 minutos

    await query(
      `INSERT INTO email_verification_codes (user_id, code_hash, expires_at)
       VALUES (?, ?, ?)`,
      [userId, codeHash, expiryTime]
    );

    // Auditoría
    await query(
      `INSERT INTO login_audits (user_id, email, event_type, ip_address, result)
       VALUES (?, ?, 'register_attempt', ?, 'success')`,
      [userId, email, clientIp]
    );

    console.log(`ℹ️  Código para ${email}: ${code}`); // Debug - en prod usar email service

    return {
      success: true,
      user: {
        id: userId,
        email: email,
        name: name,
        account_status: 'pending_verification'
      },
      message: 'Usuario creado. Código enviado por email.'
    };
  }

  /**
   * VERIFY EMAIL - Verificar código
   */
  static async verifyEmail({ email, code, clientIp }) {
    const normalizedEmail = email.toLowerCase().trim();
    const codeHash = Buffer.from(code).toString('base64');

    // Buscar usuario
    const users = await query(
      'SELECT id FROM users WHERE email_normalized = ?',
      [normalizedEmail]
    );

    if (users.length === 0) {
      const error = new Error('Email no encontrado');
      error.status = 404;
      throw error;
    }

    const userId = users[0].id;

    // Buscar código válido
    const codes = await query(
      `SELECT id FROM email_verification_codes 
       WHERE user_id = ? AND code_hash = ? AND used = 0 AND expires_at > CURRENT_TIMESTAMP`,
      [userId, codeHash]
    );

    if (codes.length === 0) {
      await query(
        `INSERT INTO login_audits (user_id, email, event_type, ip_address, result)
         VALUES (?, ?, 'email_verification_failed', ?, 'invalid_code')`,
        [userId, email, clientIp]
      );

      const error = new Error('Código inválido o expirado');
      error.status = 400;
      throw error;
    }

    // Marcar código como usado
    await query(
      'UPDATE email_verification_codes SET used = 1, used_at = CURRENT_TIMESTAMP WHERE id = ?',
      [codes[0].id]
    );

    // Verificar email en usuario
    await query(
      `UPDATE users SET email_verified = 1, email_verified_at = CURRENT_TIMESTAMP, account_status = 'active'
       WHERE id = ?`,
      [userId]
    );

    // Auditoría
    await query(
      `INSERT INTO login_audits (user_id, email, event_type, ip_address, result)
       VALUES (?, ?, 'email_verified', ?, 'success')`,
      [userId, email, clientIp]
    );

    return {
      success: true,
      message: 'Email verificado correctamente'
    };
  }

  /**
   * LOGIN - Autenticar usuario
   */
  static async login({ email, password, clientIp, userAgent }) {
    const normalizedEmail = email.toLowerCase().trim();

    // Buscar usuario
    const users = await query(
      `SELECT id, email, name, password_hash, email_verified, failed_login_count, locked_until
       FROM users WHERE email_normalized = ?`,
      [normalizedEmail]
    );

    // Anti-enumeración
    const genericError = new Error('Email o contraseña incorrectos');
    genericError.status = 401;

    if (users.length === 0) {
      await query(
        `INSERT INTO login_audits (email, event_type, ip_address, user_agent, result)
         VALUES (?, 'login_failure', ?, ?, 'user_not_found')`,
        [email, clientIp, userAgent]
      );
      throw genericError;
    }

    const user = users[0];

    // Verificar si está bloqueado
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      await query(
        `INSERT INTO login_audits (user_id, email, event_type, ip_address, user_agent, result)
         VALUES (?, ?, 'login_blocked', ?, ?, 'account_locked')`,
        [user.id, email, clientIp, userAgent]
      );
      const lockError = new Error('Cuenta bloqueada. Intenta más tarde.');
      lockError.status = 429;
      throw lockError;
    }

    // Verificar email verificado
    if (!user.email_verified) {
      throw genericError;
    }

    // Verificar contraseña
    console.log(`🔐 LOGIN: Email="${email}", Password length=${password.length}, StoredHash="${user.password_hash}"`);
    const isValid = await PasswordService.verify(password, user.password_hash);
    console.log(`🔐 LOGIN RESULT: ${isValid}`);

    if (!isValid) {
      // Incrementar fallos
      const newFailCount = user.failed_login_count + 1;
      let lockTime = null;

      if (newFailCount >= 5) {
        lockTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
      }

      await query(
        `UPDATE users SET failed_login_count = ?, locked_until = ? WHERE id = ?`,
        [newFailCount, lockTime, user.id]
      );

      await query(
        `INSERT INTO login_audits (user_id, email, event_type, ip_address, user_agent, result)
         VALUES (?, ?, 'login_failure', ?, ?, 'invalid_password')`,
        [user.id, email, clientIp, userAgent]
      );

      throw genericError;
    }

    // LOGIN EXITOSO
    // Crear sesión
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    await query(
      `INSERT INTO sessions (id, user_id, ip_address, user_agent, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [sessionId, user.id, clientIp, userAgent, expiresAt]
    );

    // Reset failed logins
    await query(
      `UPDATE users SET failed_login_count = 0, locked_until = NULL, last_login_at = CURRENT_TIMESTAMP, last_login_ip = ?
       WHERE id = ?`,
      [clientIp, user.id]
    );

    // Auditoría
    await query(
      `INSERT INTO login_audits (user_id, email, event_type, ip_address, user_agent, result)
       VALUES (?, ?, 'login_success', ?, ?, 'success')`,
      [user.id, email, clientIp, userAgent]
    );

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      session: {
        id: sessionId,
        expires_at: expiresAt.toISOString()
      }
    };
  }

  /**
   * GOOGLE LOGIN - Autenticar con Google
   */
  static async loginWithGoogle({ id_token, clientIp, userAgent }) {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    
    try {
      const ticket = await client.verifyIdToken({
        idToken: id_token,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      
      const payload = ticket.getPayload();
      const { sub: googleId, email, name, picture } = payload;
      const normalizedEmail = email.toLowerCase().trim();

      // Buscar usuario por google_id o email
      let users = await query(
        'SELECT id, email, name, email_verified, google_id FROM users WHERE google_id = ? OR email_normalized = ?',
        [googleId, normalizedEmail]
      );

      let user;

      if (users.length === 0) {
        // Crear nuevo usuario si no existe
        const result = await query(
          `INSERT INTO users (email, email_normalized, name, email_verified, email_verified_at, google_id, account_status)
           VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP, ?, 'active')`,
          [email, normalizedEmail, name, googleId]
        );
        
        // En SQLite con sqlite3 promisified, el ID se puede obtener con otra query o manejando el resultado diferente.
        // Pero para simplificar, buscaremos el usuario recién creado.
        const newUsers = await query('SELECT id FROM users WHERE google_id = ?', [googleId]);
        user = {
          id: newUsers[0].id,
          email,
          name
        };
      } else {
        user = users[0];
        // Actualizar google_id si solo tenía el email
        if (!user.google_id) {
          await query('UPDATE users SET google_id = ?, email_verified = true WHERE id = ?', [googleId, user.id]);
        }
      }

      // LOGIN EXITOSO - Crear sesión
      const sessionId = uuidv4();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

      await query(
        `INSERT INTO sessions (id, user_id, ip_address, user_agent, expires_at)
         VALUES (?, ?, ?, ?, ?)`,
        [sessionId, user.id, clientIp, userAgent, expiresAt]
      );

      // Auditoría
      await query(
        `INSERT INTO login_audits (user_id, email, event_type, ip_address, user_agent, result)
         VALUES (?, ?, 'google_login_success', ?, ?, 'success')`,
        [user.id, email, clientIp, userAgent]
      );

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        session: {
          id: sessionId,
          expires_at: expiresAt.toISOString()
        }
      };

    } catch (error) {
      console.error('Error verificando token de Google:', error);
      const authError = new Error('Token de Google inválido');
      authError.status = 401;
      throw authError;
    }
  }

  /**
   * LOGOUT - Cerrar sesión
   */
  static async logout({ sessionId }) {
    await query(
      'UPDATE sessions SET active = false WHERE id = ?',
      [sessionId]
    );

    return { success: true };
  }

  /**
   * VALIDATE SESSION
   */
  static async validateSession({ sessionId }) {
    const sessions = await query(
      `SELECT user_id, expires_at FROM sessions 
       WHERE id = ? AND active = true`,
      [sessionId]
    );

    if (sessions.length === 0) {
      return null;
    }

    const session = sessions[0];

    if (new Date(session.expires_at) < new Date()) {
      return null;
    }

    // Obtener usuario
    const users = await query(
      'SELECT id, email, name FROM users WHERE id = ?',
      [session.user_id]
    );

    return {
      userId: session.user_id,
      user: users[0],
      session: session
    };
  }

  /**
   * FORGOT PASSWORD - Solicitar reset
   */
  static async forgotPassword({ email, clientIp }) {
    const normalizedEmail = email.toLowerCase().trim();
    
    const users = await query('SELECT id FROM users WHERE email_normalized = ?', [normalizedEmail]);
    
    if (users.length === 0) {
      // Por seguridad, no informamos si el email no existe
      return { success: true, message: 'Si el email existe, se enviarán instrucciones.' };
    }

    const userId = users[0].id;
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenHash = Buffer.from(token).toString('base64');
    const expiryTime = toSqliteDate(new Date(Date.now() + 60 * 60 * 1000)); // 1 hora

    await query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES (?, ?, ?)`,
      [userId, tokenHash, expiryTime]
    );

    console.log(`🔑 Token de reset para ${email}: ${token}`);

    return { success: true, message: 'Instrucciones enviadas.' };
  }

  /**
   * RESET PASSWORD - Cambiar contraseña
   */
  static async resetPassword({ email, token, newPassword, clientIp }) {
    const normalizedEmail = email.toLowerCase().trim();
    const tokenHash = Buffer.from(token).toString('base64');

    const users = await query('SELECT id FROM users WHERE email_normalized = ?', [normalizedEmail]);
    if (users.length === 0) throw new Error('Email no encontrado');

    const userId = users[0].id;

    const tokens = await query(
      `SELECT id FROM password_reset_tokens 
       WHERE user_id = ? AND token_hash = ? AND used = 0 AND expires_at > CURRENT_TIMESTAMP`,
      [userId, tokenHash]
    );

    if (tokens.length === 0) {
      throw new Error('Token inválido o expirado');
    }

    const passwordHash = await PasswordService.hash(newPassword);

    await query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
    
    await query('UPDATE password_reset_tokens SET used = 1 WHERE id = ?', [tokens[0].id]);

    return { success: true, message: 'Contraseña actualizada correctamente' };
  }
}

export default AuthService;
