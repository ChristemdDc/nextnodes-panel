// Listeners de eventos para autenticación

/**
 * AUTO-AVANCE EN INPUTS DE CÓDIGO
 * Cuando el usuario escribe un dígito, avanza automáticamente al siguiente
 */
function setupCodeInputAutoAdvance() {
  const codeInputs = document.querySelectorAll('.code-input-group .code-input');

  codeInputs.forEach((input, index) => {
    // Input - avanzar al siguiente
    input.addEventListener('input', (e) => {
      if (e.target.value.length === 1 && index < codeInputs.length - 1) {
        codeInputs[index + 1].focus();
      }
    });

    // Backspace - ir al anterior
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && index > 0 && !e.target.value) {
        codeInputs[index - 1].focus();
      }
    });

    // Solo permitir números
    input.addEventListener('keypress', (e) => {
      if (!/[0-9]/.test(e.key)) {
        e.preventDefault();
      }
    });

    // Paste - distribuir números entre inputs
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const paste = (e.clipboardData || window.clipboardData).getData('text');
      const digits = paste.replace(/\D/g, '').split('');

      digits.forEach((digit, i) => {
        if (index + i < codeInputs.length) {
          codeInputs[index + i].value = digit;
        }
      });

      if (digits.length > 0) {
        codeInputs[Math.min(index + digits.length - 1, codeInputs.length - 1)].focus();
      }
    });
  });
}

/**
 * TOGGLE DE VISIBILIDAD DE CONTRASEÑA
 * Mostrar / ocultar contraseña
 */
function setupPasswordToggle() {
  document.querySelectorAll('.toggle-password').forEach(toggle => {
    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      
      const input = this.previousElementSibling;
      if (!input || !input.hasAttribute('type')) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      
      // Cambiar icono del toggle
      this.textContent = isPassword ? '👁️‍🗨️' : '👁️';
      this.setAttribute('aria-label', isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');
    });
  });
}

/**
 * INDICADOR DE FUERZA DE CONTRASEÑA
 * Actualiza en tiempo real mientras el usuario escribe
 */
function setupPasswordStrengthIndicator() {
  document.querySelectorAll('[data-password-input]').forEach(input => {
    const indicatorId = input.getAttribute('data-password-indicator');
    if (!indicatorId) return;

    const indicatorBar = document.getElementById(indicatorId);
    if (!indicatorBar) return;

    input.addEventListener('input', (e) => {
      const password = e.target.value;
      const result = AuthValidation.validatePasswordStrength(password);

      // Actualizar barra
      const percentage = (result.score / 5) * 100;
      indicatorBar.style.width = `${percentage}%`;

      // Actualizar color y clase
      let strengthClass = 'strength-weak';
      if (result.score <= 1) strengthClass = 'strength-weak';
      else if (result.score <= 2) strengthClass = 'strength-fair';
      else if (result.score <= 3) strengthClass = 'strength-good';
      else if (result.score <= 4) strengthClass = 'strength-strong';
      else strengthClass = 'strength-very-strong';

      indicatorBar.className = `password-strength-bar ${strengthClass}`;

      // Actualizar feedback si existe
      const feedbackId = input.getAttribute('data-password-feedback');
      if (feedbackId) {
        const feedbackEl = document.getElementById(feedbackId);
        if (feedbackEl) {
          if (password.length === 0) {
            feedbackEl.textContent = '';
            feedbackEl.className = '';
          } else {
            const strength = CONFIG.PASSWORD_STRENGTH[
              result.score <= 1 ? 'WEAK' :
              result.score <= 2 ? 'FAIR' :
              result.score <= 3 ? 'GOOD' :
              result.score <= 4 ? 'STRONG' :
              'VERY_STRONG'
            ];
            feedbackEl.textContent = strength.label;
            feedbackEl.style.color = strength.color;
          }
        }
      }
    });
  });
}

/**
 * GOOGLE SIGN-IN
 * Inicializa Google Identity y renderiza el botón
 */
function setupGoogleSignIn() {
  if (!CONFIG.FEATURES.GOOGLE_OAUTH) return;

  // Verificar que Google está disponible
  if (!window.google?.accounts?.id) {
    console.warn('Google Identity Services no cargado.');
    const containers = ['google-login-button', 'google-signup-button'];
    containers.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '<p style="font-size: 0.8rem; color: #ef4444; text-align: center;">Error: Carga con un servidor local (http) para habilitar Google</p>';
    });
    return;
  }

  try {
    // Inicializar Google Sign-In
    window.google.accounts.id.initialize({
      client_id: CONFIG.GOOGLE_CLIENT_ID,
      callback: handleGoogleSignInResponse,
      error_callback: handleGoogleSignInError,
      auto_select: false // Evita confusiones en local
    });

    renderGoogleButtons();

  } catch (error) {
    console.error('Error inicializando Google Sign-In:', error);
  }
}

/**
 * RE-RENDERIZA LOS BOTONES DE GOOGLE
 * Esto es necesario si los contenedores estaban ocultos al inicio
 */
