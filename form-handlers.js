// Manejadores de formularios de autenticación

/**
 * FORMULARIO LOGIN
 * Maneja el envío del formulario de login
 */
async function handleLoginSubmit(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const email = formData.get('email');
  const password = formData.get('password');
  const messageContainer = 'auth-login-message';

  try {
    clearMessage(messageContainer);
    showLoading('auth-login-form', true);

    // Validación local
    if (!email || !password) {
      showMessage(messageContainer, 'error', CONFIG.MESSAGES.PASSWORD_REQUIRED);
      return;
    }

    if (!CONFIG.EMAIL_REGEX.test(email)) {
      showMessage(messageContainer, 'error', CONFIG.MESSAGES.EMAIL_INVALID);
      return;
    }

    // Llamar al servicio
    console.log(`[FRONT] Enviando login para ${email}, password length: ${password.length}`);
    const session = await authService.login(email, password);

    // Éxito
    showMessage(messageContainer, 'success', CONFIG.MESSAGES.LOGIN_SUCCESS);
    authService.saveSession(session);

    // Guardar email para acceso rápido
    localStorage.setItem('lastEmail', email);

    // Redirigir al dashboard (index.html)
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);

  } catch (error) {
    const message = error.message || CONFIG.MESSAGES.UNEXPECTED_ERROR;
    showMessage(messageContainer, 'error', message);
  } finally {
    showLoading('auth-login-form', false);
  }
}

/**
 * FORMULARIO SIGNUP
 * Maneja el registro de nuevo usuario
 */
async function handleSignupSubmit(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const name = formData.get('name');
  const email = formData.get('email');
  const password = formData.get('password');
  const passwordConfirm = formData.get('passwordConfirm');
  const termsAccepted = formData.get('termsAccepted');
  const messageContainer = 'auth-signup-message';

  try {
    clearMessage(messageContainer);
    // Usar feedback visual recomendado: "Creando cuenta..."
    showLoading('auth-signup-form', true, 'Creando cuenta...');

    // Validaciones locales
    if (!name || name.trim().length < 2) {
      showMessage(messageContainer, 'error', 'Nombre requerido (mínimo 2 caracteres)');
      return;
    }

    if (!CONFIG.EMAIL_REGEX.test(email)) {
      showMessage(messageContainer, 'error', CONFIG.MESSAGES.EMAIL_INVALID);
      return;
    }

    if (!AuthValidation.validateEmail(email)) {
      showMessage(messageContainer, 'error', CONFIG.MESSAGES.EMAIL_INVALID);
      return;
    }

    // Validación de contraseña
    const passwordValidation = AuthValidation.validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      const feedback = passwordValidation.feedback.join(', ');
      showMessage(messageContainer, 'error', feedback);
      return;
    }

    if (password !== passwordConfirm) {
      showMessage(messageContainer, 'error', CONFIG.MESSAGES.PASSWORDS_MISMATCH);
      return;
    }

    if (!termsAccepted) {
      showMessage(messageContainer, 'error', 'Debes aceptar los Términos y Condiciones');
      return;
    }

    // Llamar al servicio
    console.log(`[FRONT] Enviando registro para ${email}, password length: ${password.length}`);
    await authService.register({
      name,
      email,
      password,
      passwordConfirm,
      termsAccepted
    });

    // Guardar email para verificación
    localStorage.setItem(CONFIG.PENDING_EMAIL_KEY, email);

    // Éxito
    showMessage(messageContainer, 'success', CONFIG.MESSAGES.SIGNUP_SUCCESS);

    // Navegar a verificación dentro de la misma página
    setTimeout(() => {
      if (typeof switchAuthView === 'function') {
        switchAuthView('verify');
      } else {
        console.error('switchAuthView no definida');
      }
    }, 1500);

  } catch (error) {
    console.error('[DEBUG] error in handleSignupSubmit:', error);
    let message = error.message || CONFIG.MESSAGES.UNEXPECTED_ERROR;
    
    // Manejo específico de errores
    if (message.includes('already')) {
      message = CONFIG.MESSAGES.EMAIL_ALREADY_EXISTS;
    }
    if (message.includes('rate limit')) {
      message = CONFIG.MESSAGES.SIGNUP_BLOCKED;
    }

    showMessage(messageContainer, 'error', message);
  } finally {
    showLoading('auth-signup-form', false);
  }
}

