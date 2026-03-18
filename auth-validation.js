/**
 * NextNodes Auth Validation Service
 * Validaciones de seguridad y formato para el sistema de autenticación
 */

class AuthValidation {
  /**
   * Valida formato y estructura de email
   */
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Normaliza el email (lowercase, trim)
   */
  static normalizeEmail(email) {
    return email.toLowerCase().trim();
  }

  /**
   * Valida fortaleza de contraseña
   * Requisitos:
   * - Mínimo 8 caracteres
   * - Al menos una mayúscula
   * - Al menos una minúscula
   * - Al menos un número
   * - Al menos un carácter especial
   */
  static validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const isLongEnough = password.length >= minLength;

    const strength = {
      valid: isLongEnough && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar,
      score: 0,
      feedback: []
    };

    if (isLongEnough) strength.score++;
    else strength.feedback.push('Mínimo 8 caracteres');

    if (hasUpperCase) strength.score++;
    else strength.feedback.push('Al menos una mayúscula (A-Z)');

    if (hasLowerCase) strength.score++;
    else strength.feedback.push('Al menos una minúscula (a-z)');

    if (hasNumber) strength.score++;
    else strength.feedback.push('Al menos un número (0-9)');

    if (hasSpecialChar) strength.score++;
    else strength.feedback.push('Al menos un carácter especial (!@#$%...)');

    return strength;
  }

  /**
   * Valida código de verificación
   */
  static validateVerificationCode(code) {
    // Código debe ser numérico de 6 dígitos
    return /^\d{6}$/.test(code);
  }

  /**
   * Valida token de recuperación
   */
  static validateResetToken(token) {
    return token && token.length >= 32;
  }

  /**
   * Obtiene feedback de fortaleza de contraseña
   */
  static getPasswordStrengthFeedback(password) {
    const strength = this.validatePasswordStrength(password);
    
    const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
    const labels = ['Muy débil', 'Débil', 'Aceptable', 'Fuerte', 'Muy fuerte'];

    return {
      valid: strength.valid,
      score: strength.score,
      label: labels[strength.score - 1] || 'Muy débil',
      color: colors[strength.score - 1],
      feedback: strength.feedback,
      percentage: (strength.score / 5) * 100
    };
  }
}

/**
 * Rate Limiting Service
 * Control local para prevenir abuso
 */
class RateLimiter {
  constructor() {
    this.attempts = {};
    this.blockList = {};
  }

  /**
   * Valida si el usuario puede intentar
   * @param {string} key - IP o email a limitar
   * @param {number} maxAttempts - Máximo de intentos permitidos
   * @param {number} windowMs - Ventana de tiempo en ms
   */
  isAllowed(key, maxAttempts = 5, windowMs = 300000) {
    const now = Date.now();
    
    if (!this.attempts[key]) {
      this.attempts[key] = [];
    }

    // Limpia intentos fuera de la ventana
    this.attempts[key] = this.attempts[key].filter(time => now - time < windowMs);

    // Verifica si está bloqueado
    if (this.blockList[key] && this.blockList[key] > now) {
      return false;
    }

    if (this.attempts[key].length >= maxAttempts) {
      // Bloquea por 15 minutos
      this.blockList[key] = now + 900000;
      return false;
    }

    // Registra el intento
    this.attempts[key].push(now);
    return true;
  }

  /**
   * Obtiene información de intentos restantes
   */
  getRemainingAttempts(key, maxAttempts = 5, windowMs = 300000) {
    const now = Date.now();
    
    if (!this.attempts[key]) {
      return maxAttempts;
    }

    const validAttempts = this.attempts[key].filter(time => now - time < windowMs);
    return Math.max(0, maxAttempts - validAttempts.length);
  }

  /**
   * Verifica si está bloqueado
   */
  isBlocked(key) {
    const block = this.blockList[key];
    if (!block) return false;
    if (block > Date.now()) return true;
    
    delete this.blockList[key];
    return false;
  }

  /**
   * Obtiene tiempo de bloqueo en segundos
   */
  getBlockTime(key) {
    const block = this.blockList[key];
    if (!block) return 0;
    
    const remaining = Math.max(0, block - Date.now());
    return Math.ceil(remaining / 1000);
  }
}

// Exportar para uso modular
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AuthValidation, RateLimiter };
}