function renderGoogleButtons() {
  if (!window.google?.accounts?.id) {
    console.warn('⚠️ Google SDK no listo para renderizar.');
    return;
  }

  const buttons = [
    { id: 'google-login-button', text: 'continue_with' },
    { id: 'google-signup-button', text: 'signup_with' }
  ];

  buttons.forEach(btn => {
    const container = document.getElementById(btn.id);
    if (container) {
      console.log(`🖌️ Renderizando botón Google en: ${btn.id}`);
      container.innerHTML = ''; 
      try {
        window.google.accounts.id.renderButton(container, {
          theme: 'outline', // El tema 'outline' es más visible en fondos oscuros
          size: 'large',
          text: btn.text,
          shape: 'pill',
          width: 280 // Forzamos un ancho fijo para evitar problemas de detección
        });
      } catch (err) {
        console.error(`❌ Error al renderizar botón ${btn.id}:`, err);
      }
    }
  });
}

/**
 * RESPONSE DE GOOGLE SIGN-IN
 * Maneja la respuesta positiva de Google
 */
async function handleGoogleSignInResponse(response) {
  if (!response?.credential) {
    showMessage('loginMessage', 'error', CONFIG.MESSAGES.GOOGLE_TOKEN_INVALID);
    return;
  }

  try {
    showLoading('loginForm', true);

    // Llamar al servicio
    const session = await authService.loginWithGoogle(response.credential);

    // Guardar sesión
    authService.saveSession(session);

    const messageType = session.isNewUser ? 'success' : 'success';
    const messageText = session.isNewUser 
      ? 'Bienvenido a NextNodes! 🎉' 
      : CONFIG.MESSAGES.GOOGLE_LOGIN_SUCCESS;

    showMessage('loginMessage', messageType, messageText);

    // Redirigir al dashboard
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);

  } catch (error) {
    console.error('Google Sign-In error:', error); // Log the actual error
    // Mostrar error al usuario
    const messageContainer = document.getElementById('auth-login-view').classList.contains('active')
      ? 'auth-login-message'
      : 'auth-signup-message';

    showMessage(messageContainer, 'error', 'Error al conectar con el servidor. Asegúrate de que el backend esté corriendo.');
  } finally {
    showLoading('loginForm', false);
  }
}

/**
 * ERROR DE GOOGLE SIGN-IN
 */
function handleGoogleSignInError(error) {
  console.error('Google Sign-In Error:', error);
  showMessage('loginMessage', 'error', CONFIG.MESSAGES.GOOGLE_LOGIN_FAILED);
}

/**
 * VALIDACIÓN EN TIEMPO REAL DE EMAIL
 * Muestra feedback mientras el usuario escribe
 */
function setupEmailValidationFeedback() {
  document.querySelectorAll('input[type="email"]').forEach(input => {
    input.addEventListener('blur', (e) => {
      const email = e.target.value.trim();
      
      if (!email) {
        e.target.classList.remove('is-valid', 'is-invalid');
        return;
      }

      const isValid = CONFIG.EMAIL_REGEX.test(email) && 
                      AuthValidation.validateEmail(email);

      if (isValid) {
        e.target.classList.add('is-valid');
        e.target.classList.remove('is-invalid');
      } else {
        e.target.classList.add('is-invalid');
        e.target.classList.remove('is-valid');
      }
    });

    // Limpiar validación cuando enfoca
    input.addEventListener('focus', (e) => {
      e.target.classList.remove('is-valid', 'is-invalid');
    });
  });
}

/**
 * LINKS DE NAVEGACIÓN AUTH
 * Permite navegar entre vistas sin recarga
 */
// Redundante con form-handlers.js, se prefiere setupAuthNavigationLinks
function setupAuthLinks() {
  // Eliminado para evitar conflictos
}

/**
 * RESEND CODE BUTTON
 * Atacher evento al botón de reenviar código
 */
function setupResendCodeButton() {
  const resendBtn = document.getElementById('resendCodeBtn');
  if (resendBtn) {
    resendBtn.addEventListener('click', handleResendCode);
  }
}

/**
 * CARGAR SCRIPT DE GOOGLE
 * Carga el script de Google Identity si no está cargado
 */
function loadGoogleScript() {
  if (window.google?.accounts?.id) {
    // Ya está cargado
    setupGoogleSignIn();
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  script.onload = setupGoogleSignIn;
  script.onerror = () => {
    console.error('Error cargando Google Identity Services');
  };
  document.head.appendChild(script);
}

/**
 * INICIALIZACIÓN
 * Se ejecuta cuando el DOM está completamente cargado
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('📱 Inicializando event listeners de autenticación...');

  try {
    // Código - auto avance
    setupCodeInputAutoAdvance();

    // Contraseña - toggle y fortaleza
    setupPasswordToggle();
    setupPasswordStrengthIndicator();

    // Email - validación en tiempo real
    setupEmailValidationFeedback();

    // Links de navegación
    setupAuthLinks();

    // Resend button
    setupResendCodeButton();

    // Google Sign-In
    loadGoogleScript();

    // Hacer render público para main.js
    window.renderGoogleButtons = renderGoogleButtons;

    console.log('✅ Event listeners inicializados');

  } catch (error) {
    console.error('❌ Error en inicialización:', error);
  }
});

/**
 * CLEANUP CUANDO SE SALE DE LA PÁGINA
 * (Opcional - para limpiar recursos)
 */
window.addEventListener('beforeunload', () => {
  // Aquí podrías hacer cleanup si es necesario
});
