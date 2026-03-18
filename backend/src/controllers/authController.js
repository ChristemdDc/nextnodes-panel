// src/controllers/authController.js - Handlers de endpoints

import AuthService from '../services/authService.js';

class AuthController {
  /**
   * POST /auth/register
   */
  static async register(req, res, next) {
    try {
      const { name, email, password } = req.body;
      const clientIp = req.ip || req.connection.remoteAddress;

      // Validación básica
      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          message: 'Email, contraseña y nombre son requeridos'
        });
      }

      console.log(`📝 [CTRL] Intentando registro: ${email} (Password length: ${password?.length})`);

      const result = await AuthService.register({
        email,
        password,
        name,
        clientIp
      });

      res.status(201).json(result);

    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/verify-email
   */
  static async verifyEmail(req, res, next) {
    try {
      const { email, code } = req.body;
      const clientIp = req.ip || req.connection.remoteAddress;

      if (!email || !code) {
        return res.status(400).json({
          success: false,
          message: 'Email y código requeridos'
        });
      }

      const result = await AuthService.verifyEmail({
        email,
        code,
        clientIp
      });

      res.json(result);

    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const clientIp = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent') || '';

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y contraseña requeridos'
        });
      }

      console.log(`🔐 [CTRL] Intentando login: ${email} (Password length: ${password?.length})`);

      const result = await AuthService.login({
        email,
        password,
        clientIp,
        userAgent
      });

      // Setear cookie segura
      res.cookie('sessionId', result.session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
      });

      res.json({
        success: true,
        user: result.user,
        session: result.session
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/google
   */
  static async loginWithGoogle(req, res, next) {
    try {
      const { id_token } = req.body;
      const clientIp = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent') || '';

      if (!id_token) {
        return res.status(400).json({
          success: false,
          message: 'Token de Google requerido'
        });
      }

      const result = await AuthService.loginWithGoogle({
        id_token,
        clientIp,
        userAgent
      });

      // Setear cookie segura
      res.cookie('sessionId', result.session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
      });

      res.json({
        success: true,
        user: result.user,
        session: result.session
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/logout
   */
  static async logout(req, res, next) {
    try {
      const sessionId = req.cookies.sessionId;

      if (sessionId) {
        await AuthService.logout({ sessionId });
      }

      res.clearCookie('sessionId');

      res.json({
        success: true,
        message: 'Sesión cerrada'
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /auth/me
   */
  static async getCurrentUser(req, res, next) {
    try {
      const sessionId = req.cookies.sessionId;

      if (!sessionId) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado'
        });
      }

      const session = await AuthService.validateSession({ sessionId });

      if (!session) {
        res.clearCookie('sessionId');
        return res.status(401).json({
          success: false,
          message: 'Sesión inválida'
        });
      }

      res.json({
        success: true,
        user: session.user,
        session: {
          id: session.session.user_id,
          expires_at: session.session.expires_at
        }
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/forgot-password
   */
  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const clientIp = req.ip || req.connection.remoteAddress;

      if (!email) {
        return res.status(400).json({ success: false, message: 'Email requerido' });
      }

      const result = await AuthService.forgotPassword({ email, clientIp });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/reset-password
   */
  static async resetPassword(req, res, next) {
    try {
      const { email, token, password } = req.body;
      const clientIp = req.ip || req.connection.remoteAddress;

      if (!email || !token || !password) {
        return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
      }

      const result = await AuthService.resetPassword({ email, token, newPassword: password, clientIp });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
