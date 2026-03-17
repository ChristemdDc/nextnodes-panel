// Configuración centralizada del sistema de autenticación

const CONFIG = {
  // API Base URL - Cambiar según ambiente
  API_BASE_URL: (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
    ? 'https://api.nextnodes.com/api/v1'
    : 'http://localhost:8081/api/v1',

  // Google OAuth
  GOOGLE_CLIENT_ID: '1001223855231-8t4eq0a26eon13p5g3os5i24l9uj6rkp.apps.googleusercontent.com',

  // Timeouts
  AUTH_TIMEOUT: 30000, // 30 segundos para requests de autenticación

  // Rate Limiting (estas son las límites, el backend también las tiene)
  RATE_LIMIT: {
    LOGIN: { 
      attempts: 5, 
      window: 300000,  // 5 minutos
      label: 'login' 
    },
    REGISTER: { 
      attempts: 3, 
      window: 300000,  // 5 minutos
      label: 'register' 
    },
    VERIFY: { 
      attempts: 5, 
      window: 300000,  // 5 minutos
      label: 'verify' 
    },
    RESEND: { 
      attempts: 3, 
      window: 600000,  // 10 minutos
      label: 'resend' 
    },
    RESET: { 
      attempts: 3, 
      window: 600000,  // 10 minutos
      label: 'reset'
    }
  },

  // Session
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 horas
  SESSION_KEY: 'session',
  PENDING_EMAIL_KEY: 'pendingEmail',

  // Mensajes de Usuario
  MESSAGES: {
    // Login
    LOGIN_SUCCESS: '¡Bienvenido!',
    LOGIN_FAILED: 'Email o contraseña incorrectos',
    LOGIN_BLOCKED: 'Demasiados intentos. Intenta en unos minutos.',
    
    // Signup
    SIGNUP_SUCCESS: 'Registro exitoso. Verifica tu email.',
    EMAIL_ALREADY_EXISTS: 'Este email ya está registrado',
    SIGNUP_BLOCKED: 'Demasiados intentos de registro. Intenta más tarde.',
    
    // Email
    EMAIL_INVALID: 'Email inválido',
    EMAIL_VERIFIED: 'Email verificado correctamente',
    EMAIL_VERIFICATION_FAILED: 'Código inválido o expirado',
    
    // Password
    PASSWORD_WEAK: 'Contraseña muy débil',
    PASSWORD_REQUIRED: 'Contraseña requerida',
    PASSWORDS_MISMATCH: 'Las contraseñas no coinciden',
    PASSWORD_RESET_SUCCESS: 'Contraseña actualizada. Redirigiendo...',
    PASSWORD_RESET_FAILED: 'Error actualizando contraseña',
    
    // Verificación
    VERIFY_BLOCKED: 'Demasiados intentos. Intenta más tarde.',
    VERIFY_SUCCESS: 'Email verificado. Puedes iniciar sesión.',
    
    // Reset
    RESET_LINK_SENT: 'Si el email existe, recibirás instrucciones',
    RESET_TOKEN_INVALID: 'Token inválido o expirado',
    
    // Errores genéricos
    NETWORK_ERROR: 'Error de conexión. Intenta de nuevo.',
    UNEXPECTED_ERROR: 'Error inesperado. Intenta de nuevo.',
    
    // Google
    GOOGLE_LOGIN_SUCCESS: '¡Login con Google exitoso!',
    GOOGLE_LOGIN_FAILED: 'Error con Google Sign-In',
    GOOGLE_TOKEN_INVALID: 'Token de Google inválido',
  },

  // Validación - Password Strength Labels
  PASSWORD_STRENGTH: {
    WEAK: { score: 1, label: 'Muy débil', color: '#ef4444' },      // red
    FAIR: { score: 2, label: 'Débil', color: '#f97316' },           // orange
    GOOD: { score: 3, label: 'Buena', color: '#eab308' },           // yellow
    STRONG: { score: 4, label: 'Fuerte', color: '#22c55e' },        // green
    VERY_STRONG: { score: 5, label: 'Muy fuerte', color: '#10b981' } // emerald
  },

  // Validación - Password Requirements
  PASSWORD_REQUIREMENTS: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true
  },

  // Verificación - Code
  VERIFICATION_CODE_LENGTH: 6,
  VERIFICATION_CODE_EXPIRY: 15 * 60 * 1000, // 15 minutos

  // Resend cooldown (segundos)
  RESEND_COOLDOWN: 60, // 60 segundos entre resends

  // Email regex (RFC 5322 simplificado)
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Features flags
  FEATURES: {
    GOOGLE_OAUTH: true,
    PASSWORD_RESET: true,
    EMAIL_VERIFICATION: true,
    RATE_LIMITING: true,
    AUDIT_LOGGING: true
  }
};

// Exportar configuración
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