/**
 * FORMULARIO EMAIL VERIFICATION
 * Maneja la verificación de email con código de 6 dígitos
 */
async function handleVerifySubmit(event) {
  event.preventDefault();

  const messageContainer = 'auth-verify-message';

  try {
    clearMessage(messageContainer);
    showLoading('auth-verify-form', true);

    // Obtener código de los inputs
    const codeInputs = document.querySelectorAll('.code-input');
    const code = Array.from(codeInputs)
      .map(input => input.value)
      .join('');

    if (code.length !== CONFIG.VERIFICATION_CODE_LENGTH) {
      showMessage(messageContainer, 'error', 'Código incompleto');
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      showMessage(messageContainer, 'error', 'El código debe contener solo números');
      return;
    }

    // Obtener email pendiente
    const email = localStorage.getItem(CONFIG.PENDING_EMAIL_KEY);
    if (!email) {
      showMessage(messageContainer, 'error', 'Email no encontrado. Intenta registrarte de nuevo.');
      return;
    }

    // Llamar al servicio
    const session = await authService.verifyEmail(email, code);

    // Éxito
    showMessage(messageContainer, 'success', CONFIG.MESSAGES.VERIFY_SUCCESS);
    authService.saveSession(session);

    // Limpiar email pending
    localStorage.removeItem(CONFIG.PENDING_EMAIL_KEY);

    // Redirigir al dashboard (index.html)
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);

  } catch (error) {
    let message = error.message || CONFIG.MESSAGES.UNEXPECTED_ERROR;
    
    if (message.includes('rate limit')) {
      message = CONFIG.MESSAGES.VERIFY_BLOCKED;
    }
    if (message.includes('expired') || message.includes('invalid')) {
      message = CONFIG.MESSAGES.EMAIL_VERIFICATION_FAILED;
    }

    showMessage(messageContainer, 'error', message);
  } finally {
    showLoading('auth-verify-form', false);
  }
}

/**
 * BOTÓN RESEND CODE
 * Reenvía el código de verificación
 */
async function handleResendCode(event) {
  // Manejar casos donde no se pase evento (onclick directo)
  if (event && event.preventDefault) {
    event.preventDefault();
  }

  // Obtener el botón - si existe event, usarlo; si no, encontrarlo
  const btn = (event && event.target) ? event.target : document.querySelector('[onclick*="handleResendCode"]');
  const messageContainer = 'auth-verify-message';

  try {
    const email = localStorage.getItem(CONFIG.PENDING_EMAIL_KEY);
    if (!email) {
      showMessage(messageContainer, 'error', 'Email no encontrado');
      return;
    }

    // Llamar al servicio
    await authService.resendVerificationCode(email);

    showMessage(messageContainer, 'success', 'Código reenviado a tu email');

    // Cooldown en botón si existe
    if (btn) {
      btn.disabled = true;
      const originalText = btn.textContent;

      for (let i = CONFIG.RESEND_COOLDOWN; i > 0; i--) {
        btn.textContent = `Reenviar en ${i}s`;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      btn.disabled = false;
      btn.textContent = originalText;
    }

  } catch (error) {
    const message = error.message || CONFIG.MESSAGES.UNEXPECTED_ERROR;
    showMessage(messageContainer, 'error', message);
  }
}

/**
 * FORMULARIO FORGOT PASSWORD
 * Maneja la solicitud de reset de contraseña
 */
async function handleForgotSubmit(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const email = formData.get('email');
  const messageContainer = 'auth-forgot-message';

  try {
    clearMessage(messageContainer);
    showLoading('auth-forgot-form', true);

    // Validación
    if (!email || !CONFIG.EMAIL_REGEX.test(email)) {
      showMessage(messageContainer, 'error', CONFIG.MESSAGES.EMAIL_INVALID);
      return;
    }

    // Llamar al servicio
    // Nota: Backend siempre devuelve éxito (anti-enumeración)
    await authService.requestPasswordReset(email);

    // Mensaje genérico (anti-enumeración)
    showMessage(messageContainer, 'success', CONFIG.MESSAGES.RESET_LINK_SENT);

    // Auto-redirigir a login
    setTimeout(() => {
      switchAuthView('login');
    }, 3000);

  } catch (error) {
    // Siempre mostrar mensaje genérico
    showMessage(messageContainer, 'success', CONFIG.MESSAGES.RESET_LINK_SENT);
  } finally {
    showLoading('auth-forgot-form', false);
  }
}

/**
 * FORMULARIO RESET PASSWORD
 * Maneja el reset de contraseña con token
 */
async function handleResetSubmit(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const newPassword = formData.get('newPassword');
  const confirmPassword = formData.get('confirmPassword');
  const messageContainer = 'auth-reset-message';

  try {
    clearMessage(messageContainer);
    showLoading('auth-reset-form', true);

    // Obtener token de la URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      showMessage(messageContainer, 'error', CONFIG.MESSAGES.RESET_TOKEN_INVALID);
      return;
    }

    // Validación de contraseña
    const passwordValidation = AuthValidation.validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      const feedback = passwordValidation.feedback.join(', ');
      showMessage(messageContainer, 'error', feedback);
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage(messageContainer, 'error', CONFIG.MESSAGES.PASSWORDS_MISMATCH);
      return;
    }

    // Llamar al servicio
    await authService.resetPassword(token, newPassword);

    // Éxito
    showMessage(messageContainer, 'success', CONFIG.MESSAGES.PASSWORD_RESET_SUCCESS);

    // Redirigir a login
    setTimeout(() => {
      switchAuthView('login');
    }, 1500);

  } catch (error) {
    let message = error.message || CONFIG.MESSAGES.UNEXPECTED_ERROR;
    
    if (message.includes('expired') || message.includes('invalid')) {
      message = CONFIG.MESSAGES.RESET_TOKEN_INVALID;
    }

    showMessage(messageContainer, 'error', message);
  } finally {
    showLoading('auth-reset-form', false);
  }
}

