/**
 * NextNodes Auth Service
 * Servicio principal de autenticación para el frontend
 */

class AuthService {
  constructor() {
    this.apiUrl = localStorage.getItem('apiUrl') || 'http://localhost:8081/api/v1';
    this.session = null;
    this.user = null;
    this.rateLimiter = new RateLimiter();
    console.log('AuthService: Inicializando...');
    this.initSession();
    console.log('AuthService: Sesión cargada:', this.isAuthenticated() ? 'SÍ' : 'NO');
  }

  /**
   * Inicializa la sesión desde localStorage
   */
  initSession() {
    const sessionData = localStorage.getItem('nextnodes_session');
    const userData = localStorage.getItem('nextnodes_user');
    
    if (sessionData) {
      try {
        this.session = JSON.parse(sessionData);
        if (userData) {
          this.user = JSON.parse(userData);
        }
      } catch (e) {
        console.error('Error al cargar sesión:', e);
        this.clearSession();
      }
    }
  }

  /**
   * Registro con email y contraseña
   */
  async register(formData) {
    const { name, email, password, passwordConfirm, termsAccepted } = formData;

    // Validaciones básicas
    if (!AuthValidation.validateEmail(email)) {
      throw new Error('Email inválido');
    }

    if (password !== passwordConfirm) {
      throw new Error('Las contraseñas no coinciden');
    }

    const strengthCheck = AuthValidation.validatePasswordStrength(password);
    if (!strengthCheck.valid) {
      throw new Error(`Contraseña débil: ${strengthCheck.feedback.join(', ')}`);
    }

    if (!termsAccepted) {
      throw new Error('Debes aceptar los términos y condiciones');
    }

    // Rate limiting
    const clientIp = await this.getClientIp();
    if (!this.rateLimiter.isAllowed(`register_${clientIp}`, 3, 300000)) {
      const blockTime = this.rateLimiter.getBlockTime(`register_${clientIp}`);
      throw new Error(`Demasiados intentos. Intenta en ${blockTime} segundos`);
    }

    try {
      const response = await fetch(`${this.apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          email: AuthValidation.normalizeEmail(email),
          password,
          client_ip: clientIp
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al registrar');
      }

      const data = await response.json();
      
      // Guardar estado temporal para verificación
      localStorage.setItem('pendingEmail', AuthValidation.normalizeEmail(email));
      
      return {
        success: true,
        message: 'Registro exitoso. Revisa tu email para verificar tu cuenta',
        requiresVerification: true
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verifica email mediante código
   */
  async verifyEmail(email, code) {
    if (!AuthValidation.validateVerificationCode(code)) {
      throw new Error('Código inválido. Debe ser 6 dígitos');
    }

    const clientIp = await this.getClientIp();
    if (!this.rateLimiter.isAllowed(`verify_${email}`, 5, 300000)) {
      const blockTime = this.rateLimiter.getBlockTime(`verify_${email}`);
      throw new Error(`Demasiados intentos. Intenta en ${blockTime} segundos`);
    }

    try {
      const response = await fetch(`${this.apiUrl}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: AuthValidation.normalizeEmail(email),
          code,
          client_ip: clientIp
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Código inválido o expirado');
      }

      const data = await response.json();
      localStorage.removeItem('pendingEmail');
      
      return {
        success: true,
        message: 'Email verificado correctamente'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reenvía código de verificación
   */
  async resendVerificationCode(email) {
    const clientIp = await this.getClientIp();
    if (!this.rateLimiter.isAllowed(`resend_${email}`, 3, 600000)) {
      const blockTime = this.rateLimiter.getBlockTime(`resend_${email}`);
      throw new Error(`Demasiados reenvíos. Intenta en ${Math.ceil(blockTime / 60)} minutos`);
    }

    try {
      const response = await fetch(`${this.apiUrl}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: AuthValidation.normalizeEmail(email),
          client_ip: clientIp
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al reenviar código');
      }

      return {
        success: true,
        message: 'Código reenviado a tu email'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Login con email y contraseña
   */
  async login(email, password) {
    if (!AuthValidation.validateEmail(email)) {
      throw new Error('Email inválido');
    }

    const clientIp = await this.getClientIp();
    const normalizedEmail = AuthValidation.normalizeEmail(email);

    if (!this.rateLimiter.isAllowed(`login_${normalizedEmail}`, 5, 300000)) {
      const blockTime = this.rateLimiter.getBlockTime(`login_${normalizedEmail}`);
      throw new Error(`Demasiados intentos. Intenta en ${blockTime} segundos`);
    }

    // Anti-enumeration: no revelar si el email existe
    const genericError = 'Email o contraseña incorrectos';

    try {
      const response = await fetch(`${this.apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          client_ip: clientIp,
          user_agent: navigator.userAgent
        })
      });

      if (!response.ok) {
        throw new Error(genericError);
      }

      const data = await response.json();
      
      // Almacenar sesión
      this.saveSession(data.session, data.user);

      // Limpiar rate limiter en login exitoso
      delete this.rateLimiter.attempts[`login_${normalizedEmail}`];

      return {
        success: true,
        message: 'Login exitoso',
        user: data.user
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Login con Google
   */
  async loginWithGoogle(idToken) {
    const clientIp = await this.getClientIp();

    try {
      const response = await fetch(`${this.apiUrl}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id_token: idToken,
          client_ip: clientIp,
          user_agent: navigator.userAgent
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al iniciar sesión con Google');
      }

      const data = await response.json();

      // Almacenar sesión
      this.saveSession(data.session, data.user);

      return {
        success: true,
        message: 'Login con Google exitoso',
        user: data.user
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Solicita recuperación de contraseña
   */
  async requestPasswordReset(email) {
    if (!AuthValidation.validateEmail(email)) {
      throw new Error('Email inválido');
    }

    const clientIp = await this.getClientIp();

    // Anti-enumeration: no revelar si el email existe
    if (!this.rateLimiter.isAllowed(`reset_${email}`, 3, 600000)) {
      throw new Error('Demasiadas solicitudes. Intenta más tarde');
    }

    try {
      const response = await fetch(`${this.apiUrl}/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: AuthValidation.normalizeEmail(email),
          client_ip: clientIp
        })
      });

      if (!response.ok) {
        throw new Error('Error al procesar solicitud');
      }

      // Mensaje genérico para seguridad
      return {
        success: true,
        message: 'Si el email existe, recibirás instrucciones para resetear tu contraseña'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Valida token de recuperación
   */
  async validateResetToken(token) {
    try {
      const response = await fetch(`${this.apiUrl}/auth/validate-reset-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        throw new Error('Token inválido o expirado');
      }

      const data = await response.json();
      return {
        valid: true,
        email: data.email
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Resetea la contraseña
   */
  async resetPassword(token, newPassword) {
    const strengthCheck = AuthValidation.validatePasswordStrength(newPassword);
    if (!strengthCheck.valid) {
      throw new Error(`Contraseña débil: ${strengthCheck.feedback.join(', ')}`);
    }

    try {
      const response = await fetch(`${this.apiUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          new_password: newPassword
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al resetear contraseña');
      }

      return {
        success: true,
        message: 'Contraseña reseteada correctamente. Puedes iniciar sesión'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout
   */
  async logout() {
    try {
      await fetch(`${this.apiUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      this.clearSession();
    }
  }

  /**
   * Guarda la sesión
   */
  saveSession(sessionData, userData = null) {
    this.session = sessionData;
    localStorage.setItem('nextnodes_session', JSON.stringify(sessionData));
    
    if (userData) {
      this.user = userData;
      localStorage.setItem('nextnodes_user', JSON.stringify(userData));
    }
    
    // Notificar cambio de UI
    if (window.updateUserUI) {
      window.updateUserUI();
    }
  }

  /**
   * Limpia la sesión
   */
  clearSession() {
    this.session = null;
    this.user = null;
    localStorage.removeItem('nextnodes_session');
    localStorage.removeItem('nextnodes_user');
    localStorage.removeItem('pendingEmail');
    
    // Notificar cambio de UI
    if (window.updateUserUI) {
      window.updateUserUI();
    }
  }

  /**
   * Verifica si está autenticado
   */
  isAuthenticated() {
    return !!this.session && !!this.user;
  }

  /**
   * Obtiene IP del cliente
   */
  async getClientIp() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser() {
    return this.user;
  }

  /**
   * Obtiene la sesión actual
   */
  getSession() {
    return this.session;
  }
}

// Instancia global
window.authService = null;

document.addEventListener('DOMContentLoaded', () => {
  window.authService = new AuthService();
  console.log('AuthService: Instancia global creada');
});