/**
 * LINKS DE NAVEGACIÓN
 * Manejadores para links entre vistas de autenticación
 */
function setupAuthNavigationLinks() {
  // Login → Signup
  document.getElementById('goToSignup')?.addEventListener('click', (e) => {
    e.preventDefault();
    switchAuthView('signup');
  });

  // Signup → Login
  document.getElementById('goToLogin')?.addEventListener('click', (e) => {
    e.preventDefault();
    switchAuthView('login');
  });

  // Login → Forgot Password
  document.getElementById('goToForgot')?.addEventListener('click', (e) => {
    e.preventDefault();
    switchAuthView('forgot');
  });

  // Forgot → Login
  document.getElementById('goToLoginFromForgot')?.addEventListener('click', (e) => {
    e.preventDefault();
    switchAuthView('login');
  });

  // Verify → Login
  document.getElementById('goToLoginFromVerify')?.addEventListener('click', (e) => {
    e.preventDefault();
    switchAuthView('login');
  });
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  setupAuthNavigationLinks();

  // Adjuntar formularios directamente para mayor robustez
  const signupForm = document.getElementById('auth-signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', (event) => {
      try {
        console.log('[DEBUG] Signup submit triggered');
        event.preventDefault();
        console.log('[DEBUG] Executing handleSignupSubmit');
        handleSignupSubmit(event).catch(err => {
          console.error('[DEBUG] Caught async error in handleSignupSubmit:', err);
        });
      } catch (err) {
        console.error('[DEBUG] Caught sync error in submit listener:', err);
      }
    });
  }

  const loginForm = document.getElementById('auth-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      handleLoginSubmit(event);
    });
  }

  const verifyForm = document.getElementById('auth-verify-form');
  if (verifyForm) {
    verifyForm.addEventListener('submit', (event) => {
      event.preventDefault();
      handleVerifySubmit(event);
    });
  }

  const forgotForm = document.getElementById('auth-forgot-form');
  if (forgotForm) {
    forgotForm.addEventListener('submit', (event) => {
      event.preventDefault();
      handleForgotSubmit(event);
    });
  }

  const resetForm = document.getElementById('auth-reset-form');
  if (resetForm) {
    resetForm.addEventListener('submit', (event) => {
      event.preventDefault();
      handleResetSubmit(event);
    });
  }
});
